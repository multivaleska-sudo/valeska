import { useEffect } from "react";
import { getUnsafeDb } from "../../db/localDb";
import {
  SYNC_PULL_ORDER,
  getStoredCursor,
  getSyncState,
} from "../../services/syncService";

const API_URL = (import.meta as any).env.VITE_API_URL;
const POLLING_INTERVAL_MS = 60000;

export function usePassivePolling() {
  useEffect(() => {
    let timeoutId: number | null = null;
    let isChecking = false;

    const checkUpdates = async () => {
      if (isChecking || document.hidden || (window as any).__valeskaSyncInFlight) return;

      isChecking = true;
      window.dispatchEvent(new Event("valeska_checking_updates_start"));
      try {
        const sqlite = await getUnsafeDb();
        const remoteState = await getSyncState(API_URL, SYNC_PULL_ORDER);
        
        let hasUpdates = false;

        if (remoteState && remoteState.entities) {
          for (const entityName of SYNC_PULL_ORDER) {
            const entityState = remoteState.entities.find((e: any) => e.entityName === entityName);
            if (!entityState || !entityState.maxTimestamp) continue;

            const cursor = await getStoredCursor(sqlite, entityName);
            const remoteTime = new Date(entityState.maxTimestamp).getTime();
            
            // Si no tenemos cursor local, o el remoto es estrictamente mayor, hay actualizaciones
            if (!cursor || !cursor.cursorTimestamp) {
              if (remoteTime > 0) {
                hasUpdates = true;
                break;
              }
            } else {
              const localTime = new Date(cursor.cursorTimestamp).getTime();
              if (remoteTime > localTime) {
                hasUpdates = true;
                break;
              }
            }
          }
        }

        if (hasUpdates) {
          window.dispatchEvent(new Event("valeska_updates_available"));
        } else {
          window.dispatchEvent(new Event("valeska_updates_cleared"));
        }
      } catch (error) {
        console.warn("[Passive Polling] Error verificando actualizaciones", error);
      } finally {
        isChecking = false;
        window.dispatchEvent(new Event("valeska_checking_updates_end"));
      }
    };

    window.addEventListener("valeska_force_check_updates", checkUpdates);

    // Iniciar polling con un pequeño retraso inicial
    timeoutId = window.setTimeout(() => {
      checkUpdates();
      timeoutId = window.setInterval(checkUpdates, POLLING_INTERVAL_MS);
    }, 15000);

    return () => {
      window.removeEventListener("valeska_force_check_updates", checkUpdates);
      if (timeoutId) {
        clearTimeout(timeoutId);
        clearInterval(timeoutId);
      }
    };
  }, []);
}
