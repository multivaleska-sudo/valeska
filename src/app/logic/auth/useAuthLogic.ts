import { useState, useEffect } from "react";
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
            console.error("Error ejecutando SQL:", e, sql, params);
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
            const db = await getDb();
            const allUsers = await db.select().from(schema.usuarios);

            if (allUsers.length === 0) {
                setIsFirstRun(true);
                if (window.location.pathname !== "/auth/welcome") {
                    navigate("/auth/welcome");
                }
            } else {
                setIsFirstRun(false);
                const session = localStorage.getItem("valeska_session_user");

                if (!session) {
                    if (window.location.pathname !== "/auth/login") {
                        navigate("/auth/login");
                    }
                }
            }
        } catch (err) {
            setError("Error de conexión con la base de datos.");
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
                throw new Error("Este archivo de configuración ya fue utilizado y no puede reciclarse.");
            }

            let realMacAddress = "MAC-DESCONOCIDA";
            try {
                realMacAddress = await invoke("get_device_mac");
            } catch (e) {
                console.warn("No se pudo leer MAC, usando respaldo temporal.");
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
            setError(err.message || "El archivo está corrupto, alterado o la llave de seguridad no coincide.");
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

    return {
        checkInitialSetup,
        processProvisioningFile,
        login,
        isLoading,
        isFirstRun,
        error
    };
}