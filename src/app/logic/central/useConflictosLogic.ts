import { useState, useCallback } from "react";
import { getDb } from "../../db/localDb";
import { sileo } from "sileo";

export interface Conflicto {
  id: string;
  tablaAfectada: string;
  registroId: string;
  identificadorVisual: string;
  datosLocales: Record<string, any>;
  datosRemotos: Record<string, any>;
  fechaConflicto: number;
}

export type ConflictResolutionMode = "remote" | "local" | "merge";

export const isRemoteConflictPlaceholder = (remoteData: Record<string, any> | null | undefined) =>
  Boolean(remoteData?.pendiente_pull_conflicto === true);

const getAllowedConflictTable = (tableName: string) => {
  if (!TABLE_FIELD_MAP[tableName]) {
    throw new Error(`Tabla de conflicto no permitida: ${tableName}`);
  }
  return tableName;
};

const TABLE_FIELD_MAP: Record<string, Record<string, string>> = {
  clientes: {
    tipoDocumento: "tipo_documento",
    tipo_documento: "tipo_documento",
    numeroDocumento: "numero_documento",
    numero_documento: "numero_documento",
    razonSocialNombres: "razon_social_nombres",
    razon_social_nombres: "razon_social_nombres",
    estadoCivil: "estado_civil",
    estado_civil: "estado_civil",
    domicilio: "domicilio",
    telefono: "telefono",
    deletedAt: "deleted_at",
    deleted_at: "deleted_at",
  },
  vehiculos: {
    chasisVin: "chasis_vin",
    chasis_vin: "chasis_vin",
    placa: "placa",
    motor: "motor",
    marca: "marca",
    modelo: "modelo",
    color: "color",
    carroceria: "carroceria",
    categoria: "categoria",
    anioFabricacion: "anio_fabricacion",
    anio_fabricacion: "anio_fabricacion",
    anioModelo: "anio_modelo",
    anio_modelo: "anio_modelo",
    deletedAt: "deleted_at",
    deleted_at: "deleted_at",
  },
  tramites: {
    codigoVerificacion: "codigo_verificacion",
    codigo_verificacion: "codigo_verificacion",
    tramiteAnio: "tramite_anio",
    tramite_anio: "tramite_anio",
    clienteId: "cliente_id",
    cliente_id: "cliente_id",
    vehiculoId: "vehiculo_id",
    vehiculo_id: "vehiculo_id",
    tipoTramiteId: "tipo_tramite_id",
    tipo_tramite_id: "tipo_tramite_id",
    situacionId: "situacion_id",
    situacion_id: "situacion_id",
    nTitulo: "n_titulo",
    n_titulo: "n_titulo",
    nFormato: "n_formato",
    n_formato: "n_formato",
    fechaPresentacion: "fecha_presentacion",
    fecha_presentacion: "fecha_presentacion",
    observacionesGenerales: "observaciones_generales",
    observaciones_generales: "observaciones_generales",
    tarjetaEnOficina: "tarjeta_en_oficina",
    tarjeta_en_oficina: "tarjeta_en_oficina",
    fechaTarjetaEnOficina: "fecha_tarjeta_en_oficina",
    fecha_tarjeta_en_oficina: "fecha_tarjeta_en_oficina",
    placaEnOficina: "placa_en_oficina",
    placa_en_oficina: "placa_en_oficina",
    fechaPlacaEnOficina: "fecha_placa_en_oficina",
    fecha_placa_en_oficina: "fecha_placa_en_oficina",
    entregoTarjeta: "entrego_tarjeta",
    entrego_tarjeta: "entrego_tarjeta",
    fechaEntregaTarjeta: "fecha_entrega_tarjeta",
    fecha_entrega_tarjeta: "fecha_entrega_tarjeta",
    metodoEntregaTarjeta: "metodo_entrega_tarjeta",
    metodo_entrega_tarjeta: "metodo_entrega_tarjeta",
    entregoPlaca: "entrego_placa",
    entrego_placa: "entrego_placa",
    fechaEntregaPlaca: "fecha_entrega_placa",
    fecha_entrega_placa: "fecha_entrega_placa",
    metodoEntregaPlaca: "metodo_entrega_placa",
    metodo_entrega_placa: "metodo_entrega_placa",
    observacionPlaca: "observacion_placa",
    observacion_placa: "observacion_placa",
    deletedAt: "deleted_at",
    deleted_at: "deleted_at",
  },
  tramite_detalles: {
    tramiteId: "tramite_id",
    tramite_id: "tramite_id",
    empresaGestoraId: "empresa_gestora_id",
    empresa_gestora_id: "empresa_gestora_id",
    representanteLegalId: "representante_legal_id",
    representante_legal_id: "representante_legal_id",
    presentanteId: "presentante_id",
    presentante_id: "presentante_id",
    tipoBoleta: "tipo_boleta",
    tipo_boleta: "tipo_boleta",
    numeroBoleta: "numero_boleta",
    numero_boleta: "numero_boleta",
    fechaBoleta: "fecha_boleta",
    fecha_boleta: "fecha_boleta",
    dua: "dua",
    numFormatoInmatriculacion: "num_formato_inmatriculacion",
    num_formato_inmatriculacion: "num_formato_inmatriculacion",
    numeroReciboTramite: "numero_recibo_tramite",
    numero_recibo_tramite: "numero_recibo_tramite",
    clausulaMonto: "clausula_monto",
    clausula_monto: "clausula_monto",
    clausulaFormaPago: "clausula_forma_pago",
    clausula_forma_pago: "clausula_forma_pago",
    clausulaPagoBancarizado: "clausula_pago_bancarizado",
    clausula_pago_bancarizado: "clausula_pago_bancarizado",
    aclaracionDice: "aclaracion_dice",
    aclaracion_dice: "aclaracion_dice",
    aclaracionDebeDecir: "aclaracion_debe_decir",
    aclaracion_debe_decir: "aclaracion_debe_decir",
    deletedAt: "deleted_at",
    deleted_at: "deleted_at",
  },
};

const getVersion = (value: Record<string, any>) =>
  Number(value.version ?? value.baseVersion ?? value.base_version ?? 1);

const resolveSourceData = (
  mode: ConflictResolutionMode,
  localData: Record<string, any>,
  remoteData: Record<string, any>,
  resolvedData: Record<string, any>,
) => {
  if (mode === "remote") return remoteData;
  if (mode === "local") return localData;
  return resolvedData;
};

export function buildConflictResolutionUpdate({
  tableName,
  mode,
  registroId,
  localData,
  remoteData,
  resolvedData,
  now,
}: {
  tableName: string;
  mode: ConflictResolutionMode;
  registroId: string;
  localData: Record<string, any>;
  remoteData: Record<string, any>;
  resolvedData: Record<string, any>;
  now: number;
}) {
  const fieldMap = TABLE_FIELD_MAP[tableName];
  if (!fieldMap) {
    throw new Error(`Tabla de conflicto no permitida: ${tableName}`);
  }

  const remoteVersion = getVersion(remoteData);
  const sourceData = resolveSourceData(mode, localData, remoteData, resolvedData);
  const assignments = Object.entries(sourceData)
    .map(([key, value]) => ({ column: fieldMap[key], key, value }))
    .filter((entry): entry is { column: string; key: string; value: any } =>
      Boolean(entry.column),
    );
  const syncStatus = mode === "remote" ? "SYNCED" : "LOCAL_UPDATE";
  const baseVersion = remoteVersion;
  const version = mode === "remote" ? remoteVersion : undefined;
  const setClauses = assignments
    .map((entry, index) => `${entry.column} = $${index + 1}`)
    .join(", ");
  const values = assignments.map((entry) => entry.value);
  const metadataPrefix = values.length;
  const query = `UPDATE ${tableName}
    SET ${setClauses ? `${setClauses},` : ""}
        updated_at = $${metadataPrefix + 1},
        sync_status = $${metadataPrefix + 2},
        base_version = $${metadataPrefix + 3},
        version = CASE WHEN $${metadataPrefix + 2} = 'SYNCED' THEN $${metadataPrefix + 3} ELSE version END
    WHERE id = $${metadataPrefix + 4}`;

  return {
    query,
    values: [...values, now, syncStatus, baseVersion, registroId],
    assignments: assignments.map(({ column, value }) => ({ column, value })),
    syncStatus,
    baseVersion,
    version,
  };
}

export function useConflictosLogic() {
  const [conflictos, setConflictos] = useState<Conflicto[]>([]);
  const [conflictCount, setConflictCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const loadConflictCount = useCallback(async () => {
    try {
      const sqlite = await getDb();
      const res: any[] = await sqlite.select(
        "SELECT COUNT(id) as count FROM sync_conflictos WHERE resuelto = 0",
      );
      setConflictCount(res[0]?.count || 0);
    } catch (error) {
      console.error("Error obteniendo conteo de conflictos:", error);
    }
  }, []);

  const loadConflictos = useCallback(async () => {
    setIsLoading(true);
    try {
      const sqlite = await getDb();
      const res: any[] = await sqlite.select(
        "SELECT * FROM sync_conflictos WHERE resuelto = 0 ORDER BY fecha_conflicto DESC",
      );

      setConflictos(res.map((row) => ({
        id: row.id,
        tablaAfectada: row.tabla_afectada,
        registroId: row.registro_id,
        identificadorVisual: row.identificador_visual || "Registro Desconocido",
        datosLocales: JSON.parse(row.datos_locales || "{}"),
        datosRemotos: JSON.parse(row.datos_remotos || "{}"),
        fechaConflicto: row.fecha_conflicto,
      })));
    } catch (error) {
      console.error("Error cargando conflictos:", error);
      sileo.error({ title: "Error al cargar la lista de conflictos" });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getConflictoById = async (id: string): Promise<Conflicto | null> => {
    try {
      const sqlite = await getDb();
      const res: any[] = await sqlite.select(
        "SELECT * FROM sync_conflictos WHERE id = $1 LIMIT 1",
        [id],
      );

      if (res.length === 0) return null;

      const row = res[0];
      return {
        id: row.id,
        tablaAfectada: row.tabla_afectada,
        registroId: row.registro_id,
        identificadorVisual: row.identificador_visual,
        datosLocales: JSON.parse(row.datos_locales || "{}"),
        datosRemotos: JSON.parse(row.datos_remotos || "{}"),
        fechaConflicto: row.fecha_conflicto,
      };
    } catch (error) {
      console.error("Error cargando el conflicto:", error);
      return null;
    }
  };

  const resolveConflicto = async (
    conflictoId: string,
    tablaAfectada: string,
    registroId: string,
    resolvedData: Record<string, any>,
    mode: ConflictResolutionMode = "merge",
  ) => {
    const promise = async () => {
      const sqlite = await getDb();
      const now = Date.now();
      const conflictRows: any[] = await sqlite.select(
        "SELECT datos_locales, datos_remotos FROM sync_conflictos WHERE id = $1 LIMIT 1",
        [conflictoId],
      );
      const localData = JSON.parse(conflictRows[0]?.datos_locales || "{}");
      const remoteData = JSON.parse(conflictRows[0]?.datos_remotos || "{}");
      if (isRemoteConflictPlaceholder(remoteData)) {
        throw new Error("El detalle remoto del conflicto aun se esta sincronizando. Ejecuta sincronizacion y vuelve a intentar.");
      }
      const update = buildConflictResolutionUpdate({
        tableName: tablaAfectada,
        mode,
        registroId,
        localData,
        remoteData,
        resolvedData,
        now,
      });

      await sqlite.execute(update.query, update.values);

      await sqlite.execute(
        "UPDATE sync_conflictos SET resuelto = 1, datos_locales = $1, fecha_conflicto = $2 WHERE id = $3",
        [JSON.stringify(mode === "remote" ? remoteData : mode === "local" ? localData : resolvedData), now, conflictoId],
      );

      if (mode !== "remote" && typeof window !== "undefined") {
        window.dispatchEvent(new Event("valeska_request_sync"));
      }
    };

    return sileo.promise(promise(), {
      loading: { title: "Resolviendo conflicto..." },
      success: { title: "Conflicto resuelto y registro actualizado" },
      error: { title: "No se pudo resolver el conflicto" },
    });
  };

  const resolveReadyConflictsWithRemote = async () => {
    const promise = async () => {
      const sqlite = await getDb();
      const now = Date.now();
      const rows: any[] = await sqlite.select(
        "SELECT * FROM sync_conflictos WHERE resuelto = 0 ORDER BY fecha_conflicto ASC",
      );

      let resolved = 0;
      for (const row of rows) {
        const remoteData = JSON.parse(row.datos_remotos || "{}");
        if (isRemoteConflictPlaceholder(remoteData)) continue;

        const localData = JSON.parse(row.datos_locales || "{}");
        const update = buildConflictResolutionUpdate({
          tableName: row.tabla_afectada,
          mode: "remote",
          registroId: row.registro_id,
          localData,
          remoteData,
          resolvedData: remoteData,
          now,
        });
        await sqlite.execute(update.query, update.values);
        await sqlite.execute(
          "UPDATE sync_conflictos SET resuelto = 1, datos_locales = $1, fecha_conflicto = $2 WHERE id = $3",
          [JSON.stringify(remoteData), now, row.id],
        );
        resolved++;
      }

      await loadConflictos();
      await loadConflictCount();
      return resolved;
    };

    return sileo.promise(promise(), {
      loading: { title: "Resolviendo conflictos listos..." },
      success: { title: "Conflictos listos resueltos con nube" },
      error: { title: "No se pudo resolver conflictos en lote" },
    });
  };

  const cleanupOrphanImportConflicts = async () => {
    const promise = async () => {
      const sqlite = await getDb();
      const rows: any[] = await sqlite.select(
        "SELECT id, tabla_afectada, registro_id FROM sync_conflictos WHERE resuelto = 0",
      );

      let cleaned = 0;
      for (const row of rows) {
        const tableName = getAllowedConflictTable(row.tabla_afectada);
        const localRows: any[] = await sqlite.select(
          `SELECT id, sync_status FROM ${tableName} WHERE id = $1 LIMIT 1`,
          [row.registro_id],
        );
        if (localRows.length === 0 || localRows[0]?.sync_status === "SYNCED") {
          await sqlite.execute(
            "UPDATE sync_conflictos SET resuelto = 1, fecha_conflicto = $1 WHERE id = $2",
            [Date.now(), row.id],
          );
          cleaned++;
        }
      }

      await loadConflictos();
      await loadConflictCount();
      return cleaned;
    };

    return sileo.promise(promise(), {
      loading: { title: "Limpiando conflictos huerfanos..." },
      success: { title: "Conflictos huerfanos limpiados" },
      error: { title: "No se pudo limpiar conflictos" },
    });
  };

  return {
    conflictos,
    conflictCount,
    isLoading,
    loadConflictos,
    loadConflictCount,
    getConflictoById,
    resolveConflicto,
    resolveReadyConflictsWithRemote,
    cleanupOrphanImportConflicts,
  };
}
