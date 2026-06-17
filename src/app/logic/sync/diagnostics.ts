import { save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import { executePull } from "./pullActions";

export interface LocalSyncDiagnostics {
  generatedAt: string;
  counts: Record<string, number>;
  orphanCounts: {
    tramitesSinDetalle: number;
    tramitesSinCliente: number;
    tramitesSinVehiculo: number;
    detallesSinTramite: number;
  };
  conflictCount: number;
  lastSyncDurationMs: number | null;
  cursors: Array<{
    entityName: string;
    cursorTimestamp: string;
    lastId: string;
    updatedAt: string | number;
  }>;
  pendingCounts: Array<{
    tableName: string;
    count: number;
  }>;
  versionedRows: Array<{
    tableName: string;
    id: string;
    syncStatus: string;
    version: number;
    baseVersion: number;
    deletedAt: string | number | null;
    updatedAt: string | number;
  }>;
  recentPushErrors: Array<{
    id: string;
    entityName: string;
    status: string;
    chunkIndex: number;
    lastError: string | null;
    updatedAt: string | number;
  }>;
}

const CORE_TABLES = [
  "tramites",
  "tramite_detalles",
  "clientes",
  "vehiculos",
  "empresas_gestoras",
  "representantes_legales",
  "presentantes",
];

const PENDING_TABLES = [
  "sucursales",
  "dispositivos",
  "usuarios",
  "catalogo_tipos_tramite",
  "catalogo_situaciones",
  "clientes",
  "vehiculos",
  "empresas_gestoras",
  "representantes_legales",
  "presentantes",
  "tramites",
  "tramite_detalles",
  "plantillas_documentos",
  "message_templates",
  "perfiles_gestor",
];

const VERSIONED_TABLES = [
  "clientes",
  "vehiculos",
  "tramites",
  "tramite_detalles",
];

export const SYNC_REPAIR_ENTITIES = [
  "sucursal",
  "dispositivo",
  "usuario",
  "catalogo_tipo_tramite",
  "catalogo_situacion",
  "cliente",
  "vehiculo",
  "empresa_gestora",
  "representante_legal",
  "presentante",
  "plantilla_documento",
  "message_template",
  "perfil_gestor",
  "tramite",
  "tramite_detalle",
  "sync_conflicto",
];

const countFirst = (rows: any[]) => Number(rows?.[0]?.count ?? 0);

export async function collectLocalSyncDiagnostics(sqlite: any): Promise<LocalSyncDiagnostics> {
  const counts: Record<string, number> = {};
  for (const tableName of CORE_TABLES) {
    counts[tableName] = countFirst(await sqlite.select(`SELECT COUNT(*) AS count FROM ${tableName}`));
  }

  const [orphanCounts] = await sqlite.select(`
    SELECT
      COUNT(CASE WHEN td.id IS NULL THEN 1 END) AS tramitesSinDetalle,
      COUNT(CASE WHEN c.id IS NULL THEN 1 END) AS tramitesSinCliente,
      COUNT(CASE WHEN v.id IS NULL THEN 1 END) AS tramitesSinVehiculo
    FROM tramites t
    LEFT JOIN tramite_detalles td ON td.tramite_id = t.id AND td.deleted_at IS NULL
    LEFT JOIN clientes c ON c.id = t.cliente_id AND c.deleted_at IS NULL
    LEFT JOIN vehiculos v ON v.id = t.vehiculo_id AND v.deleted_at IS NULL
    WHERE t.deleted_at IS NULL
  `);

  const [detallesSinTramite] = await sqlite.select(`
    SELECT COUNT(*) AS count
    FROM tramite_detalles td
    LEFT JOIN tramites t ON t.id = td.tramite_id AND t.deleted_at IS NULL
    WHERE td.deleted_at IS NULL AND t.id IS NULL
  `);

  const pendingCounts = [];
  for (const tableName of PENDING_TABLES) {
    const count = countFirst(await sqlite.select(
      `SELECT COUNT(*) AS count FROM ${tableName} WHERE sync_status IS NOT NULL AND sync_status <> 'SYNCED'`,
    ));
    if (count > 0) {
      pendingCounts.push({ tableName, count });
    }
  }

  const versionedRows = [];
  for (const tableName of VERSIONED_TABLES) {
    const rows = await sqlite.select(`
      SELECT
        '${tableName}' AS tableName,
        id,
        sync_status AS syncStatus,
        version,
        base_version AS baseVersion,
        deleted_at AS deletedAt,
        updated_at AS updatedAt
      FROM ${tableName}
      WHERE sync_status IS NOT NULL
        AND (sync_status <> 'SYNCED' OR deleted_at IS NOT NULL OR base_version <> version)
      ORDER BY updated_at DESC
      LIMIT 50
    `);
    versionedRows.push(...rows);
  }

  const cursors = await sqlite.select(`
    SELECT entity_name AS entityName, cursor_timestamp AS cursorTimestamp, last_id AS lastId, updated_at AS updatedAt
    FROM sync_cursors
    ORDER BY entity_name ASC
  `);

  const recentPushErrors = await sqlite.select(`
    SELECT id, entity_name AS entityName, status, chunk_index AS chunkIndex, last_error AS lastError, updated_at AS updatedAt
    FROM sync_push_chunks
    WHERE status IN ('FAILED', 'DEAD_LETTER') OR last_error IS NOT NULL
    ORDER BY updated_at DESC
    LIMIT 25
  `);

  const conflictCount = countFirst(await sqlite.select(
    "SELECT COUNT(*) AS count FROM sync_conflictos WHERE resuelto = 0",
  ));
  const durationRaw = localStorage.getItem("valeska_last_sync_duration_ms");

  return {
    generatedAt: new Date().toISOString(),
    counts,
    orphanCounts: {
      tramitesSinDetalle: Number(orphanCounts?.tramitesSinDetalle ?? 0),
      tramitesSinCliente: Number(orphanCounts?.tramitesSinCliente ?? 0),
      tramitesSinVehiculo: Number(orphanCounts?.tramitesSinVehiculo ?? 0),
      detallesSinTramite: Number(detallesSinTramite?.count ?? 0),
    },
    cursors,
    pendingCounts,
    versionedRows,
    recentPushErrors,
    conflictCount,
    lastSyncDurationMs: durationRaw ? Number(durationRaw) : null,
  };
}

export function countPendingLocalChanges(diagnostics: LocalSyncDiagnostics): number {
  return diagnostics.pendingCounts.reduce((total, row) => total + row.count, 0);
}

export async function exportLocalSyncDiagnostics(diagnostics: LocalSyncDiagnostics): Promise<string | null> {
  const filePath = await save({
    filters: [{ name: "JSON", extensions: ["json"] }],
    defaultPath: `valeska-sync-diagnostico-${new Date().toISOString().slice(0, 10)}.json`,
  });

  if (!filePath) return null;

  await writeTextFile(filePath, JSON.stringify(diagnostics, null, 2));
  return filePath;
}

export async function forceTramiteResync(
  sqlite: any,
  config: { apiUrl: string },
  userId: string,
) {
  const diagnostics = await collectLocalSyncDiagnostics(sqlite);
  const pendingChanges = countPendingLocalChanges(diagnostics);
  if (pendingChanges > 0) {
    throw new Error(`Hay ${pendingChanges} cambios locales pendientes. Sincronizalos antes de reparar.`);
  }

  await backupLocalDatabase(sqlite);

  const placeholders = SYNC_REPAIR_ENTITIES.map((_, index) => `$${index + 1}`).join(", ");
  await sqlite.execute(
    `DELETE FROM sync_cursors WHERE entity_name IN (${placeholders})`,
    SYNC_REPAIR_ENTITIES,
  );

  return executePull(config, userId, sqlite, false);
}

async function backupLocalDatabase(sqlite: any): Promise<string> {
  const filePath = await save({
    filters: [{ name: "SQLite", extensions: ["db"] }],
    defaultPath: `valeska-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.db`,
  });

  if (!filePath) {
    throw new Error("Reparacion cancelada: no se selecciono ruta para el backup local.");
  }

  const escapedPath = filePath.replace(/'/g, "''");
  await sqlite.execute(`VACUUM INTO '${escapedPath}'`, []);
  return filePath;
}
