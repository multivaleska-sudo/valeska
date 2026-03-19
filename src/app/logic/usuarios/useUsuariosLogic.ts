import { useState, useEffect } from "react";
import Database from "@tauri-apps/plugin-sql";
import * as bcrypt from "bcryptjs";

export interface UserDB {
    id: string;
    username: string;
    nombre_completo: string;
    rol: "ADMIN_CENTRAL" | "OPERADOR";
    esta_activo: boolean | number;
    dispositivo_id: string;
}

export function useUsuariosLogic() {
    const [users, setUsers] = useState<UserDB[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const sqlite = await Database.load("sqlite:valeska.db");
            const result: UserDB[] = await sqlite.select("SELECT * FROM usuarios ORDER BY created_at DESC");
            setUsers(result);
        } catch (error) {
            console.error("Error al cargar usuarios:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const toggleUserStatus = async (id: string, currentStatus: boolean | number) => {
        try {
            const sqlite = await Database.load("sqlite:valeska.db");
            const newStatus = currentStatus ? 0 : 1;
            await sqlite.execute("UPDATE usuarios SET esta_activo = $1, updated_at = $2 WHERE id = $3", [
                newStatus, new Date().toISOString(), id
            ]);
            await fetchUsers();
        } catch (error) {
            console.error("Error al cambiar estado:", error);
        }
    };

    const deleteUser = async (id: string, role: string) => {
        if (role === "ADMIN_CENTRAL") {
            alert("No puedes eliminar al Administrador Central.");
            return;
        }
        const confirm = window.confirm("¿Estás seguro de que deseas eliminar este usuario permanentemente?");
        if (!confirm) return;

        try {
            const sqlite = await Database.load("sqlite:valeska.db");
            await sqlite.execute("DELETE FROM usuarios WHERE id = $1", [id]);
            await fetchUsers();
        } catch (error) {
            console.error("Error al eliminar:", error);
        }
    };

    const saveUser = async (userData: any, isEditing: boolean) => {
        try {
            const sqlite = await Database.load("sqlite:valeska.db");
            const now = new Date().toISOString();

            if (isEditing) {
                if (userData.password) {
                    const salt = bcrypt.genSaltSync(10);
                    const hash = bcrypt.hashSync(userData.password, salt);
                    await sqlite.execute(
                        "UPDATE usuarios SET nombre_completo = $1, username = $2, rol = $3, password_hash = $4, updated_at = $5 WHERE id = $6",
                        [userData.name, userData.email, userData.role, hash, now, userData.id]
                    );
                } else {
                    await sqlite.execute(
                        "UPDATE usuarios SET nombre_completo = $1, username = $2, rol = $3, updated_at = $4 WHERE id = $5",
                        [userData.name, userData.email, userData.role, now, userData.id]
                    );
                }
            } else {
                if (!userData.password) throw new Error("La contraseña es obligatoria para usuarios nuevos.");

                const salt = bcrypt.genSaltSync(10);
                const hash = bcrypt.hashSync(userData.password, salt);
                const newId = crypto.randomUUID();

                const deviceResult: any[] = await sqlite.select("SELECT id FROM dispositivos LIMIT 1");
                const deviceId = deviceResult[0]?.id || "";

                await sqlite.execute(
                    "INSERT INTO usuarios (id, username, password_hash, rol, nombre_completo, dispositivo_id, esta_activo, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
                    [newId, userData.email, hash, userData.role, userData.name, deviceId, 1, now, now]
                );
            }
            await fetchUsers();
            return true;
        } catch (error: any) {
            console.error("Error al guardar usuario:", error);
            alert(error.message || "Error al guardar el usuario en la base de datos.");
            return false;
        }
    };

    const resetToTemporaryPassword = async (id: string) => {
        try {
            const sqlite = await Database.load("sqlite:valeska.db");
            const tempPassword = "Valeska" + Math.floor(1000 + Math.random() * 9000); // Ej: Valeska4829

            const salt = bcrypt.genSaltSync(10);
            const hash = bcrypt.hashSync(tempPassword, salt);

            await sqlite.execute("UPDATE usuarios SET password_hash = $1, updated_at = $2 WHERE id = $3", [
                hash, new Date().toISOString(), id
            ]);

            alert(`Contraseña reseteada con éxito.\nLa nueva contraseña temporal es: ${tempPassword}\n\nPor favor, entréguesela al usuario.`);
        } catch (error) {
            console.error("Error al resetear contraseña:", error);
            alert("Error al intentar resetear la contraseña.");
        }
    }

    const transferAdmin = async (currentAdminId: string, newAdminId: string) => {
        try {
            const sqlite = await Database.load("sqlite:valeska.db");
            await sqlite.execute("UPDATE usuarios SET rol = 'OPERADOR' WHERE id = $1", [currentAdminId]);
            await sqlite.execute("UPDATE usuarios SET rol = 'ADMIN_CENTRAL' WHERE id = $1", [newAdminId]);

            await fetchUsers();
            return true;
        } catch (error) {
            console.error("Error al transferir mando:", error);
            return false;
        }
    };

    return {
        users,
        isLoading,
        toggleUserStatus,
        deleteUser,
        saveUser,
        transferAdmin,
        resetToTemporaryPassword
    };
}