import { buildPushPayload, markRecordsAsConflicted, markRecordsAsSynced } from "./syncUtils";
import {
  LOCAL_KEY_TO_SYNC_ENTITY,
  SYNC_ENTITY_TO_LOCAL_KEY,
  SYNC_PUSH_ORDER,
  SyncHttpError,
  pushSyncBatch,
  recordPushChunk,
  updatePushChunkStatus,
  waitForPushCompletion,
} from "../../services/syncService";
import type { SyncEntityName, PushSyncChunkDto } from "../../types/sync.types";

const CHUNK_SIZE = 500;
type EntityCountMap = Partial<Record<SyncEntityName, number>>;

const ENTITY_TABLES: Record<SyncEntityName, string> = {
  sucursal: "sucursales",
  dispositivo: "dispositivos",
  usuario: "usuarios",
  message_template: "message_templates",
  plantilla_documento: "plantillas_documentos",
  catalogo_tipo_tramite: "catalogo_tipos_tramite",
  catalogo_situacion: "catalogo_situaciones",
  empresa_gestora: "empresas_gestoras",
  representante_legal: "representantes_legales",
  presentante: "presentantes",
  cliente: "clientes",
  vehiculo: "vehiculos",
  tramite: "tramites",
  tramite_detalle: "tramite_detalles",
  perfil_gestor: "perfiles_gestor",
  sync_conflicto: "sync_conflictos",
};

const chunkArray = <T>(arr: T[], size: number): T[][] => {
  if (!arr || arr.length === 0) return [];
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
};

const insertLocalConflictFromError = async (
  sqlite: any,
  entityName: SyncEntityName,
  error: SyncHttpError,
) => {
  const payload = error.payload as any;
  const message = Array.isArray(payload?.message)
    ? payload.message.join("; ")
    : payload?.message || error.message;

  if (!/conflict|conflicto/i.test(message)) return;

  await sqlite.execute(
    `INSERT INTO sync_conflictos
      (id, tabla_afectada, registro_id, identificador_visual, datos_locales, datos_remotos, resuelto, fecha_conflicto)
     VALUES ($1, $2, $3, $4, $5, $6, 0, $7)
     ON CONFLICT(id) DO UPDATE SET
       tabla_afectada = excluded.tabla_afectada,
       registro_id = excluded.registro_id,
       identificador_visual = excluded.identificador_visual,
       datos_locales = excluded.datos_locales,
       datos_remotos = excluded.datos_remotos,
       resuelto = 0,
       fecha_conflicto = excluded.fecha_conflicto`,
    [
      crypto.randomUUID(),
      ENTITY_TABLES[entityName],
      payload?.registroId || payload?.recordId || "unknown",
      payload?.identificadorVisual || `Conflicto ${entityName}`,
      JSON.stringify(payload?.datosLocales || payload?.local || {}),
      JSON.stringify(payload?.datosRemotos || payload?.remote || {}),
      Date.now(),
    ],
  );
};

const insertLocalConflictsFromStatus = async (
  sqlite: any,
  entityName: SyncEntityName,
  records: any[],
  conflictIds: string[] = [],
) => {
  const tableName = ENTITY_TABLES[entityName];
  const conflictedRecords = records.filter((record) => record?.id);
  if (conflictedRecords.length === 0) return;

  for (let index = 0; index < conflictedRecords.length; index += 1) {
    const record = conflictedRecords[index];
    await sqlite.execute(
      `INSERT INTO sync_conflictos
        (id, tabla_afectada, registro_id, identificador_visual, datos_locales, datos_remotos, resuelto, fecha_conflicto)
       VALUES ($1, $2, $3, $4, $5, $6, 0, $7)
       ON CONFLICT(id) DO UPDATE SET
         tabla_afectada = excluded.tabla_afectada,
         registro_id = excluded.registro_id,
         identificador_visual = excluded.identificador_visual,
         datos_locales = excluded.datos_locales,
         datos_remotos = excluded.datos_remotos,
         resuelto = 0,
         fecha_conflicto = excluded.fecha_conflicto`,
      [
        conflictIds[index] || crypto.randomUUID(),
        tableName,
        record.id,
        record.nTitulo || record.numeroDocumento || record.placa || record.tramiteId || `Conflicto ${entityName}`,
        JSON.stringify(record),
        JSON.stringify({ pendiente_pull_conflicto: true }),
        Date.now(),
      ],
    );
  }
};

export const executePush = async (
  config: { apiUrl: string },
  _userId: string,
  sqlite: any,
  onlyEntities?: SyncEntityName[],
) => {
  const fullPayload = (await buildPushPayload(sqlite)) as Record<string, any[]>;
  const pushedByEntity: EntityCountMap = {};
  const acceptedByEntity: EntityCountMap = {};
  const conflictedByEntity: EntityCountMap = {};
  const aggregateAcceptedRecordIds: string[] = [];
  const aggregateConflictedRecordIds: string[] = [];

  const entitiesToPush: SyncEntityName[] = onlyEntities || SYNC_PUSH_ORDER;

  const hasDataToPush = entitiesToPush.some(
    (entity: SyncEntityName) => fullPayload[SYNC_ENTITY_TO_LOCAL_KEY[entity]] && fullPayload[SYNC_ENTITY_TO_LOCAL_KEY[entity]].length > 0,
  );
  if (!hasDataToPush) {
    return {
      success: true,
      pushedCount: 0,
      conflictCount: 0,
      pushedByEntity,
      acceptedByEntity,
      conflictedByEntity,
      acceptedRecordIds: aggregateAcceptedRecordIds,
      conflictedRecordIds: aggregateConflictedRecordIds,
    };
  }

  const syncSessionId = crypto.randomUUID();
  let totalPushed = 0;

  const allChunks: PushSyncChunkDto[] = [];
  const chunkRecordIdsMap: Record<string, string[]> = {}; // Para saber qué IDs corresponden a qué chunk (usando un key como "entityName_chunkIndex")

  // Recolectar chunks
  for (const entityName of entitiesToPush) {
    const localKey = SYNC_ENTITY_TO_LOCAL_KEY[entityName];
    const records = fullPayload[localKey];
    if (!records || records.length === 0) continue;

    const chunks = chunkArray(records, CHUNK_SIZE);
    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex += 1) {
      const chunk = chunks[chunkIndex];
      const recordIds = chunk.map((record: any) => record.id).filter(Boolean);
      chunkRecordIdsMap[`${entityName}_${chunkIndex}`] = recordIds;

      await recordPushChunk(sqlite, {
        id: crypto.randomUUID(),
        syncSessionId,
        entityName,
        chunkIndex,
        totalChunks: chunks.length,
        recordIds,
      });

      allChunks.push({
        syncProtocolVersion: 2,
        syncSessionId,
        entityName,
        chunkIndex,
        totalChunks: chunks.length,
        records: chunk,
      });
    }
  }

  if (allChunks.length === 0) {
    return {
      success: true,
      pushedCount: 0,
      conflictCount: 0,
      pushedByEntity,
      acceptedByEntity,
      conflictedByEntity,
      acceptedRecordIds: aggregateAcceptedRecordIds,
      conflictedRecordIds: aggregateConflictedRecordIds,
    };
  }

  // Enviar batch atómico
  try {
    const batchResult = await pushSyncBatch(config.apiUrl, { chunks: allChunks });
    
    // Procesar respuestas del batch
  for (const chunk of allChunks) {
    const entityName = chunk.entityName as SyncEntityName;
    const chunkIndex = chunk.chunkIndex;
    const recordIds = chunkRecordIdsMap[`${entityName}_${chunkIndex}`];
    
    // Buscar el outbox en la respuesta del batch
    const outboxInfo = batchResult.outboxes.find(o => o.entityName === entityName && o.syncSessionId === syncSessionId);
      
      if (outboxInfo) {
        await updatePushChunkStatus(sqlite, {
          syncSessionId,
          entityName,
          chunkIndex,
          outboxId: outboxInfo.outboxId,
          status: outboxInfo.status,
        });

        const finalStatus = await waitForPushCompletion(
          config.apiUrl,
          outboxInfo.outboxId,
        );

        await updatePushChunkStatus(sqlite, {
          syncSessionId,
          entityName,
          chunkIndex,
          outboxId: finalStatus.outboxId,
          status: finalStatus.status,
          lastError: finalStatus.lastError,
        });

        if (!["COMPLETED", "COMPLETED_WITH_CONFLICTS"].includes(finalStatus.status)) {
          throw new Error(
            finalStatus.lastError ||
              `El servidor dejo el chunk ${entityName} en estado ${finalStatus.status}`,
          );
        }

        const hasGranularStatus =
          Boolean(finalStatus.acceptedRecordIds?.length) ||
          Boolean(finalStatus.conflictedRecordIds?.length);
        const acceptedRecordIds = hasGranularStatus
          ? finalStatus.acceptedRecordIds || []
          : recordIds;
        const conflictedRecordIds = finalStatus.conflictedRecordIds || [];
        
        acceptedByEntity[entityName] = (acceptedByEntity[entityName] || 0) + acceptedRecordIds.length;
        conflictedByEntity[entityName] = (conflictedByEntity[entityName] || 0) + conflictedRecordIds.length;
        pushedByEntity[entityName] = (pushedByEntity[entityName] || 0) + acceptedRecordIds.length;
        aggregateAcceptedRecordIds.push(...acceptedRecordIds);
        aggregateConflictedRecordIds.push(...conflictedRecordIds);

        if (entityName === "sync_conflicto") {
          if (acceptedRecordIds.length > 0) {
            const placeholders = acceptedRecordIds.map(() => "?").join(",");
            await sqlite.execute(
              `UPDATE sync_conflictos 
               SET resuelto = 1, sync_status = 'SYNCED' 
               WHERE id IN (${placeholders})`,
              acceptedRecordIds
            );
          }
        } else {
          await markRecordsAsSynced(sqlite, ENTITY_TABLES[entityName], acceptedRecordIds);
          await markRecordsAsConflicted(sqlite, ENTITY_TABLES[entityName], conflictedRecordIds);
          if (conflictedRecordIds.length > 0) {
            await insertLocalConflictsFromStatus(
              sqlite,
              entityName,
              chunk.records.filter((record: any) => conflictedRecordIds.includes(record.id)),
              finalStatus.conflictIds || [],
            );
          }
        }

        totalPushed += acceptedRecordIds.length;
      }
    }
  } catch (error: any) {
    const message = error?.message || `Error al subir batch`;
    for (const chunk of allChunks) {
      const entityName = chunk.entityName as SyncEntityName;
      await updatePushChunkStatus(sqlite, {
        syncSessionId,
        entityName,
        chunkIndex: chunk.chunkIndex,
        status: error?.status === 0 ? "FAILED" : "FAILED",
        lastError: message,
      });

      if (
        error instanceof SyncHttpError &&
        [400, 401, 403].includes(error.status)
      ) {
        await insertLocalConflictFromError(sqlite, entityName, error);
      }
    }
    throw error;
  }

  return {
    success: true,
    pushedCount: totalPushed,
    conflictCount: aggregateConflictedRecordIds.length,
    pushedByEntity,
    acceptedByEntity,
    conflictedByEntity,
    acceptedRecordIds: aggregateAcceptedRecordIds,
    conflictedRecordIds: aggregateConflictedRecordIds,
  };
};

export const getSyncEntityFromLocalKey = (localKey: string) =>
  LOCAL_KEY_TO_SYNC_ENTITY[localKey];
