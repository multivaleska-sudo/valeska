import { buildPushPayload, markRecordsAsSynced } from "./syncUtils";
import {
  LOCAL_KEY_TO_SYNC_ENTITY,
  SYNC_ENTITY_TO_LOCAL_KEY,
  SYNC_PUSH_ORDER,
  SyncHttpError,
  pushSyncChunk,
  recordPushChunk,
  updatePushChunkStatus,
  waitForPushCompletion,
} from "../../services/syncService";
import type { SyncEntityName } from "../../types/sync.types";

const CHUNK_SIZE = 500;

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

export const executePush = async (
  config: { apiUrl: string },
  _userId: string,
  sqlite: any,
) => {
  const fullPayload = (await buildPushPayload(sqlite)) as Record<string, any[]>;

  const hasDataToPush = Object.values(fullPayload).some(
    (arr: any) => arr && arr.length > 0,
  );
  if (!hasDataToPush) return { success: true, pushedCount: 0 };

  const syncSessionId = crypto.randomUUID();
  let totalPushed = 0;

  for (const entityName of SYNC_PUSH_ORDER) {
    const localKey = SYNC_ENTITY_TO_LOCAL_KEY[entityName];
    const records = fullPayload[localKey];
    if (!records || records.length === 0) continue;

    const chunks = chunkArray(records, CHUNK_SIZE);

    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex += 1) {
      const chunk = chunks[chunkIndex];
      const recordIds = chunk.map((record: any) => record.id).filter(Boolean);

      await recordPushChunk(sqlite, {
        id: crypto.randomUUID(),
        syncSessionId,
        entityName,
        chunkIndex,
        totalChunks: chunks.length,
        recordIds,
      });

      try {
        const accepted = await pushSyncChunk(config.apiUrl, {
          syncSessionId,
          entityName,
          chunkIndex,
          totalChunks: chunks.length,
          records: chunk,
        });

        await updatePushChunkStatus(sqlite, {
          syncSessionId,
          entityName,
          chunkIndex,
          outboxId: accepted.outboxId,
          status: accepted.status,
        });

        const finalStatus = await waitForPushCompletion(
          config.apiUrl,
          accepted.outboxId,
        );

        await updatePushChunkStatus(sqlite, {
          syncSessionId,
          entityName,
          chunkIndex,
          outboxId: finalStatus.outboxId,
          status: finalStatus.status,
          lastError: finalStatus.lastError,
        });

        if (finalStatus.status !== "COMPLETED") {
          throw new Error(
            finalStatus.lastError ||
              `El servidor dejo el chunk ${entityName} en estado ${finalStatus.status}`,
          );
        }

        if (entityName === "sync_conflicto") {
          if (recordIds.length > 0) {
            await sqlite.execute(
              `UPDATE sync_conflictos SET resuelto = 1 WHERE id IN (${recordIds
                .map((id) => `'${id}'`)
                .join(",")})`,
            );
          }
        } else {
          await markRecordsAsSynced(sqlite, ENTITY_TABLES[entityName], recordIds);
        }

        totalPushed += chunk.length;
      } catch (error: any) {
        const message = error?.message || `Error al subir ${entityName}`;

        await updatePushChunkStatus(sqlite, {
          syncSessionId,
          entityName,
          chunkIndex,
          status: error?.status === 0 ? "FAILED" : "FAILED",
          lastError: message,
        });

        if (
          error instanceof SyncHttpError &&
          [400, 401, 403].includes(error.status)
        ) {
          await insertLocalConflictFromError(sqlite, entityName, error);
        }

        throw error;
      }
    }
  }

  return { success: true, pushedCount: totalPushed };
};

export const getSyncEntityFromLocalKey = (localKey: string) =>
  LOCAL_KEY_TO_SYNC_ENTITY[localKey];
