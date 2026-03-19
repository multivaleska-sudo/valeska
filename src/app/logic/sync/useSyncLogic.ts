import { useState, useEffect, useCallback } from "react";
import Database from "@tauri-apps/plugin-sql";

const API_URL = (import.meta as any).env.VITE_API_URL;

export function useSyncLogic() {
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
    const [syncError, setSyncError] = useState<string | null>(null);
    const [syncStats, setSyncStats] = useState({ sucursales: 0, dispositivos: 0, usuarios: 0 });

    useEffect(() => {
        const savedTime = localStorage.getItem("valeska_last_sync");
        if (savedTime) setLastSyncTime(savedTime);
    }, []);

    const triggerSync = useCallback(async () => {
        setIsSyncing(true);
        setSyncError(null);

        try {
            const sqlite = await Database.load("sqlite:valeska.db");

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

            const sucursales = sucursalesRaw.map(s => ({
                id: s.id,
                nombre: s.nombre,
                direccion: s.direccion,
                esCentral: s.es_central === 1 || s.es_central === true,
                createdAt: formatDateForNest(s.created_at),
                updatedAt: formatDateForNest(s.updated_at),
                deletedAt: formatDateForNest(s.deleted_at)
            }));

            const dispositivos = dispositivosRaw.map(d => ({
                id: d.id,
                macAddress: d.mac_address,
                nombreEquipo: d.nombre_equipo,
                autorizado: d.autorizado === 1 || d.autorizado === true,
                provisionId: d.provision_id,
                sucursalId: d.sucursal_id,
                createdAt: formatDateForNest(d.created_at),
                updatedAt: formatDateForNest(d.updated_at),
                deletedAt: formatDateForNest(d.deleted_at)
            }));

            const usuarios = usuariosRaw.map(u => ({
                id: u.id,
                username: u.username,
                passwordHash: u.password_hash,
                rol: u.rol,
                nombreCompleto: u.nombre_completo,
                estaActivo: u.esta_activo === 1 || u.esta_activo === true,
                dispositivoId: u.dispositivo_id,
                createdAt: formatDateForNest(u.created_at),
                updatedAt: formatDateForNest(u.updated_at),
                deletedAt: formatDateForNest(u.deleted_at)
            }));

            setSyncStats({
                sucursales: sucursales.length,
                dispositivos: dispositivos.length,
                usuarios: usuarios.length
            });

            const payload = { sucursales, dispositivos, usuarios };

            const response = await fetch(`${API_URL}/sync/push`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error(`Error del servidor: ${response.statusText}`);
            }

            const data = await response.json();

            const now = new Date().toLocaleString("es-PE", {
                day: '2-digit', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit', second: '2-digit'
            });

            setLastSyncTime(now);
            localStorage.setItem("valeska_last_sync", now);

            return true;

        } catch (error: any) {
            console.error("Error en sincronización:", error);
            setSyncError(error.message || "No se pudo conectar con la nube central.");
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
        triggerSync
    };
}