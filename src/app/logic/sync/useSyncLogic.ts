import { useState, useEffect, useCallback } from "react";
import Database from "@tauri-apps/plugin-sql";
import { sileo } from "sileo";
import { processPullSync } from "./pullActions";
import { buildPushPayload } from "./pushActions";

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
    push: { sucursales: 0, dispositivos: 0, usuarios: 0, tramites: 0, otros: 0, conflictos: 0 },
    pull: { sucursales: 0, dispositivos: 0, usuarios: 0, tramites: 0, otros: 0, conflictos: 0 },
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
    return () => window.removeEventListener("valeska_sync_completed", handleUpdate);
  }, []);

  const triggerSync = useCallback(async (context?: SyncContext) => {
    setIsSyncing(true);
    setSyncError(null);

    try {
      const sessionStr = localStorage.getItem("valeska_session_user");
      if (!sessionStr) throw new Error("No hay sesión activa");
      const session = JSON.parse(sessionStr);

      const sqlite = await Database.load("sqlite:valeska.db");
      const dispResult: any[] = await sqlite.select("SELECT nombre_equipo FROM dispositivos LIMIT 1");
      const machineName = dispResult[0]?.nombre_equipo || "PC-DESCONOCIDA";
      const lastSyncIso = localStorage.getItem("valeska_last_sync_iso") || "";

      // =========================================================
      // 1. EJECUTAR PULL (Descargar e Insertar)
      // =========================================================
      const pullRes = await fetch(
        `${API_URL}/sync/pull?lastSync=${encodeURIComponent(lastSyncIso)}`,
        { headers: { "x-user-id": session.id } }
      );

      if (pullRes.status === 401) {
        await sqlite.execute("UPDATE usuarios SET esta_activo = 0 WHERE id = $1", [session.id]);
        localStorage.removeItem("valeska_session_user");
        sileo.error({
          title: "Sesión Expirada",
          description: "Tu sesión ha expirado o tu dispositivo ha sido desvinculado.",
        });
        window.location.href = "/auth/login";
        return false;
      }

      if (!pullRes.ok) throw new Error(`Error en PULL: ${pullRes.statusText}`);

      const pullData = await pullRes.json();
      await processPullSync(sqlite, pullData);

      // =========================================================
      // 2. EJECUTAR PUSH (Recopilar y Enviar)
      // =========================================================
      const payload = await buildPushPayload(sqlite);

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
      // 3. FINALIZAR Y LIMPIAR LOCAL DB
      // =========================================================
      // Marcar TODAS las tablas como SYNCED para que no se reenvíen en el próximo push
      const tablesToMark = [
        'catalogo_tipos_tramite', 'catalogo_situaciones', 'clientes',
        'vehiculos', 'empresas_gestoras', 'presentantes',
        'plantillas_documentos', 'tramites', 'tramite_detalles'
      ];

      for (const table of tablesToMark) {
        await sqlite.execute(`UPDATE ${table} SET sync_status = 'SYNCED' WHERE sync_status != 'SYNCED'`);
      }

      // =========================================================
      // 4. AUDITORÍA Y ESTADÍSTICAS
      // =========================================================
      const now = new Date();
      const displayTime = now.toLocaleString("es-PE", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit", second: "2-digit",
      });

      localStorage.setItem("valeska_last_sync_iso", pushData.timestamp || now.toISOString());
      localStorage.setItem("valeska_last_sync_display", displayTime);

      const totalPushOtros = payload.catalogoTiposTramite.length + payload.catalogoSituaciones.length +
        payload.clientes.length + payload.vehiculos.length + payload.empresasGestoras.length +
        payload.presentantes.length + payload.plantillasDocumentos.length;

      const currentStats = {
        push: {
          sucursales: payload.sucursales.length,
          dispositivos: payload.dispositivos.length,
          usuarios: payload.usuarios.length,
          tramites: payload.tramites.length,
          otros: totalPushOtros,
          conflictos: payload.conflictos.length
        },
        pull: {
          sucursales: pullData.sucursales?.length || 0,
          dispositivos: pullData.dispositivos?.length || 0,
          usuarios: pullData.usuarios?.length || 0,
          tramites: pullData.tramites?.length || 0,
          otros: 0,
          conflictos: pullData.conflictos?.length || 0
        },
      };
      localStorage.setItem("valeska_sync_stats", JSON.stringify(currentStats));

      const logTitle = context?.title || "Sincronización General Completada";
      let logDetails = `Subidos: ${payload.tramites.length} Trám., ${totalPushOtros} Maestros, ${payload.conflictos.length} Conflictos.`;
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
      const prevHistory: SyncLog[] = prevHistoryRaw ? JSON.parse(prevHistoryRaw) : [];
      localStorage.setItem("valeska_sync_history", JSON.stringify([newLog, ...prevHistory].slice(0, 50)));

      window.dispatchEvent(new Event("valeska_sync_completed"));
      window.dispatchEvent(new Event("valeska_reload_tramites"));

      sileo.success({
        title: logTitle,
        description: "La sincronización finalizó correctamente y sin problemas de conexión.",
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