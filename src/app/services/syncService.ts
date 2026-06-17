import { invoke } from "@tauri-apps/api/core";
import type {
  PullSyncQueryDto,
  PullSyncResponse,
  PushAcceptedResponse,
  PushStatusResponse,
  PushSyncChunkDto,
  SyncAuthContext,
  SyncCursor,
  SyncEntityName,
  SyncOutboxStatus,
} from "../types/sync.types";

export class SyncHttpError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly payload: unknown,
  ) {
    super(message);
    this.name = "SyncHttpError";
  }
}

export function clearInvalidSyncSession() {
  localStorage.removeItem("valeska_access_token");

  const sessionRaw = localStorage.getItem("valeska_session_user");
  if (!sessionRaw) return;

  try {
    const session = JSON.parse(sessionRaw);
    delete session.accessToken;
    localStorage.setItem("valeska_session_user", JSON.stringify(session));
  } catch {
    localStorage.removeItem("valeska_session_user");
  }
}

export const SYNC_ENTITY_TO_LOCAL_KEY: Record<SyncEntityName, string> = {
  tramite: "tramites",
  tramite_detalle: "tramiteDetalles",
  catalogo_tipo_tramite: "catalogoTiposTramite",
  catalogo_situacion: "catalogoSituaciones",
  cliente: "clientes",
  vehiculo: "vehiculos",
  empresa_gestora: "empresasGestoras",
  plantilla_documento: "plantillasDocumentos",
  presentante: "presentantes",
  representante_legal: "representantesLegales",
  perfil_gestor: "perfilesGestor",
  message_template: "messageTemplates",
  usuario: "usuarios",
  dispositivo: "dispositivos",
  sucursal: "sucursales",
  sync_conflicto: "conflictosResueltos",
};

export const LOCAL_KEY_TO_SYNC_ENTITY = Object.fromEntries(
  Object.entries(SYNC_ENTITY_TO_LOCAL_KEY).map(([entityName, localKey]) => [
    localKey,
    entityName,
  ]),
) as Record<string, SyncEntityName>;

export const SYNC_PULL_ORDER: SyncEntityName[] = [
  "sucursal",
  "dispositivo",
  "usuario",
  "message_template",
  "plantilla_documento",
  "catalogo_tipo_tramite",
  "catalogo_situacion",
  "empresa_gestora",
  "representante_legal",
  "presentante",
  "cliente",
  "vehiculo",
  "tramite",
  "tramite_detalle",
  "perfil_gestor",
  "sync_conflicto",
];

export const SYNC_PUSH_ORDER: SyncEntityName[] = [
  "sucursal",
  "usuario",
  "dispositivo",
  "message_template",
  "plantilla_documento",
  "catalogo_tipo_tramite",
  "catalogo_situacion",
  "empresa_gestora",
  "representante_legal",
  "presentante",
  "cliente",
  "vehiculo",
  "tramite",
  "tramite_detalle",
  "perfil_gestor",
  "sync_conflicto",
];

export async function getSyncAuthContext(): Promise<SyncAuthContext> {
  const sessionRaw = localStorage.getItem("valeska_session_user");
  const session = sessionRaw ? JSON.parse(sessionRaw) : null;
  const accessToken =
    localStorage.getItem("valeska_access_token") || session?.accessToken || "";

  if (!accessToken) {
    throw new Error("Token JWT requerido para sincronizar con la nube.");
  }

  let deviceMac = "";
  try {
    deviceMac = String(await invoke("get_device_mac")).trim().toLowerCase();
  } catch {
    deviceMac = "";
  }

  if (!deviceMac) {
    throw new Error("No se pudo obtener la MAC del dispositivo para sincronizar.");
  }

  return { accessToken, deviceMac };
}

export async function buildSyncHeaders() {
  const auth = await getSyncAuthContext();

  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Bearer ${auth.accessToken}`,
    "x-device-mac": auth.deviceMac,
    "ngrok-skip-browser-warning": "true",
  };
}

export async function pushSyncChunk(
  apiUrl: string,
  chunk: PushSyncChunkDto,
): Promise<PushAcceptedResponse> {
  const response = await fetch(`${apiUrl}/sync/push`, {
    method: "POST",
    headers: await buildSyncHeaders(),
    body: JSON.stringify(chunk),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    if (response.status === 401) clearInvalidSyncSession();
    throw new SyncHttpError(
      errorData?.message ||
        `HTTP ${response.status} al subir ${chunk.entityName}`,
      response.status,
      errorData,
    );
  }

  return response.json();
}

export async function getPushStatus(
  apiUrl: string,
  outboxId: string,
): Promise<PushStatusResponse> {
  const response = await fetch(`${apiUrl}/sync/push-status/${outboxId}`, {
    method: "GET",
    headers: await buildSyncHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    if (response.status === 401) clearInvalidSyncSession();
    throw new SyncHttpError(
      errorData?.message || `HTTP ${response.status} consultando push-status`,
      response.status,
      errorData,
    );
  }

  return response.json();
}

export async function pullSyncEntity<TRecord = Record<string, unknown>>(
  apiUrl: string,
  query: PullSyncQueryDto,
): Promise<PullSyncResponse<TRecord>> {
  const params = new URLSearchParams({
    entityName: query.entityName,
    limit: String(query.limit ?? 100),
  });

  if (query.cursorTimestamp) {
    params.set("cursorTimestamp", query.cursorTimestamp);
  }
  if (query.lastId) {
    params.set("lastId", query.lastId);
  }

  const response = await fetch(`${apiUrl}/sync/pull?${params.toString()}`, {
    method: "GET",
    headers: await buildSyncHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    if (response.status === 401) clearInvalidSyncSession();
    throw new SyncHttpError(
      errorData?.message || `HTTP ${response.status} descargando ${query.entityName}`,
      response.status,
      errorData,
    );
  }

  return response.json();
}

export async function getStoredCursor(
  sqlite: any,
  entityName: SyncEntityName,
): Promise<SyncCursor | null> {
  const rows: any[] = await sqlite.select(
    "SELECT cursor_timestamp, last_id FROM sync_cursors WHERE entity_name = $1 LIMIT 1",
    [entityName],
  );

  if (!rows.length) return null;

  return {
    cursorTimestamp: rows[0].cursor_timestamp,
    lastId: rows[0].last_id || "",
  };
}

export async function saveStoredCursor(
  sqlite: any,
  entityName: SyncEntityName,
  cursor: SyncCursor,
) {
  await sqlite.execute(
    `INSERT INTO sync_cursors (entity_name, cursor_timestamp, last_id, updated_at)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT(entity_name) DO UPDATE SET
       cursor_timestamp = excluded.cursor_timestamp,
       last_id = excluded.last_id,
       updated_at = excluded.updated_at`,
    [entityName, cursor.cursorTimestamp, cursor.lastId, Date.now()],
  );
}

export async function resetSecurityPullCursors(sqlite: any) {
  await sqlite.execute(
    "DELETE FROM sync_cursors WHERE entity_name IN ($1, $2)",
    ["usuario", "dispositivo"],
  );
}

export async function recordPushChunk(
  sqlite: any,
  input: {
    id: string;
    syncSessionId: string;
    entityName: SyncEntityName;
    chunkIndex: number;
    totalChunks: number;
    recordIds: string[];
    status?: SyncOutboxStatus;
  },
) {
  await sqlite.execute(
    `INSERT INTO sync_push_chunks
      (id, sync_session_id, entity_name, chunk_index, total_chunks, status, record_ids_json, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT(sync_session_id, entity_name, chunk_index) DO UPDATE SET
       status = excluded.status,
       record_ids_json = excluded.record_ids_json,
       updated_at = excluded.updated_at`,
    [
      input.id,
      input.syncSessionId,
      input.entityName,
      input.chunkIndex,
      input.totalChunks,
      input.status ?? "PENDING",
      JSON.stringify(input.recordIds),
      Date.now(),
    ],
  );
}

export async function updatePushChunkStatus(
  sqlite: any,
  input: {
    syncSessionId: string;
    entityName: SyncEntityName;
    chunkIndex: number;
    outboxId?: string | null;
    status: SyncOutboxStatus;
    lastError?: string | null;
  },
) {
  await sqlite.execute(
    `UPDATE sync_push_chunks
     SET outbox_id = COALESCE($1, outbox_id),
         status = $2,
         last_error = $3,
         updated_at = $4
     WHERE sync_session_id = $5 AND entity_name = $6 AND chunk_index = $7`,
    [
      input.outboxId ?? null,
      input.status,
      input.lastError ?? null,
      Date.now(),
      input.syncSessionId,
      input.entityName,
      input.chunkIndex,
    ],
  );
}

export async function waitForPushCompletion(
  apiUrl: string,
  outboxId: string,
  options: { attempts?: number; delayMs?: number; maxDelayMs?: number } = {},
) {
  const attempts = options.attempts ?? 20;
  let delayMs = options.delayMs ?? 1200;
  const maxDelayMs = options.maxDelayMs ?? 5000;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const status = await getPushStatus(apiUrl, outboxId);
    if (
      status.status === "COMPLETED" ||
      status.status === "COMPLETED_WITH_CONFLICTS" ||
      status.status === "DEAD_LETTER"
    ) {
      return status;
    }

    const jitterMs = Math.floor(Math.random() * 250);
    await new Promise((resolve) => setTimeout(resolve, delayMs + jitterMs));
    delayMs = Math.min(maxDelayMs, Math.round(delayMs * 1.5));
  }

  return getPushStatus(apiUrl, outboxId);
}

export async function resolveSyncConflict(
  apiUrl: string,
  conflictId: string,
  dto: {
    strategy: 'ACCEPT_REMOTE' | 'ACCEPT_LOCAL' | 'MERGE';
    resolvedData?: Record<string, unknown>;
    expectedRecordVersion?: number;
    resolutionNote?: string;
  },
  token: string,
  macAddress: string,
) {
  const url = `${apiUrl}/sync/conflicts/${conflictId}/resolve`;

  const response = await fetch(url, {
    method: "POST", // Fallback allowed per instruction
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "x-device-mac": macAddress,
    },
    body: JSON.stringify(dto),
  });

  if (!response.ok) {
    let errorMessage = "Error al resolver conflicto en servidor";
    try {
      const errorBody = await response.json();
      errorMessage = errorBody.message || errorMessage;
    } catch {
      errorMessage = `${errorMessage} (${response.status})`;
    }
    throw new Error(errorMessage);
  }

  return response.json();
}
