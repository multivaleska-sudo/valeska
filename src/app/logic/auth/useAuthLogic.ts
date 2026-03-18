import { useState } from "react";
import { useNavigate } from "react-router";
import { invoke } from "@tauri-apps/api/core";
import Database from "@tauri-apps/plugin-sql";
import { drizzle } from "drizzle-orm/sqlite-proxy";
import { eq } from "drizzle-orm";
import * as bcrypt from "bcryptjs";
import * as schema from "../../db/schema";

const getDb = async () => {
    const sqlite = await Database.load("sqlite:valeska.db");
    return drizzle(async (sql, params, method) => {
        try {
            if (method === "run") {
                await sqlite.execute(sql, params);
                return { rows: [] };
            } else {
                const result: any[] = await sqlite.select(sql, params);
                return { rows: result };
            }
        } catch (e) {
            console.error("Error SQL:", e);
            throw e;
        }
    }, { schema });
};

export function useAuthLogic() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [isFirstRun, setIsFirstRun] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const checkInitialSetup = async () => {
        try {
            const sqlite = await Database.load("sqlite:valeska.db");
            const allUsers: any[] = await sqlite.select("SELECT id FROM usuarios LIMIT 1");

            if (allUsers.length === 0) {
                setIsFirstRun(true);
                if (window.location.pathname !== "/auth/welcome") navigate("/auth/welcome");
                return;
            }

            setIsFirstRun(false);

            const sessionString = localStorage.getItem("valeska_session_user");

            if (!sessionString) {
                if (window.location.pathname !== "/auth/login" && window.location.pathname !== "/auth/forgot-password") {
                    navigate("/auth/login");
                }
                return;
            }

            const sessionData = JSON.parse(sessionString);

            const userCheck: any[] = await sqlite.select(
                "SELECT esta_activo FROM usuarios WHERE id = $1",
                [sessionData.id]
            );

            const dbUser = userCheck[0];

            if (!dbUser || dbUser.esta_activo === 0 || dbUser.esta_activo === false || dbUser.esta_activo === '0') {
                localStorage.removeItem("valeska_session_user");
                alert("🔒 Tu sesión ha expirado o tu cuenta fue bloqueada por el Administrador Central.");
                navigate("/auth/login");
                return;
            }

            if (window.location.pathname === "/auth/login" || window.location.pathname === "/auth/welcome") {
                navigate("/");
            }

        } catch (err) {
            console.error("Error validando BD:", err);
            setError("Error de conexión con la base de datos local.");
        } finally {
            setIsLoading(false);
        }
    };

    const processProvisioningFile = async (filePath: string) => {
        setError(null);
        try {
            const jsonString = await invoke<string>("import_provisioning_profile", { filePath });
            const provisionData = JSON.parse(jsonString);

            const db = await getDb();

            const usedProvision = await db.select().from(schema.dispositivos)
                .where(eq(schema.dispositivos.provisionId, provisionData.provision_id));

            if (usedProvision.length > 0) {
                throw new Error("Este archivo de configuración ya fue utilizado.");
            }

            let realMacAddress = "MAC-DESCONOCIDA";
            try {
                realMacAddress = await invoke("get_device_mac");
            } catch (e) {
                realMacAddress = `MAC-FALLBACK-${Date.now()}`;
            }

            const now = new Date();

            await db.insert(schema.sucursales).values({
                id: provisionData.sucursal.id,
                nombre: provisionData.sucursal.nombre,
                direccion: provisionData.sucursal.direccion || "",
                esCentral: provisionData.tipo_licencia === "MASTER",
                createdAt: now,
                updatedAt: now,
            }).onConflictDoNothing();

            const deviceId = crypto.randomUUID();
            await db.insert(schema.dispositivos).values({
                id: deviceId,
                macAddress: realMacAddress,
                nombreEquipo: "EQUIPO-VALESKA",
                autorizado: true,
                sucursalId: provisionData.sucursal.id,
                provisionId: provisionData.provision_id,
                createdAt: now,
                updatedAt: now,
            });

            const userId = crypto.randomUUID();
            let finalHash = provisionData.admin.password_temporal_hash;
            if (!finalHash && provisionData.admin.password_temporal) {
                const salt = bcrypt.genSaltSync(10);
                finalHash = bcrypt.hashSync(provisionData.admin.password_temporal, salt);
            }

            await db.insert(schema.usuarios).values({
                id: userId,
                username: provisionData.admin.username,
                passwordHash: finalHash,
                rol: provisionData.tipo_licencia === "MASTER" ? "ADMIN_CENTRAL" : "OPERADOR",
                nombreCompleto: provisionData.admin.nombre,
                dispositivoId: deviceId,
                estaActivo: true,
                createdAt: now,
                updatedAt: now,
            });

            return true;
        } catch (err: any) {
            console.error("Error en provisión:", err);
            setError(err.message || "El archivo está corrupto o alterado.");
            return false;
        }
    };

    const login = async (username: string, passwordPlain: string) => {
        setError(null);
        try {
            const sqlite = await Database.load("sqlite:valeska.db");

            const result: any[] = await sqlite.select(
                "SELECT id, username, rol, nombre_completo, password_hash, esta_activo FROM usuarios WHERE username = $1",
                [username]
            );

            const user = result[0];

            if (!user) {
                setError("Usuario o correo no encontrado.");
                return false;
            }

            if (user.esta_activo === 0 || user.esta_activo === false || user.esta_activo === '0') {
                setError("Su cuenta ha sido bloqueada por el Administrador.");
                return false;
            }

            const isMatch = bcrypt.compareSync(passwordPlain, user.password_hash);

            if (!isMatch) {
                setError("Contraseña incorrecta.");
                return false;
            }

            localStorage.setItem("valeska_session_user", JSON.stringify({
                id: user.id,
                username: user.username,
                rol: user.rol,
                nombre: user.nombre_completo
            }));

            navigate("/");
            return true;

        } catch (err) {
            console.error("Fallo de Login:", err);
            setError("Error interno al procesar el inicio de sesión.");
            return false;
        }
    };

    const updatePasswordLocal = async (username: string, newPasswordPlain: string) => {
        try {
            const sqlite = await Database.load("sqlite:valeska.db");
            const salt = bcrypt.genSaltSync(10);
            const newHash = bcrypt.hashSync(newPasswordPlain, salt);

            await sqlite.execute(
                "UPDATE usuarios SET password_hash = $1, updated_at = $2 WHERE username = $3",
                [newHash, new Date().toISOString(), username]
            );

            return true;
        } catch (err) {
            console.error("Error actualizando contraseña:", err);
            return false;
        }
    };

    const logout = () => {
        localStorage.removeItem("valeska_session_user");
        navigate("/auth/login");
    };

    return {
        checkInitialSetup,
        processProvisioningFile,
        login,
        updatePasswordLocal,
        logout,
        isLoading,
        isFirstRun,
        error
    };
}