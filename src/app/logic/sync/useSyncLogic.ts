import { useState, useEffect, useCallback, useRef } from "react";
import Database from "@tauri-apps/plugin-sql";
import { sileo } from "sileo";
import { executePush } from "./pushActions";
import { executePull } from "./pullActions";

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
  forceFullSync?: boolean;
  overrideUserId?: string;
  overrideUserName?: string;
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

  const isSyncingRef = useRef(false);

  useEffect(() => {
    isSyncingRef.current = isSyncing;
  }, [isSyncing]);

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

    const isAutoSync = context?.title === "Sincronización Automática";

    try {
      let userId = context?.overrideUserId || "";
      let userName = context?.overrideUserName || "Sistema";

      if (!userId) {
        const sessionStr = localStorage.getItem("valeska_session_user");
        if (!sessionStr) throw new Error("No hay sesión activa");
        const session = JSON.parse(sessionStr);
        userId = session.id;
        userName = session.nombre || session.username;
      }

      const sqlite = await Database.load("sqlite:valeska.db");
      const dispResult: any[] = await sqlite.select("SELECT nombre_equipo FROM dispositivos LIMIT 1");
      const machineName = dispResult[0]?.nombre_equipo || "PC-DESCONOCIDA";

      let isTableEmpty = false;
      try {
        const repsCheck: any[] = await sqlite.select("SELECT count(id) as count FROM representantes_legales");
        if (repsCheck[0].count === 0) isTableEmpty = true;
      } catch (e) {
        isTableEmpty = true;
      }

      if (context?.forceFullSync || isTableEmpty) {
        localStorage.removeItem("valeska_last_sync");
      }

      const config = { apiUrl: API_URL };

      const pushResult = await executePush(config, userId, sqlite);

      let pullData: any = null;
      let pullErrorMsg: string | null = null;
      try {
        const pullResult = await executePull(config, userId, sqlite);
        pullData = pullResult.data;
      } catch (pullError: any) {
        console.warn("Fallo de conexión en PULL. Ignorando porque el PUSH fue exitoso...", pullError);
        pullErrorMsg = pullError.message || "Error al descargar actualizaciones.";
      }

      const now = new Date();
      const displayTime = now.toLocaleString("es-PE", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit", second: "2-digit",
      });

      localStorage.setItem("valeska_last_sync_display", displayTime);

      const currentStats = {
        push: { sucursales: 0, dispositivos: 0, usuarios: 0, tramites: 0, otros: pushResult.pushedCount, conflictos: 0 },
        pull: {
          sucursales: pullData?.sucursales?.length || 0,
          dispositivos: pullData?.dispositivos?.length || 0,
          usuarios: pullData?.usuarios?.length || 0,
          tramites: pullData?.tramites?.length || 0,
          otros: 0,
          conflictos: pullData?.conflictos?.length || 0,
        },
      };
      localStorage.setItem("valeska_sync_stats", JSON.stringify(currentStats));

      const totalPulled =
        (pullData?.tramites?.length || 0) + (pullData?.clientes?.length || 0) +
        (pullData?.vehiculos?.length || 0) + (pullData?.usuarios?.length || 0) +
        (pullData?.plantillasDocumentos?.length || 0);

      const logTitle = context?.title || "Sincronización General Completada";
      let logDetails = `Subidos: ${pushResult.pushedCount} regs. | Descargados: ${totalPulled} regs.`;
      if (context?.details) logDetails = `${context.details} | ${logDetails}`;

      const newLog: SyncLog = {
        id: crypto.randomUUID(), timestamp: displayTime, type: "SYNC",
        status: "COMPLETED", user: userName, machine: machineName,
        title: logTitle, details: logDetails,
      };

      const prevHistoryRaw = localStorage.getItem("valeska_sync_history");
      const prevHistory: SyncLog[] = prevHistoryRaw ? JSON.parse(prevHistoryRaw) : [];
      localStorage.setItem("valeska_sync_history", JSON.stringify([newLog, ...prevHistory].slice(0, 50)));

      window.dispatchEvent(new Event("valeska_sync_completed"));
      window.dispatchEvent(new Event("valeska_reload_tramites"));

      if (!isAutoSync) {
        if (pullErrorMsg) {
          sileo.warning({
            title: "Sincronización Parcial",
            description: `Se subieron los datos correctamente, pero hubo un problema al descargar las actualizaciones: ${pullErrorMsg}`
          });
        } else {
          sileo.success({
            title: "Sincronización Exitosa",
            description: `Se subieron ${pushResult.pushedCount} y descargaron ${totalPulled} registros correctamente.`
          });
        }
      }

      return true;
    } catch (error: any) {
      console.error("Error en sincronización:", error);
      const msg = error.message || "No se pudo conectar con la nube central.";
      setSyncError(msg);

      const isNetworkError = msg.includes("Modo Offline") || msg.includes("Failed to fetch") || msg.includes("NetworkError");

      if (!isAutoSync || !isNetworkError) {
        sileo.error({
          title: "Fallo en Sincronización",
          description: msg,
        });
      }

      return false;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    const handleAutoSync = () => {
      if (!isSyncingRef.current) {
        triggerSync({ title: "Sincronización Automática", details: "Mantenimiento en segundo plano" });
      }
    };

    window.addEventListener("valeska_request_sync", handleAutoSync);

    const intervalId = setInterval(handleAutoSync, 60000);

    return () => {
      window.removeEventListener("valeska_request_sync", handleAutoSync);
      clearInterval(intervalId);
    };
  }, [triggerSync]);

  return {
    isSyncing,
    lastSyncTime,
    syncError,
    syncStats,
    syncHistory,
    triggerSync,
  };
}