import { useState, useEffect } from "react";
import Database from "@tauri-apps/plugin-sql";
import * as bcrypt from "bcryptjs";

export function useConfigLogic() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isSavingSecurity, setIsSavingSecurity] = useState(false);
    const [isSavingSystem, setIsSavingSystem] = useState(false);

    // ================= ESTADOS: PERFIL =================
    const [userId, setUserId] = useState("");
    const [username, setUsername] = useState("");
    const [rol, setRol] = useState("");
    const [nombre, setNombre] = useState("");

    // ================= ESTADOS: SEGURIDAD =================
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // ================= ESTADOS: SISTEMA Y DISPOSITIVO =================
    const [dispositivoId, setDispositivoId] = useState("");
    const [dispositivoNombre, setDispositivoNombre] = useState("");
    const [sucursalId, setSucursalId] = useState("");
    const [sucursalesList, setSucursalesList] = useState<any[]>([]);
    const [autoSync, setAutoSync] = useState(true);

    // Cargar todos los datos al abrir la página
    useEffect(() => {
        const loadData = async () => {
            try {
                const sessionStr = localStorage.getItem("valeska_session_user");
                if (!sessionStr) return;

                const session = JSON.parse(sessionStr);
                setUserId(session.id);
                setUsername(session.username);
                setNombre(session.nombre);
                setRol(session.rol);

                // Cargar preferencia de Sincronización local
                const syncPref = localStorage.getItem("valeska_autosync");
                setAutoSync(syncPref !== "false"); // Por defecto es true

                // Cargar datos del dispositivo y sucursal desde SQLite
                const sqlite = await Database.load("sqlite:valeska.db");

                // 1. Obtener a qué dispositivo está amarrado este usuario
                const userDb: any[] = await sqlite.select("SELECT dispositivo_id FROM usuarios WHERE id = $1", [session.id]);
                if (userDb.length > 0 && userDb[0].dispositivo_id) {
                    const currentDispId = userDb[0].dispositivo_id;
                    setDispositivoId(currentDispId);

                    // 2. Obtener el nombre del dispositivo y su sucursal actual
                    const dispDb: any[] = await sqlite.select("SELECT nombre_equipo, sucursal_id FROM dispositivos WHERE id = $1", [currentDispId]);
                    if (dispDb.length > 0) {
                        setDispositivoNombre(dispDb[0].nombre_equipo || "PC-DESCONOCIDA");
                        setSucursalId(dispDb[0].sucursal_id || "");
                    }
                }

                // 3. Cargar la lista de todas las sucursales para el combo-box (Select)
                const sucursales: any[] = await sqlite.select("SELECT id, nombre FROM sucursales ORDER BY nombre ASC");
                setSucursalesList(sucursales);

            } catch (error) {
                console.error("Error al cargar la configuración:", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    // =====================================================================
    // ACCIONES DE GUARDADO
    // =====================================================================

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingProfile(true);
        try {
            const sqlite = await Database.load("sqlite:valeska.db");
            await sqlite.execute(
                "UPDATE usuarios SET nombre_completo = $1, updated_at = $2 WHERE id = $3",
                [nombre, new Date().toISOString(), userId]
            );

            const sessionStr = localStorage.getItem("valeska_session_user");
            if (sessionStr) {
                const session = JSON.parse(sessionStr);
                session.nombre = nombre;
                localStorage.setItem("valeska_session_user", JSON.stringify(session));
            }

            alert("✅ Perfil actualizado correctamente.");
            window.dispatchEvent(new Event("storage"));
        } catch (error) {
            console.error(error);
            alert("❌ Error al actualizar el perfil.");
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) { alert("⚠️ Las contraseñas no coinciden."); return; }
        if (newPassword.length < 6) { alert("⚠️ Mínimo 6 caracteres."); return; }

        setIsSavingSecurity(true);
        try {
            const sqlite = await Database.load("sqlite:valeska.db");
            const result: any[] = await sqlite.select("SELECT password_hash FROM usuarios WHERE id = $1", [userId]);

            if (!bcrypt.compareSync(currentPassword, result[0].password_hash)) {
                alert("❌ La contraseña actual es incorrecta.");
                setIsSavingSecurity(false);
                return;
            }

            const hash = bcrypt.hashSync(newPassword, bcrypt.genSaltSync(10));
            await sqlite.execute(
                "UPDATE usuarios SET password_hash = $1, updated_at = $2 WHERE id = $3",
                [hash, new Date().toISOString(), userId]
            );

            alert("✅ Contraseña actualizada con éxito.");
            setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
        } catch (error) {
            console.error(error);
            alert("❌ Error al cambiar la contraseña.");
        } finally {
            setIsSavingSecurity(false);
        }
    };

    const handleUpdateSystem = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingSystem(true);
        try {
            // 1. Guardamos preferencias locales
            localStorage.setItem("valeska_autosync", autoSync.toString());

            // 2. Guardamos cambios en SQLite
            if (dispositivoId) {
                const sqlite = await Database.load("sqlite:valeska.db");
                await sqlite.execute(
                    "UPDATE dispositivos SET nombre_equipo = $1, sucursal_id = $2, updated_at = $3 WHERE id = $4",
                    [dispositivoNombre.toUpperCase(), sucursalId, new Date().toISOString(), dispositivoId]
                );
            }

            alert("✅ Configuración del sistema y dispositivo guardada correctamente.");
        } catch (error) {
            console.error("Error al actualizar el sistema:", error);
            alert("❌ Error interno al guardar la configuración del dispositivo.");
        } finally {
            setIsSavingSystem(false);
        }
    };

    return {
        isLoading,
        isSavingProfile, isSavingSecurity, isSavingSystem,
        username, rol,

        nombre, setNombre,

        currentPassword, setCurrentPassword,
        newPassword, setNewPassword,
        confirmPassword, setConfirmPassword,

        dispositivoNombre, setDispositivoNombre,
        sucursalId, setSucursalId,
        sucursalesList,
        autoSync, setAutoSync,

        handleUpdateProfile, handleChangePassword, handleUpdateSystem
    };
}