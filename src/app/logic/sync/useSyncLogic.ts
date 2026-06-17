import { useState, useEffect, useCallback } from "react";
import Database from "@tauri-apps/plugin-sql";
import { sileo } from "sileo";
import { executePush } from "./pushActions";
import { executePull } from "./pullActions";
import { SyncHttpError, clearInvalidSyncSession } from "../../services/syncService";

const API_URL = (import.meta as any).env.VITE_API_URL;
declare global {
  interface Window {
    __valeskaSyncInFlight?: boolean;
    __valeskaSyncPending?: boolean;
  }
}

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
  title?: string;
  details?: string;
  forceFullSync?: boolean;
  overrideUserId?: string;
  overrideUserName?: string;
  source?: "manual" | "auto" | "excel-import";
  silent?: boolean;
}

const isAuthSyncError = (error: any) =>
  error instanceof SyncHttpError && error.status === 401;

const sumCounts = (counts: Record<string, number | undefined> = {}) =>
  Object.values(counts).reduce((total, count) => total + (count || 0), 0);

const buildStatsBucket = (counts: Record<string, number | undefined> = {}) => {
  const sucursales = counts.sucursal || 0;
  const dispositivos = counts.dispositivo || 0;
  const usuarios = counts.usuario || 0;
  const tramites = (counts.tramite || 0) + (counts.tramite_detalle || 0);
  const conflictos = counts.sync_conflicto || 0;
  const known = sucursales + dispositivos + usuarios + tramites + conflictos;

  return {
    sucursales,
    dispositivos,
    usuarios,
    tramites,
    otros: Math.max(0, sumCounts(counts) - known),
    conflictos,
  };
};

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
    return () =>
      window.removeEventListener("valeska_sync_completed", handleUpdate);
  }, []);

  const triggerSync = useCallback(async (context?: SyncContext) => {
    if (window.__valeskaSyncInFlight) {
      window.__valeskaSyncPending = true;
      return false;
    }

    window.__valeskaSyncInFlight = true;
    const syncStartedAt = performance.now();
    setIsSyncing(true);
    setSyncError(null);

    const isAutoSync = context?.source === "auto" || context?.silent === true;

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
        pullData.__pulledByEntity = pullResult.pulledByEntity || {};
        pullData.__totalPulled = pullResult.totalPulled || 0;
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
      localStorage.setItem("valeska_last_sync_duration_ms", String(Math.round(performance.now() - syncStartedAt)));

      const currentStats = {
        push: buildStatsBucket(pushResult.pushedByEntity || {}),
        pull: buildStatsBucket(pullData?.__pulledByEntity || {}),
      };
      localStorage.setItem("valeska_sync_stats", JSON.stringify(currentStats));

      const totalPulled = pullData?.__totalPulled || sumCounts(pullData?.__pulledByEntity || {});
      const totalChanged = (pushResult.pushedCount || 0) + totalPulled + (pushResult.conflictCount || 0);

      const logTitle = context?.title || "Sincronización General Completada";
      let logDetails = `Subidos: ${pushResult.pushedCount} regs. | Descargados: ${totalPulled} regs.`;
      if (context?.details) logDetails = `${context.details} | ${logDetails}`;

      const newLog: SyncLog = {
        id: crypto.randomUUID(), timestamp: displayTime, type: "SYNC",
        status: "COMPLETED", user: userName, machine: machineName,
        title: logTitle, details: logDetails,
      };

      if (!isAutoSync || totalChanged > 0 || pullErrorMsg) {
        const prevHistoryRaw = localStorage.getItem("valeska_sync_history");
        const prevHistory: SyncLog[] = prevHistoryRaw ? JSON.parse(prevHistoryRaw) : [];
        localStorage.setItem("valeska_sync_history", JSON.stringify([newLog, ...prevHistory].slice(0, 50)));
      }

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
      if (isAuthSyncError(error)) {
        clearInvalidSyncSession();
      }

      const msg = isAuthSyncError(error)
        ? "Tu sesión cloud expiró. Inicia sesión nuevamente para renovar la sincronización."
        : error.message || "No se pudo conectar con la nube central.";
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
      window.__valeskaSyncInFlight = false;
      if (window.__valeskaSyncPending) {
        window.__valeskaSyncPending = false;
        window.setTimeout(() => {
          window.dispatchEvent(new Event("valeska_request_sync"));
        }, 500);
      }
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

