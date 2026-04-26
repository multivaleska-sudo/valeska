const executeWithRetry = async (
  db: any,
  query: string,
  params: any[],
  retries = 3,
) => {
  let lastError: any;
  for (let i = 0; i < retries; i++) {
    try {
      await db.execute(query, params);
      return true; // Éxito total
    } catch (error: any) {
      lastError = error;
      const msg = error?.message || "";

      // Manejo de bloqueos (Deadlocks)
      if (msg.includes("database is locked") || msg.includes("busy")) {
        await new Promise((res) => setTimeout(res, 50 + Math.random() * 100));
      } else {
        // ESCUDO TOTAL: Si SQLite rechaza la fila (ej. huérfana), la ignoramos y seguimos.
        console.warn(`⚠️ [PULL SYNC] Fila ignorada por la BD: ${msg}`);
        return false;
      }
    }
  }
  return false;
};

export async function processPullSync(sqlite: any, pullData: any) {
  const fk = (val: any) => (!val || val === "" ? null : val);
  const str = (val: any) => (val === undefined ? null : val);

  // APAGAMOS LAS REGLAS DE LLAVES FORÁNEAS (Para evitar rechazos por orden de llegada)
  await sqlite.execute("PRAGMA foreign_keys = OFF;");

  try {
    // 1. Entidades Base y Seguridad
    // NOTA MAESTRA: Todo tiene "WHERE <tabla>.sync_status = 'SYNCED'"
    // Esto es el ESCUDO para que la nube NO aplaste tus ediciones locales.

    for (const suc of pullData.sucursales || []) {
      const esCentral = suc.esCentral ?? suc.es_central ?? false;
      await executeWithRetry(
        sqlite,
        `INSERT INTO sucursales (id, nombre, direccion, es_central, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT(id) DO UPDATE SET 
         nombre=excluded.nombre, direccion=excluded.direccion, es_central=excluded.es_central, 
         created_at=excluded.created_at, updated_at=excluded.updated_at
         WHERE sucursales.sync_status = 'SYNCED'`,
        [
          str(suc.id),
          str(suc.nombre),
          str(suc.direccion) || "",
          esCentral ? 1 : 0,
          str(suc.createdAt ?? suc.created_at),
          str(suc.updatedAt ?? suc.updated_at),
        ],
      );
    }

    for (const disp of pullData.dispositivos || []) {
      const autorizado = disp.autorizado ?? true;
      await executeWithRetry(
        sqlite,
        `INSERT INTO dispositivos (id, mac_address, nombre_equipo, autorizado, sucursal_id, provision_id, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT(id) DO UPDATE SET 
         mac_address=excluded.mac_address, nombre_equipo=excluded.nombre_equipo, autorizado=excluded.autorizado, 
         sucursal_id=excluded.sucursal_id, provision_id=excluded.provision_id, created_at=excluded.created_at, updated_at=excluded.updated_at
         WHERE dispositivos.sync_status = 'SYNCED'`,
        [
          str(disp.id),
          str(disp.macAddress ?? disp.mac_address),
          str(disp.nombreEquipo ?? disp.nombre_equipo),
          autorizado ? 1 : 0,
          fk(disp.sucursalId ?? disp.sucursal_id),
          fk(disp.provisionId ?? disp.provision_id),
          str(disp.createdAt ?? disp.created_at),
          str(disp.updatedAt ?? disp.updated_at),
        ],
      );
    }

    for (const usr of pullData.usuarios || []) {
      const isActivo = usr.estaActivo ?? usr.esta_activo ?? true;
      const pwdHash = usr.passwordHash ?? usr.password_hash;
      const nombreCompl = usr.nombreCompleto ?? usr.nombre_completo;
      const dispId = usr.dispositivoId ?? usr.dispositivo_id;

      await executeWithRetry(
        sqlite,
        `INSERT INTO usuarios (id, username, password_hash, rol, nombre_completo, esta_activo, dispositivo_id, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT(id) DO UPDATE SET 
         username=excluded.username, password_hash=excluded.password_hash, rol=excluded.rol, nombre_completo=excluded.nombre_completo, 
         esta_activo=excluded.esta_activo, dispositivo_id=excluded.dispositivo_id, created_at=excluded.created_at, updated_at=excluded.updated_at
         WHERE usuarios.sync_status = 'SYNCED'`,
        [
          str(usr.id),
          str(usr.username),
          str(pwdHash),
          str(usr.rol),
          str(nombreCompl),
          isActivo ? 1 : 0,
          fk(dispId),
          str(usr.createdAt ?? usr.created_at),
          str(usr.updatedAt ?? usr.updated_at),
        ],
      );
    }

    // 2. Catálogos Dinámicos
    for (const c of pullData.catalogoTiposTramite || []) {
      const isActivo = c.activo ?? true;
      await executeWithRetry(
        sqlite,
        `INSERT INTO catalogo_tipos_tramite (id, nombre, activo, created_at, updated_at, deleted_at, sync_status) 
         VALUES ($1, $2, $3, $4, $5, $6, 'SYNCED')
         ON CONFLICT(id) DO UPDATE SET 
         nombre=excluded.nombre, activo=excluded.activo, created_at=excluded.created_at, 
         updated_at=excluded.updated_at, deleted_at=excluded.deleted_at, sync_status=excluded.sync_status
         WHERE catalogo_tipos_tramite.sync_status = 'SYNCED'`,
        [
          str(c.id),
          str(c.nombre),
          isActivo ? 1 : 0,
          str(c.createdAt ?? c.created_at),
          str(c.updatedAt ?? c.updated_at),
          str(c.deletedAt ?? c.deleted_at),
        ],
      );
    }

    for (const s of pullData.catalogoSituaciones || []) {
      const isActivo = s.activo ?? true;
      await executeWithRetry(
        sqlite,
        `INSERT INTO catalogo_situaciones (id, nombre, color_hex, activo, created_at, updated_at, deleted_at, sync_status) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'SYNCED')
         ON CONFLICT(id) DO UPDATE SET 
         nombre=excluded.nombre, color_hex=excluded.color_hex, activo=excluded.activo, created_at=excluded.created_at, 
         updated_at=excluded.updated_at, deleted_at=excluded.deleted_at, sync_status=excluded.sync_status
         WHERE catalogo_situaciones.sync_status = 'SYNCED'`,
        [
          str(s.id),
          str(s.nombre),
          str(s.colorHex ?? s.color_hex),
          isActivo ? 1 : 0,
          str(s.createdAt ?? s.created_at),
          str(s.updatedAt ?? s.updated_at),
          str(s.deletedAt ?? s.deleted_at),
        ],
      );
    }

    // 3. Maestros
    for (const cli of pullData.clientes || []) {
      await executeWithRetry(
        sqlite,
        `INSERT INTO clientes (id, tipo_documento, numero_documento, razon_social_nombres, estado_civil, domicilio, telefono, created_at, updated_at, deleted_at, sync_status) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'SYNCED')
         ON CONFLICT(id) DO UPDATE SET 
         tipo_documento=excluded.tipo_documento, numero_documento=excluded.numero_documento, razon_social_nombres=excluded.razon_social_nombres, 
         estado_civil=excluded.estado_civil, domicilio=excluded.domicilio, telefono=excluded.telefono, created_at=excluded.created_at, 
         updated_at=excluded.updated_at, deleted_at=excluded.deleted_at, sync_status=excluded.sync_status
         WHERE clientes.sync_status = 'SYNCED'`,
        [
          str(cli.id),
          str(cli.tipoDocumento ?? cli.tipo_documento),
          str(cli.numeroDocumento ?? cli.numero_documento),
          str(cli.razonSocialNombres ?? cli.razon_social_nombres),
          str(cli.estadoCivil ?? cli.estado_civil),
          str(cli.domicilio),
          str(cli.telefono),
          str(cli.createdAt ?? cli.created_at),
          str(cli.updatedAt ?? cli.updated_at),
          str(cli.deletedAt ?? cli.deleted_at),
        ],
      );
    }

    for (const v of pullData.vehiculos || []) {
      await executeWithRetry(
        sqlite,
        `INSERT INTO vehiculos (id, chasis_vin, placa, motor, marca, modelo, color, categoria, anio_fabricacion, anio_modelo, created_at, updated_at, deleted_at, sync_status) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'SYNCED')
         ON CONFLICT(id) DO UPDATE SET 
         chasis_vin=excluded.chasis_vin, placa=excluded.placa, motor=excluded.motor, marca=excluded.marca, modelo=excluded.modelo, 
         color=excluded.color, categoria=excluded.categoria, anio_fabricacion=excluded.anio_fabricacion, anio_modelo=excluded.anio_modelo, 
         created_at=excluded.created_at, updated_at=excluded.updated_at, deleted_at=excluded.deleted_at, sync_status=excluded.sync_status
         WHERE vehiculos.sync_status = 'SYNCED'`,
        [
          str(v.id),
          str(v.chasisVin ?? v.chasis_vin),
          str(v.placa),
          str(v.motor),
          str(v.marca),
          str(v.modelo),
          str(v.color),
          str(v.categoria),
          str(v.anioFabricacion ?? v.anio_fabricacion),
          str(v.anioModelo ?? v.anio_modelo),
          str(v.createdAt ?? v.created_at),
          str(v.updatedAt ?? v.updated_at),
          str(v.deletedAt ?? v.deleted_at),
        ],
      );
    }

    for (const emp of pullData.empresasGestoras || []) {
      await executeWithRetry(
        sqlite,
        `INSERT INTO empresas_gestoras (id, ruc, razon_social, direccion, created_at, updated_at, deleted_at, sync_status) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'SYNCED')
         ON CONFLICT(id) DO UPDATE SET 
         ruc=excluded.ruc, razon_social=excluded.razon_social, direccion=excluded.direccion, 
         created_at=excluded.created_at, updated_at=excluded.updated_at, deleted_at=excluded.deleted_at, sync_status=excluded.sync_status
         WHERE empresas_gestoras.sync_status = 'SYNCED'`,
        [
          str(emp.id),
          str(emp.ruc),
          str(emp.razonSocial ?? emp.razon_social),
          str(emp.direccion),
          str(emp.createdAt ?? emp.created_at),
          str(emp.updatedAt ?? emp.updated_at),
          str(emp.deletedAt ?? emp.deleted_at),
        ],
      );
    }

    for (const rep of pullData.representantesLegales || []) {
      await executeWithRetry(
        sqlite,
        `INSERT INTO representantes_legales (id, empresa_gestora_id, dni, nombres, primer_apellido, segundo_apellido, partida_registral, oficina_registral, domicilio, created_at, updated_at, deleted_at, sync_status) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'SYNCED')
         ON CONFLICT(id) DO UPDATE SET 
         empresa_gestora_id=excluded.empresa_gestora_id, dni=excluded.dni, nombres=excluded.nombres, primer_apellido=excluded.primer_apellido, 
         segundo_apellido=excluded.segundo_apellido, partida_registral=excluded.partida_registral, oficina_registral=excluded.oficina_registral, 
         domicilio=excluded.domicilio, created_at=excluded.created_at, updated_at=excluded.updated_at, deleted_at=excluded.deleted_at, sync_status=excluded.sync_status
         WHERE representantes_legales.sync_status = 'SYNCED'`,
        [
          str(rep.id),
          fk(rep.empresaGestoraId ?? rep.empresa_gestora_id),
          str(rep.dni) || "S/N",
          str(rep.nombres) || "S/N",
          str(rep.primerApellido ?? rep.primer_apellido) || "S/N",
          str(rep.segundoApellido ?? rep.segundo_apellido),
          str(rep.partidaRegistral ?? rep.partida_registral),
          str(rep.oficinaRegistral ?? rep.oficina_registral),
          str(rep.domicilio),
          str(rep.createdAt ?? rep.created_at),
          str(rep.updatedAt ?? rep.updated_at),
          str(rep.deletedAt ?? rep.deleted_at),
        ],
      );
    }

    for (const pre of pullData.presentantes || []) {
      await executeWithRetry(
        sqlite,
        `INSERT INTO presentantes (id, dni, primer_apellido, segundo_apellido, nombres, created_at, updated_at, deleted_at, sync_status) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'SYNCED')
         ON CONFLICT(id) DO UPDATE SET 
         dni=excluded.dni, primer_apellido=excluded.primer_apellido, segundo_apellido=excluded.segundo_apellido, nombres=excluded.nombres, 
         created_at=excluded.created_at, updated_at=excluded.updated_at, deleted_at=excluded.deleted_at, sync_status=excluded.sync_status
         WHERE presentantes.sync_status = 'SYNCED'`,
        [
          str(pre.id),
          str(pre.dni) || "S/N",
          str(pre.primerApellido ?? pre.primer_apellido) || "S/N",
          str(pre.segundoApellido ?? pre.segundo_apellido),
          str(pre.nombres) || "S/N",
          str(pre.createdAt ?? pre.created_at),
          str(pre.updatedAt ?? pre.updated_at),
          str(pre.deletedAt ?? pre.deleted_at),
        ],
      );
    }

    for (const tpl of pullData.plantillasDocumentos || []) {
      const isActivo = tpl.activo ?? true;
      await executeWithRetry(
        sqlite,
        `INSERT INTO plantillas_documentos (id, nombre_documento, contenido_html, orientacion_papel, activo, created_at, updated_at, deleted_at, sync_status) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'SYNCED')
         ON CONFLICT(id) DO UPDATE SET 
         nombre_documento=excluded.nombre_documento, contenido_html=excluded.contenido_html, orientacion_papel=excluded.orientacion_papel, 
         activo=excluded.activo, created_at=excluded.created_at, updated_at=excluded.updated_at, deleted_at=excluded.deleted_at, sync_status=excluded.sync_status
         WHERE plantillas_documentos.sync_status = 'SYNCED'`,
        [
          str(tpl.id),
          str(tpl.nombreDocumento ?? tpl.nombre_documento),
          str(tpl.contenidoHtml ?? tpl.contenido_html),
          str(tpl.orientacionPapel ?? tpl.orientacion_papel),
          isActivo ? 1 : 0,
          str(tpl.createdAt ?? tpl.created_at),
          str(tpl.updatedAt ?? tpl.updated_at),
          str(tpl.deletedAt ?? tpl.deleted_at),
        ],
      );
    }

    for (const msgTpl of pullData.messageTemplates || []) {
      await executeWithRetry(
        sqlite,
        `INSERT INTO message_templates (id, name, content, created_at, updated_at, deleted_at, sync_status) 
         VALUES ($1, $2, $3, $4, $5, $6, 'SYNCED')
         ON CONFLICT(id) DO UPDATE SET 
         name=excluded.name, content=excluded.content, created_at=excluded.created_at, 
         updated_at=excluded.updated_at, deleted_at=excluded.deleted_at, sync_status=excluded.sync_status
         WHERE message_templates.sync_status = 'SYNCED'`,
        [
          str(msgTpl.id),
          str(msgTpl.name),
          str(msgTpl.content),
          str(msgTpl.createdAt ?? msgTpl.created_at),
          str(msgTpl.updatedAt ?? msgTpl.updated_at),
          str(msgTpl.deletedAt ?? msgTpl.deleted_at),
        ],
      );
    }

    // 4. Core Trámites (Si alguno falla, lo omitimos, el resto pasa)
    for (const t of pullData.tramites || []) {
      await executeWithRetry(
        sqlite,
        `INSERT INTO tramites (id, codigo_verificacion, tramite_anio, cliente_id, vehiculo_id, tipo_tramite_id, situacion_id, usuario_creador_id, sucursal_id, n_titulo, n_formato, fecha_presentacion, observaciones_generales, tarjeta_en_oficina, fecha_tarjeta_en_oficina, placa_en_oficina, fecha_placa_en_oficina, entrego_tarjeta, fecha_entrega_tarjeta, metodo_entrega_tarjeta, entrego_placa, fecha_entrega_placa, metodo_entrega_placa, observacion_placa, created_at, updated_at, deleted_at, sync_status) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, 'SYNCED')
         ON CONFLICT(id) DO UPDATE SET 
         codigo_verificacion=excluded.codigo_verificacion, tramite_anio=excluded.tramite_anio, cliente_id=excluded.cliente_id, vehiculo_id=excluded.vehiculo_id, 
         tipo_tramite_id=excluded.tipo_tramite_id, situacion_id=excluded.situacion_id, usuario_creador_id=excluded.usuario_creador_id, sucursal_id=excluded.sucursal_id, 
         n_titulo=excluded.n_titulo, n_formato=excluded.n_formato, fecha_presentacion=excluded.fecha_presentacion, observaciones_generales=excluded.observaciones_generales, 
         tarjeta_en_oficina=excluded.tarjeta_en_oficina, fecha_tarjeta_en_oficina=excluded.fecha_tarjeta_en_oficina, placa_en_oficina=excluded.placa_en_oficina, 
         fecha_placa_en_oficina=excluded.fecha_placa_en_oficina, entrego_tarjeta=excluded.entrego_tarjeta, fecha_entrega_tarjeta=excluded.fecha_entrega_tarjeta, 
         metodo_entrega_tarjeta=excluded.metodo_entrega_tarjeta, entrego_placa=excluded.entrego_placa, fecha_entrega_placa=excluded.fecha_entrega_placa, 
         metodo_entrega_placa=excluded.metodo_entrega_placa, observacion_placa=excluded.observacion_placa, created_at=excluded.created_at, 
         updated_at=excluded.updated_at, deleted_at=excluded.deleted_at, sync_status=excluded.sync_status
         WHERE tramites.sync_status = 'SYNCED'`,
        [
          str(t.id),
          str(t.codigoVerificacion ?? t.codigo_verificacion),
          str(t.tramiteAnio ?? t.tramite_anio),
          fk(t.clienteId ?? t.cliente_id),
          fk(t.vehiculoId ?? t.vehiculo_id),
          fk(t.tipoTramiteId ?? t.tipo_tramite_id),
          fk(t.situacionId ?? t.situacion_id),
          fk(t.usuarioCreadorId ?? t.usuario_creador_id),
          fk(t.sucursalId ?? t.sucursal_id),
          str(t.nTitulo ?? t.n_titulo),
          str(t.nFormato ?? t.n_formato),
          str(t.fechaPresentacion ?? t.fecha_presentacion),
          str(t.observacionesGenerales ?? t.observaciones_generales),
          (t.tarjetaEnOficina ?? t.tarjeta_en_oficina) ? 1 : 0,
          str(t.fechaTarjetaEnOficina ?? t.fecha_tarjeta_en_oficina),
          (t.placaEnOficina ?? t.placa_en_oficina) ? 1 : 0,
          str(t.fechaPlacaEnOficina ?? t.fecha_placa_en_oficina),
          (t.entregoTarjeta ?? t.entrego_tarjeta) ? 1 : 0,
          str(t.fechaEntregaTarjeta ?? t.fecha_entrega_tarjeta),
          str(t.metodoEntregaTarjeta ?? t.metodo_entrega_tarjeta),
          (t.entregoPlaca ?? t.entrego_placa) ? 1 : 0,
          str(t.fechaEntregaPlaca ?? t.fecha_entrega_placa),
          str(t.metodoEntregaPlaca ?? t.metodo_entrega_placa),
          str(t.observacionPlaca ?? t.observacion_placa),
          str(t.createdAt ?? t.created_at),
          str(t.updatedAt ?? t.updated_at),
          str(t.deletedAt ?? t.deleted_at),
        ],
      );
    }

    for (const td of pullData.tramiteDetalles || []) {
      await executeWithRetry(
        sqlite,
        `INSERT INTO tramite_detalles (id, tramite_id, empresa_gestora_id, representante_legal_id, presentante_id, tipo_boleta, numero_boleta, fecha_boleta, dua, num_formato_inmatriculacion, numero_recibo_tramite, clausula_monto, clausula_forma_pago, clausula_pago_bancarizado, aclaracion_dice, aclaracion_debe_decir, created_at, updated_at, deleted_at, sync_status) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, 'SYNCED')
         ON CONFLICT(id) DO UPDATE SET 
         tramite_id=excluded.tramite_id, empresa_gestora_id=excluded.empresa_gestora_id, representante_legal_id=excluded.representante_legal_id, 
         presentante_id=excluded.presentante_id, tipo_boleta=excluded.tipo_boleta, numero_boleta=excluded.numero_boleta, fecha_boleta=excluded.fecha_boleta, 
         dua=excluded.dua, num_formato_inmatriculacion=excluded.num_formato_inmatriculacion, numero_recibo_tramite=excluded.numero_recibo_tramite, 
         clausula_monto=excluded.clausula_monto, clausula_forma_pago=excluded.clausula_forma_pago, clausula_pago_bancarizado=excluded.clausula_pago_bancarizado, 
         aclaracion_dice=excluded.aclaracion_dice, aclaracion_debe_decir=excluded.aclaracion_debe_decir, created_at=excluded.created_at, 
         updated_at=excluded.updated_at, deleted_at=excluded.deleted_at, sync_status=excluded.sync_status
         WHERE tramite_detalles.sync_status = 'SYNCED'`,
        [
          str(td.id),
          fk(td.tramiteId ?? td.tramite_id),
          fk(td.empresaGestoraId ?? td.empresa_gestora_id),
          fk(td.representanteLegalId ?? td.representante_legal_id),
          fk(td.presentanteId ?? td.presentante_id),
          str(td.tipoBoleta ?? td.tipo_boleta),
          str(td.numeroBoleta ?? td.numero_boleta),
          str(td.fechaBoleta ?? td.fecha_boleta),
          str(td.dua),
          str(td.numFormatoInmatriculacion ?? td.num_formato_inmatriculacion),
          str(td.numeroReciboTramite ?? td.numero_recibo_tramite),
          td.clausulaMonto ?? td.clausula_monto ?? null,
          str(td.clausulaFormaPago ?? td.clausula_forma_pago),
          str(td.clausulaPagoBancarizado ?? td.clausula_pago_bancarizado),
          str(td.aclaracionDice ?? td.aclaracion_dice),
          str(td.aclaracionDebeDecir ?? td.aclaracion_debe_decir),
          str(td.createdAt ?? td.created_at),
          str(td.updatedAt ?? td.updated_at),
          str(td.deletedAt ?? td.deleted_at),
        ],
      );
    }

    // 5. Conflictos de Sincronización
    for (const conf of pullData.conflictos || []) {
      await executeWithRetry(
        sqlite,
        `INSERT INTO sync_conflictos (id, tabla_afectada, registro_id, identificador_visual, datos_locales, datos_remotos, resuelto, fecha_conflicto) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT(id) DO UPDATE SET 
         tabla_afectada=excluded.tabla_afectada, registro_id=excluded.registro_id, identificador_visual=excluded.identificador_visual, 
         datos_locales=excluded.datos_locales, datos_remotos=excluded.datos_remotos, resuelto=excluded.resuelto, fecha_conflicto=excluded.fecha_conflicto`,
        [
          str(conf.id),
          str(conf.tablaAfectada ?? conf.tabla_afectada),
          str(conf.registroId ?? conf.registro_id),
          str(conf.identificadorVisual ?? conf.identificador_visual),
          typeof conf.datosLocales === "string"
            ? conf.datosLocales
            : JSON.stringify(conf.datosLocales),
          typeof conf.datosRemotos === "string"
            ? conf.datosRemotos
            : JSON.stringify(conf.datosRemotos),
          conf.resuelto ? 1 : 0,
          new Date(conf.fechaConflicto ?? conf.fecha_conflicto).getTime(),
        ],
      );
    }
  } finally {
    // Volvemos a encender las Foreign Keys pase lo que pase
    await sqlite.execute("PRAGMA foreign_keys = ON;");
  }
}

export const executePull = async (
  config: { apiUrl: string },
  userId: string,
  sqlite: any,
  isRetry: boolean = false,
): Promise<{ success: boolean; data: any }> => {
  try {
    try {
      await sqlite.execute("PRAGMA journal_mode = WAL;", []);
      await sqlite.execute("PRAGMA busy_timeout = 10000;", []);
      await sqlite.execute("PRAGMA synchronous = NORMAL;", []);
    } catch (e) {
      console.warn("No se pudo fijar PRAGMAS en Sincronización", e);
    }

    const lastSyncIso = isRetry
      ? ""
      : localStorage.getItem("valeska_last_sync") || "";

    const response = await fetch(
      `${config.apiUrl}/sync/pull?lastSyncIso=${lastSyncIso}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
          "ngrok-skip-browser-warning": "true",
        },
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.message || `HTTP error! status: ${response.status}`,
      );
    }

    const data = await response.json();

    // Inserción Blindada
    await processPullSync(sqlite, data);

    if (data.serverTimestamp) {
      localStorage.setItem("valeska_last_sync", data.serverTimestamp);
    }

    return { success: true, data };
  } catch (error: any) {
    console.error("Error crítico en Pull Sync:", error);
    throw error;
  }
};
