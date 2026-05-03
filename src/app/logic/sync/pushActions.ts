import { buildPushPayload, markRecordsAsSynced } from "./syncUtils";

const CHUNK_SIZE = 500;

const chunkArray = <T>(arr: T[], size: number): T[][] => {
  if (!arr || arr.length === 0) return [];
  const result = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
};

export const executePush = async (
  config: { apiUrl: string },
  userId: string,
  sqlite: any,
) => {
  try {
    const fullPayload = (await buildPushPayload(sqlite)) as Record<string, any[]>;

    const hasDataToPush = Object.values(fullPayload).some(
      (arr: any) => arr && arr.length > 0,
    );
    if (!hasDataToPush) return { success: true, pushedCount: 0 };

    let totalPushed = 0;

    const syncOrder = [
      { key: "sucursales", table: "sucursales" },
      { key: "dispositivos", table: "dispositivos" },
      { key: "usuarios", table: "usuarios" },
      { key: "messageTemplates", table: "message_templates" },
      { key: "plantillasDocumentos", table: "plantillas_documentos" },
      { key: "catalogoTiposTramite", table: "catalogo_tipos_tramite" },
      { key: "catalogoSituaciones", table: "catalogo_situaciones" },
      { key: "empresasGestoras", table: "empresas_gestoras" },
      { key: "representantesLegales", table: "representantes_legales" },
      { key: "presentantes", table: "presentantes" },
      { key: "clientes", table: "clientes" },
      { key: "vehiculos", table: "vehiculos" },
      { key: "tramites", table: "tramites" },
      { key: "tramiteDetalles", table: "tramite_detalles" },
      { key: "conflictosResueltos", table: "sync_conflictos" }
    ];

    for (const { key, table } of syncOrder) {
      const records = fullPayload[key];
      if (!records || records.length === 0) continue;

      const chunks = chunkArray(records, CHUNK_SIZE);

      const chunkPromises = chunks.map(async (chunk) => {
        const chunkPayload: Record<string, any[]> = { [key]: chunk };

        const response = await fetch(`${config.apiUrl}/sync/push`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": userId,
            "ngrok-skip-browser-warning": "true",
          },
          body: JSON.stringify(chunkPayload),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(
            errorData?.message || `HTTP error al subir lote de ${key}: status ${response.status}`
          );
        }

        return chunk;
      });

      const successfulChunks = await Promise.all(chunkPromises);

      const successfulIds: string[] = [];
      for (const chunk of successfulChunks) {
        successfulIds.push(...chunk.map((r: any) => r.id));
        totalPushed += chunk.length;
      }

      if (successfulIds.length > 0) {
        const idChunks = chunkArray(successfulIds, 500);
        for (const ids of idChunks) {
          if (key === "conflictosResueltos") {
            const formattedIds = ids.map((id) => `'${id}'`).join(',');
            await sqlite.execute(`UPDATE sync_conflictos SET resuelto = 1 WHERE id IN (${formattedIds})`);
          } else {
            await markRecordsAsSynced(sqlite, table, ids);
          }
        }
      }
    }

    return { success: true, pushedCount: totalPushed };
  } catch (error: any) {
    throw error;
  }
};