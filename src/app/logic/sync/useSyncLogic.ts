import { useState, useEffect, useCallback } from "react";
import Database from "@tauri-apps/plugin-sql";

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
        push: { sucursales: 0, dispositivos: 0, usuarios: 0 },
        pull: { sucursales: 0, dispositivos: 0, usuarios: 0 }
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

            const pullRes = await fetch(`${API_URL}/sync/pull?lastSync=${encodeURIComponent(lastSyncIso)}`, {
                headers: { "x-user-id": session.id }
            });

            if (pullRes.status === 401) {
                await sqlite.execute("UPDATE usuarios SET esta_activo = 0 WHERE id = $1", [session.id]);
                localStorage.removeItem("valeska_session_user");
                window.location.href = "/auth/login";
                return false;
            }

            if (!pullRes.ok) throw new Error(`Error en PULL: ${pullRes.statusText}`);

            const pullData = await pullRes.json();

            for (const suc of pullData.sucursales || []) {
                await sqlite.execute("INSERT OR REPLACE INTO sucursales (id, nombre, direccion, es_central, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6)",
                    [suc.id, suc.nombre, suc.direccion || "", suc.esCentral ? 1 : 0, suc.createdAt, suc.updatedAt]);
            }
            for (const disp of pullData.dispositivos || []) {
                await sqlite.execute("INSERT OR REPLACE INTO dispositivos (id, mac_address, nombre_equipo, autorizado, sucursal_id, provision_id, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
                    [disp.id, disp.macAddress, disp.nombreEquipo, disp.autorizado ? 1 : 0, disp.sucursalId, disp.provisionId, disp.createdAt, disp.updatedAt]);
            }
            for (const usr of pullData.usuarios || []) {
                await sqlite.execute("INSERT OR REPLACE INTO usuarios (id, username, password_hash, rol, nombre_completo, esta_activo, dispositivo_id, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
                    [usr.id, usr.username, usr.passwordHash, usr.rol, usr.nombreCompleto, usr.estaActivo ? 1 : 0, usr.dispositivoId, usr.createdAt, usr.updatedAt]);
            }

            const sucursalesRaw: any[] = await sqlite.select("SELECT * FROM sucursales");
            const dispositivosRaw: any[] = await sqlite.select("SELECT * FROM dispositivos");
            const usuariosRaw: any[] = await sqlite.select("SELECT * FROM usuarios");

            const formatDateForNest = (val: any) => {
                if (!val) return null;
                if (typeof val === 'number') {
                    const ms = val < 10000000000 ? val * 1000 : val;
                    return new Date(ms).toISOString();
                }
                return new Date(val).toISOString();
            };

            const payload = {
                sucursales: sucursalesRaw.map(s => ({ id: s.id, nombre: s.nombre, direccion: s.direccion, esCentral: s.es_central === 1 || s.es_central === true, createdAt: formatDateForNest(s.created_at), updatedAt: formatDateForNest(s.updated_at), deletedAt: formatDateForNest(s.deleted_at) })),
                dispositivos: dispositivosRaw.map(d => ({ id: d.id, macAddress: d.mac_address, nombreEquipo: d.nombre_equipo, autorizado: d.autorizado === 1 || d.autorizado === true, provisionId: d.provision_id, sucursalId: d.sucursal_id, createdAt: formatDateForNest(d.created_at), updatedAt: formatDateForNest(d.updated_at), deletedAt: formatDateForNest(d.deleted_at) })),
                usuarios: usuariosRaw.map(u => ({ id: u.id, username: u.username, passwordHash: u.password_hash, rol: u.rol, nombreCompleto: u.nombre_completo, estaActivo: u.esta_activo === 1 || u.esta_activo === true, dispositivoId: u.dispositivo_id, createdAt: formatDateForNest(u.created_at), updatedAt: formatDateForNest(u.updated_at), deletedAt: formatDateForNest(u.deleted_at) }))
            };

            const pushRes = await fetch(`${API_URL}/sync/push`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "x-user-id": session.id },
                body: JSON.stringify(payload),
            });

            if (!pushRes.ok) throw new Error(`Error en PUSH: ${pushRes.statusText}`);
            const pushData = await pushRes.json();

            const now = new Date();
            const displayTime = now.toLocaleString("es-PE", { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });

            localStorage.setItem("valeska_last_sync_iso", pushData.timestamp || now.toISOString());
            localStorage.setItem("valeska_last_sync_display", displayTime);

            const currentStats = {
                push: { sucursales: payload.sucursales.length, dispositivos: payload.dispositivos.length, usuarios: payload.usuarios.length },
                pull: { sucursales: pullData.sucursales?.length || 0, dispositivos: pullData.dispositivos?.length || 0, usuarios: pullData.usuarios?.length || 0 }
            };
            localStorage.setItem("valeska_sync_stats", JSON.stringify(currentStats));

            const logTitle = context?.title || "Sincronización Bidireccional Automática";
            const totalPulled = currentStats.pull.usuarios + currentStats.pull.dispositivos + currentStats.pull.sucursales;
            let logDetails = `Subidos: ${payload.usuarios.length} Usr, ${payload.dispositivos.length} Eqp. Descargados: ${totalPulled} registros.`;

            if (context?.details) logDetails = `${context.details} | ${logDetails}`;

            const newLog: SyncLog = {
                id: crypto.randomUUID(), timestamp: displayTime, type: "SYNC", status: "COMPLETED",
                user: session.nombre, machine: machineName, title: logTitle, details: logDetails
            };

            const prevHistoryRaw = localStorage.getItem("valeska_sync_history");
            const prevHistory: SyncLog[] = prevHistoryRaw ? JSON.parse(prevHistoryRaw) : [];
            localStorage.setItem("valeska_sync_history", JSON.stringify([newLog, ...prevHistory].slice(0, 50)));

            window.dispatchEvent(new Event("valeska_sync_completed"));
            return true;

        } catch (error: any) {
            console.error("Error en sincronización:", error);
            setSyncError(error.message || "No se pudo conectar con la nube central.");
            return false;
        } finally {
            setIsSyncing(false);
        }
    }, []);

    return { isSyncing, lastSyncTime, syncError, syncStats, syncHistory, triggerSync };
}