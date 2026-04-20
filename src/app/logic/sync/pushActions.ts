import { buildPushPayload, markRecordsAsSynced } from './syncUtils';

export const executePush = async (config: { apiUrl: string }, userId: string, sqlite: any) => {
  try {
    const payload = await buildPushPayload(sqlite);

    const hasDataToPush = Object.values(payload).some((arr: any) => arr && arr.length > 0);
    if (!hasDataToPush) return { success: true, pushedCount: 0 };

    const response = await fetch(`${config.apiUrl}/api/sync/push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (payload.clientes?.length) await markRecordsAsSynced(sqlite, 'clientes', payload.clientes.map((r: any) => r.id));
    if (payload.vehiculos?.length) await markRecordsAsSynced(sqlite, 'vehiculos', payload.vehiculos.map((r: any) => r.id));
    if (payload.empresasGestoras?.length) await markRecordsAsSynced(sqlite, 'empresas_gestoras', payload.empresasGestoras.map((r: any) => r.id));
    if (payload.representantesLegales?.length) await markRecordsAsSynced(sqlite, 'representantes_legales', payload.representantesLegales.map((r: any) => r.id));
    if (payload.presentantes?.length) await markRecordsAsSynced(sqlite, 'presentantes', payload.presentantes.map((r: any) => r.id));
    if (payload.tramites?.length) await markRecordsAsSynced(sqlite, 'tramites', payload.tramites.map((r: any) => r.id));
    if (payload.tramiteDetalles?.length) await markRecordsAsSynced(sqlite, 'tramite_detalles', payload.tramiteDetalles.map((r: any) => r.id));
    if (payload.sucursales?.length) await markRecordsAsSynced(sqlite, 'sucursales', payload.sucursales.map((r: any) => r.id));
    if (payload.dispositivos?.length) await markRecordsAsSynced(sqlite, 'dispositivos', payload.dispositivos.map((r: any) => r.id));
    if (payload.usuarios?.length) await markRecordsAsSynced(sqlite, 'usuarios', payload.usuarios.map((r: any) => r.id));
    if (payload.messageTemplates?.length) await markRecordsAsSynced(sqlite, 'message_templates', payload.messageTemplates.map((r: any) => r.id));

    if (payload.conflictosResueltos?.length) {
      const conflictIds = payload.conflictosResueltos.map((c: any) => `'${c.id}'`).join(',');
      await sqlite.execute(`DELETE FROM sync_conflictos WHERE id IN (${conflictIds})`);
    }

    return { success: true, pushedCount: data.recordsSynced || 0 };
  } catch (error) {
    console.error('Error en Push Sync:', error);
    throw error;
  }
};