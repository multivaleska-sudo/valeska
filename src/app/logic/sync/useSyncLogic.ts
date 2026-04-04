import { useState, useEffect, useCallback } from "react";
import Database from "@tauri-apps/plugin-sql";
import { sileo } from "sileo";

const API_URL = (import.meta as any).env.VITE_API_URL;

export interface SyncLog {
  id: string;
  timestamp: string;
  type: "PUSH" | "PULL" | "SYNC";
  status: "COMPLETED" | "ERROR" | "PENDING";
  user: string;
  machine: string;
  title: string;
  details: string;
}

export interface SyncContext {
  title: string;
  details?: string;
}

export function useSyncLogic() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncStats, setSyncStats] = useState({
    push: {
      sucursales: 0,
      dispositivos: 0,
      usuarios: 0,
      tramites: 0,
      otros: 0,
    },
    pull: {
      sucursales: 0,
      dispositivos: 0,
      usuarios: 0,
      tramites: 0,
      otros: 0,
    },
  });
  const [syncHistory, setSyncHistory] = useState<SyncLog[]>([]);

  useEffect(() => {
    const handleUpdate = () => {
      const savedTime = localStorage.getItem("valeska_last_sync_display");
      if (savedTime) setLastSyncTime(savedTime);
      const savedStatsStr = localStorage.getItem("valeska_sync_stats");
      if (savedStatsStr) setSyncStats(JSON.parse(savedStatsStr));
      const savedHistory = localStorage.getItem("valeska_sync_history");
      if (savedHistory) setSyncHistory(JSON.parse(savedHistory));
    };

    handleUpdate();
    window.addEventListener("valeska_sync_completed", handleUpdate);
    return () =>
      window.removeEventListener("valeska_sync_completed", handleUpdate);
  }, []);

  const triggerSync = useCallback(async (context?: SyncContext) => {
    setIsSyncing(true);
    setSyncError(null);

    try {
      const sessionStr = localStorage.getItem("valeska_session_user");
      if (!sessionStr) throw new Error("No hay sesión activa");
      const session = JSON.parse(sessionStr);

      const sqlite = await Database.load("sqlite:valeska.db");
      const dispResult: any[] = await sqlite.select(
        "SELECT nombre_equipo FROM dispositivos LIMIT 1",
      );
      const machineName = dispResult[0]?.nombre_equipo || "PC-DESCONOCIDA";

      const lastSyncIso = localStorage.getItem("valeska_last_sync_iso") || "";

      // =========================================================
      // PULL (Descargar de la Nube)
      // =========================================================
      const pullRes = await fetch(
        `${API_URL}/sync/pull?lastSync=${encodeURIComponent(lastSyncIso)}`,
        {
          headers: { "x-user-id": session.id },
        },
      );

      if (pullRes.status === 401) {
        await sqlite.execute(
          "UPDATE usuarios SET esta_activo = 0 WHERE id = $1",
          [session.id],
        );
        localStorage.removeItem("valeska_session_user");
        sileo.error({
          title: "Sesión Expirada",
          description:
            "Tu sesión ha expirado o tu dispositivo ha sido desvinculado.",
        });
        window.location.href = "/auth/login";
        return false;
      }

      if (!pullRes.ok) throw new Error(`Error en PULL: ${pullRes.statusText}`);
      const pullData = await pullRes.json();

      // Inserciones (Pull) - Seguridad
      for (const suc of pullData.sucursales || []) {
        await sqlite.execute(
          "INSERT OR REPLACE INTO sucursales (id, nombre, direccion, es_central, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6)",
          [
            suc.id,
            suc.nombre,
            suc.direccion || "",
            suc.esCentral ? 1 : 0,
            suc.createdAt,
            suc.updatedAt,
          ],
        );
      }
      for (const disp of pullData.dispositivos || []) {
        await sqlite.execute(
          "INSERT OR REPLACE INTO dispositivos (id, mac_address, nombre_equipo, autorizado, sucursal_id, provision_id, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
          [
            disp.id,
            disp.macAddress,
            disp.nombreEquipo,
            disp.autorizado ? 1 : 0,
            disp.sucursalId,
            disp.provisionId,
            disp.createdAt,
            disp.updatedAt,
          ],
        );
      }
      for (const usr of pullData.usuarios || []) {
        await sqlite.execute(
          "INSERT OR REPLACE INTO usuarios (id, username, password_hash, rol, nombre_completo, esta_activo, dispositivo_id, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
          [
            usr.id,
            usr.username,
            usr.passwordHash,
            usr.rol,
            usr.nombreCompleto,
            usr.estaActivo ? 1 : 0,
            usr.dispositivoId,
            usr.createdAt,
            usr.updatedAt,
          ],
        );
      }

      // Inserciones (Pull) - Catálogos
      for (const c of pullData.catalogoTiposTramite || []) {
        await sqlite.execute(
          "INSERT OR REPLACE INTO catalogo_tipos_tramite (id, nombre, activo, created_at, updated_at, deleted_at, sync_status) VALUES ($1, $2, $3, $4, $5, $6, 'SYNCED')",
          [
            c.id,
            c.nombre,
            c.activo ? 1 : 0,
            c.createdAt,
            c.updatedAt,
            c.deletedAt,
          ],
        );
      }
      for (const s of pullData.catalogoSituaciones || []) {
        await sqlite.execute(
          "INSERT OR REPLACE INTO catalogo_situaciones (id, nombre, color_hex, activo, created_at, updated_at, deleted_at, sync_status) VALUES ($1, $2, $3, $4, $5, $6, $7, 'SYNCED')",
          [
            s.id,
            s.nombre,
            s.colorHex,
            s.activo ? 1 : 0,
            s.createdAt,
            s.updatedAt,
            s.deletedAt,
          ],
        );
      }

      // Inserciones (Pull) - Maestros
      for (const cli of pullData.clientes || []) {
        await sqlite.execute(
          "INSERT OR REPLACE INTO clientes (id, tipo_documento, numero_documento, razon_social_nombres, estado_civil, domicilio, telefono, created_at, updated_at, deleted_at, sync_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'SYNCED')",
          [
            cli.id,
            cli.tipoDocumento,
            cli.numeroDocumento,
            cli.razonSocialNombres,
            cli.estadoCivil,
            cli.domicilio,
            cli.telefono,
            cli.createdAt,
            cli.updatedAt,
            cli.deletedAt,
          ],
        );
      }
      for (const v of pullData.vehiculos || []) {
        await sqlite.execute(
          "INSERT OR REPLACE INTO vehiculos (id, chasis_vin, placa, motor, marca, modelo, color, categoria, anio_fabricacion, anio_modelo, created_at, updated_at, deleted_at, sync_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'SYNCED')",
          [
            v.id,
            v.chasisVin,
            v.placa,
            v.motor,
            v.marca,
            v.modelo,
            v.color,
            v.categoria,
            v.anioFabricacion,
            v.anioModelo,
            v.createdAt,
            v.updatedAt,
            v.deletedAt,
          ],
        );
      }
      for (const emp of pullData.empresasGestoras || []) {
        await sqlite.execute(
          "INSERT OR REPLACE INTO empresas_gestoras (id, ruc, razon_social, direccion, created_at, updated_at, deleted_at, sync_status) VALUES ($1, $2, $3, $4, $5, $6, $7, 'SYNCED')",
          [
            emp.id,
            emp.ruc,
            emp.razonSocial,
            emp.direccion,
            emp.createdAt,
            emp.updatedAt,
            emp.deletedAt,
          ],
        );
      }
      for (const pre of pullData.presentantes || []) {
        await sqlite.execute(
          "INSERT OR REPLACE INTO presentantes (id, partida_registral, oficina_registral, domicilio, dni, primer_apellido, segundo_apellido, nombres, created_at, updated_at, deleted_at, sync_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'SYNCED')",
          [
            pre.id,
            pre.partidaRegistral,
            pre.oficinaRegistral,
            pre.domicilio,
            pre.dni,
            pre.primerApellido,
            pre.segundoApellido,
            pre.nombres,
            pre.createdAt,
            pre.updatedAt,
            pre.deletedAt,
          ],
        );
      }
      for (const tpl of pullData.plantillasDocumentos || []) {
        await sqlite.execute(
          "INSERT OR REPLACE INTO plantillas_documentos (id, nombre_documento, contenido_html, orientacion_papel, activo, created_at, updated_at, deleted_at, sync_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'SYNCED')",
          [
            tpl.id,
            tpl.nombreDocumento,
            tpl.contenidoHtml,
            tpl.orientacionPapel,
            tpl.activo ? 1 : 0,
            tpl.createdAt,
            tpl.updatedAt,
            tpl.deletedAt,
          ],
        );
      }

      // Inserciones (Pull) - Core Trámites
      for (const t of pullData.tramites || []) {
        await sqlite.execute(
          "INSERT OR REPLACE INTO tramites (id, codigo_verificacion, tramite_anio, cliente_id, vehiculo_id, tipo_tramite_id, situacion_id, usuario_creador_id, sucursal_id, n_titulo, n_formato, fecha_presentacion, observaciones_generales, tarjeta_en_oficina, fecha_tarjeta_en_oficina, placa_en_oficina, fecha_placa_en_oficina, entrego_tarjeta, fecha_entrega_tarjeta, metodo_entrega_tarjeta, entrego_placa, fecha_entrega_placa, metodo_entrega_placa, observacion_placa, created_at, updated_at, deleted_at, sync_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, 'SYNCED')",
          [
            t.id,
            t.codigoVerificacion,
            t.tramiteAnio,
            t.clienteId,
            t.vehiculoId,
            t.tipoTramiteId,
            t.situacionId,
            t.usuarioCreadorId,
            t.sucursalId,
            t.nTitulo,
            t.nFormato,
            t.fechaPresentacion,
            t.observacionesGenerales,
            t.tarjetaEnOficina ? 1 : 0,
            t.fechaTarjetaEnOficina,
            t.placaEnOficina ? 1 : 0,
            t.fechaPlacaEnOficina,
            t.entregoTarjeta ? 1 : 0,
            t.fechaEntregaTarjeta,
            t.metodoEntregaTarjeta,
            t.entregoPlaca ? 1 : 0,
            t.fechaEntregaPlaca,
            t.metodoEntregaPlaca,
            t.observacionPlaca,
            t.createdAt,
            t.updatedAt,
            t.deletedAt,
          ],
        );
      }
      for (const td of pullData.tramiteDetalles || []) {
        await sqlite.execute(
          "INSERT OR REPLACE INTO tramite_detalles (id, tramite_id, empresa_gestora_id, presentante_id, tipo_boleta, numero_boleta, fecha_boleta, dua, num_formato_inmatriculacion, numero_recibo_tramite, clausula_monto, clausula_forma_pago, clausula_pago_bancarizado, aclaracion_dice, aclaracion_debe_decir, created_at, updated_at, deleted_at, sync_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, 'SYNCED')",
          [
            td.id,
            td.tramiteId,
            td.empresaGestoraId,
            td.presentanteId,
            td.tipoBoleta,
            td.numeroBoleta,
            td.fechaBoleta,
            td.dua,
            td.numFormatoInmatriculacion,
            td.numeroReciboTramite,
            td.clausulaMonto,
            td.clausulaFormaPago,
            td.clausulaPagoBancarizado,
            td.aclaracionDice,
            td.aclaracionDebeDecir,
            td.createdAt,
            td.updatedAt,
            td.deletedAt,
          ],
        );
      }

      // =========================================================
      // PUSH (Subir a la Nube)
      // =========================================================
      const formatDateForNest = (val: any) => {
        if (!val) return null;
        if (typeof val === "number") {
          const ms = val < 10000000000 ? val * 1000 : val;
          return new Date(ms).toISOString();
        }
        return new Date(val).toISOString();
      };

      const sucursalesRaw: any[] = await sqlite.select(
        "SELECT * FROM sucursales",
      );
      const dispositivosRaw: any[] = await sqlite.select(
        "SELECT * FROM dispositivos",
      );
      const usuariosRaw: any[] = await sqlite.select("SELECT * FROM usuarios");
      const catTiposRaw: any[] = await sqlite.select(
        "SELECT * FROM catalogo_tipos_tramite",
      );
      const catSitRaw: any[] = await sqlite.select(
        "SELECT * FROM catalogo_situaciones",
      );
      const clientesRaw: any[] = await sqlite.select("SELECT * FROM clientes");
      const vehiculosRaw: any[] = await sqlite.select(
        "SELECT * FROM vehiculos",
      );
      const empresasRaw: any[] = await sqlite.select(
        "SELECT * FROM empresas_gestoras",
      );
      const presentantesRaw: any[] = await sqlite.select(
        "SELECT * FROM presentantes",
      );
      const plantillasRaw: any[] = await sqlite.select(
        "SELECT * FROM plantillas_documentos",
      );
      const tramitesRaw: any[] = await sqlite.select("SELECT * FROM tramites");
      const tramDetallesRaw: any[] = await sqlite.select(
        "SELECT * FROM tramite_detalles",
      );

      const payload = {
        sucursales: sucursalesRaw.map((s) => ({
          id: s.id,
          nombre: s.nombre,
          direccion: s.direccion,
          esCentral: s.es_central === 1 || s.es_central === true,
          createdAt: formatDateForNest(s.created_at),
          updatedAt: formatDateForNest(s.updated_at),
          deletedAt: formatDateForNest(s.deleted_at),
        })),
        dispositivos: dispositivosRaw.map((d) => ({
          id: d.id,
          macAddress: d.mac_address,
          nombreEquipo: d.nombre_equipo,
          autorizado: d.autorizado === 1 || d.autorizado === true,
          provisionId: d.provision_id,
          sucursalId: d.sucursal_id,
          createdAt: formatDateForNest(d.created_at),
          updatedAt: formatDateForNest(d.updated_at),
          deletedAt: formatDateForNest(d.deleted_at),
        })),
        usuarios: usuariosRaw.map((u) => ({
          id: u.id,
          username: u.username,
          passwordHash: u.password_hash,
          rol: u.rol,
          nombreCompleto: u.nombre_completo,
          estaActivo: u.esta_activo === 1 || u.esta_activo === true,
          dispositivoId: u.dispositivo_id,
          createdAt: formatDateForNest(u.created_at),
          updatedAt: formatDateForNest(u.updated_at),
          deletedAt: formatDateForNest(u.deleted_at),
        })),

        catalogoTiposTramite: catTiposRaw.map((c) => ({
          id: c.id,
          nombre: c.nombre,
          activo: c.activo === 1 || c.activo === true,
          createdAt: formatDateForNest(c.created_at),
          updatedAt: formatDateForNest(c.updated_at),
          deletedAt: formatDateForNest(c.deleted_at),
          syncStatus: c.sync_status,
        })),
        catalogoSituaciones: catSitRaw.map((c) => ({
          id: c.id,
          nombre: c.nombre,
          colorHex: c.color_hex,
          activo: c.activo === 1 || c.activo === true,
          createdAt: formatDateForNest(c.created_at),
          updatedAt: formatDateForNest(c.updated_at),
          deletedAt: formatDateForNest(c.deleted_at),
          syncStatus: c.sync_status,
        })),
        clientes: clientesRaw.map((c) => ({
          id: c.id,
          tipoDocumento: c.tipo_documento,
          numeroDocumento: c.numero_documento,
          razonSocialNombres: c.razon_social_nombres,
          estadoCivil: c.estado_civil,
          domicilio: c.domicilio,
          telefono: c.telefono,
          createdAt: formatDateForNest(c.created_at),
          updatedAt: formatDateForNest(c.updated_at),
          deletedAt: formatDateForNest(c.deleted_at),
          syncStatus: c.sync_status,
        })),
        vehiculos: vehiculosRaw.map((v) => ({
          id: v.id,
          chasisVin: v.chasis_vin,
          placa: v.placa,
          motor: v.motor,
          marca: v.marca,
          modelo: v.modelo,
          color: v.color,
          categoria: v.categoria,
          anioFabricacion: v.anio_fabricacion,
          anioModelo: v.anio_modelo,
          createdAt: formatDateForNest(v.created_at),
          updatedAt: formatDateForNest(v.updated_at),
          deletedAt: formatDateForNest(v.deleted_at),
          syncStatus: v.sync_status,
        })),
        empresasGestoras: empresasRaw.map((e) => ({
          id: e.id,
          ruc: e.ruc,
          razonSocial: e.razon_social,
          direccion: e.direccion,
          createdAt: formatDateForNest(e.created_at),
          updatedAt: formatDateForNest(e.updated_at),
          deletedAt: formatDateForNest(e.deleted_at),
          syncStatus: e.sync_status,
        })),
        presentantes: presentantesRaw.map((p) => ({
          id: p.id,
          partidaRegistral: p.partida_registral,
          oficinaRegistral: p.oficina_registral,
          domicilio: p.domicilio,
          dni: p.dni,
          primerApellido: p.primer_apellido,
          segundoApellido: p.segundo_apellido,
          nombres: p.nombres,
          createdAt: formatDateForNest(p.created_at),
          updatedAt: formatDateForNest(p.updated_at),
          deletedAt: formatDateForNest(p.deleted_at),
          syncStatus: p.sync_status,
        })),
        plantillasDocumentos: plantillasRaw.map((p) => ({
          id: p.id,
          nombreDocumento: p.nombre_documento,
          contenidoHtml: p.contenido_html,
          orientacionPapel: p.orientacion_papel,
          activo: p.activo === 1 || p.activo === true,
          createdAt: formatDateForNest(p.created_at),
          updatedAt: formatDateForNest(p.updated_at),
          deletedAt: formatDateForNest(p.deleted_at),
          syncStatus: p.sync_status,
        })),

        tramites: tramitesRaw.map((t) => ({
          id: t.id,
          codigoVerificacion: t.codigo_verificacion,
          tramiteAnio: t.tramite_anio,
          clienteId: t.cliente_id,
          vehiculoId: t.vehiculo_id,
          tipoTramiteId: t.tipo_tramite_id,
          situacionId: t.situacion_id,
          usuarioCreadorId: t.usuario_creador_id,
          sucursalId: t.sucursal_id,
          nTitulo: t.n_titulo,
          nFormato: t.n_formato,
          fechaPresentacion: t.fecha_presentacion,
          observacionesGenerales: t.observaciones_generales,
          tarjetaEnOficina:
            t.tarjeta_en_oficina === 1 || t.tarjeta_en_oficina === true,
          fechaTarjetaEnOficina: t.fecha_tarjeta_en_oficina,
          placaEnOficina:
            t.placa_en_oficina === 1 || t.placa_en_oficina === true,
          fechaPlacaEnOficina: t.fecha_placa_en_oficina,
          entregoTarjeta: t.entrego_tarjeta === 1 || t.entrego_tarjeta === true,
          fechaEntregaTarjeta: t.fecha_entrega_tarjeta,
          metodoEntregaTarjeta: t.metodo_entrega_tarjeta,
          entregoPlaca: t.entrego_placa === 1 || t.entrego_placa === true,
          fechaEntregaPlaca: t.fecha_entrega_placa,
          metodoEntregaPlaca: t.metodo_entrega_placa,
          observacionPlaca: t.observacion_placa,
          createdAt: formatDateForNest(t.created_at),
          updatedAt: formatDateForNest(t.updated_at),
          deletedAt: formatDateForNest(t.deleted_at),
          syncStatus: t.sync_status,
        })),
        tramiteDetalles: tramDetallesRaw.map((td) => ({
          id: td.id,
          tramiteId: td.tramite_id,
          empresaGestoraId: td.empresa_gestora_id,
          presentanteId: td.presentante_id,
          tipoBoleta: td.tipo_boleta,
          numeroBoleta: td.numero_boleta,
          fechaBoleta: td.fecha_boleta,
          dua: td.dua,
          numFormatoInmatriculacion: td.num_formato_inmatriculacion,
          numeroReciboTramite: td.numero_recibo_tramite,
          clausulaMonto: td.clausula_monto,
          clausulaFormaPago: td.clausula_forma_pago,
          clausulaPagoBancarizado: td.clausula_pago_bancarizado,
          aclaracionDice: td.aclaracion_dice,
          aclaracionDebeDecir: td.aclaracion_debe_decir,
          createdAt: formatDateForNest(td.created_at),
          updatedAt: formatDateForNest(td.updated_at),
          deletedAt: formatDateForNest(td.deleted_at),
          syncStatus: td.sync_status,
        })),
      };

      const pushRes = await fetch(`${API_URL}/sync/push`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": session.id,
        },
        body: JSON.stringify(payload),
      });

      if (!pushRes.ok) throw new Error(`Error en PUSH: ${pushRes.statusText}`);
      const pushData = await pushRes.json();

      // =========================================================
      // AUDITORÍA Y ESTADÍSTICAS
      // =========================================================
      const now = new Date();
      const displayTime = now.toLocaleString("es-PE", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      localStorage.setItem(
        "valeska_last_sync_iso",
        pushData.timestamp || now.toISOString(),
      );
      localStorage.setItem("valeska_last_sync_display", displayTime);

      const totalPushOtros =
        payload.catalogoTiposTramite.length +
        payload.catalogoSituaciones.length +
        payload.clientes.length +
        payload.vehiculos.length +
        payload.empresasGestoras.length +
        payload.presentantes.length +
        payload.plantillasDocumentos.length;

      const currentStats = {
        push: {
          sucursales: payload.sucursales.length,
          dispositivos: payload.dispositivos.length,
          usuarios: payload.usuarios.length,
          tramites: payload.tramites.length,
          otros: totalPushOtros,
        },
        pull: {
          sucursales: pullData.sucursales?.length || 0,
          dispositivos: pullData.dispositivos?.length || 0,
          usuarios: pullData.usuarios?.length || 0,
          tramites: pullData.tramites?.length || 0,
          otros: 0,
        },
      };
      localStorage.setItem("valeska_sync_stats", JSON.stringify(currentStats));

      const logTitle = context?.title || "Sincronización General Completada";
      let logDetails = `Trámites subidos: ${payload.tramites.length}. Catálogos y Maestros: ${totalPushOtros}.`;
      if (context?.details) logDetails = `${context.details} | ${logDetails}`;

      const newLog: SyncLog = {
        id: crypto.randomUUID(),
        timestamp: displayTime,
        type: "SYNC",
        status: "COMPLETED",
        user: session.nombre,
        machine: machineName,
        title: logTitle,
        details: logDetails,
      };

      const prevHistoryRaw = localStorage.getItem("valeska_sync_history");
      const prevHistory: SyncLog[] = prevHistoryRaw
        ? JSON.parse(prevHistoryRaw)
        : [];
      localStorage.setItem(
        "valeska_sync_history",
        JSON.stringify([newLog, ...prevHistory].slice(0, 50)),
      );

      await sqlite.execute(
        "UPDATE tramites SET sync_status = 'SYNCED' WHERE sync_status != 'SYNCED'",
      );
      await sqlite.execute(
        "UPDATE tramite_detalles SET sync_status = 'SYNCED' WHERE sync_status != 'SYNCED'",
      );

      window.dispatchEvent(new Event("valeska_sync_completed"));
      sileo.success({
        title: logTitle,
        description: "La sincronización finalizó correctamente.",
      });
      return true;
    } catch (error: any) {
      console.error("Error en sincronización:", error);
      const msg = error.message || "No se pudo conectar con la nube central.";
      setSyncError(msg);
      sileo.error({ title: "Error de Sincronización", description: msg });
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  return {
    isSyncing,
    lastSyncTime,
    syncError,
    syncStats,
    syncHistory,
    triggerSync,
  };
}
