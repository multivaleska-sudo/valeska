import { useEffect, useState } from "react";
import { getDb } from "../../db/localDb";
import * as bcrypt from "bcryptjs";
import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import { sileo } from "sileo";
import { executePush } from "../sync/pushActions";

const API_URL = (import.meta as any).env.VITE_API_URL;

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
      const sqlite = await getDb();
      const result: UserDB[] = await sqlite.select(
        "SELECT * FROM usuarios WHERE deleted_at IS NULL ORDER BY created_at DESC",
      );
      setUsers(result);
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
      sileo.error({
        title: "Error de carga",
        description: "No se pudieron cargar los usuarios.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const getActiveSession = () => {
    const sessionRaw = localStorage.getItem("valeska_session_user");
    if (!sessionRaw) return null;

    try {
      return JSON.parse(sessionRaw);
    } catch {
      return null;
    }
  };

  const hasCloudToken = () => {
    const session = getActiveSession();
    return Boolean(localStorage.getItem("valeska_access_token") || session?.accessToken);
  };

  const requestUserSync = async (sqlite: any, title: string, details: string) => {
    window.dispatchEvent(
      new CustomEvent("valeska_request_sync", {
        detail: { title, details },
      }),
    );

    const session = getActiveSession();
    if (!session?.id || !hasCloudToken()) {
      sileo.warning({
        title: "Guardado local",
        description:
          "El cambio quedó pendiente porque no hay una sesión cloud activa.",
      });
      return;
    }

    try {
      await executePush({ apiUrl: API_URL }, session.id, sqlite);
      sileo.success({
        title: "Sincronizado",
        description: "Los cambios de usuarios fueron enviados a la nube.",
      });
    } catch (error: any) {
      console.warn("No se pudo sincronizar usuarios inmediatamente:", error);
      sileo.warning({
        title: "Pendiente de sincronización",
        description:
          error?.message ||
          "El cambio fue guardado localmente y se reintentará más adelante.",
      });
    }
  };

  const toggleUserStatus = async (
    id: string,
    currentStatus: boolean | number,
  ) => {
    try {
      const sqlite = await getDb();
      const newStatus = currentStatus ? 0 : 1;
      await sqlite.execute(
        "UPDATE usuarios SET esta_activo = $1, updated_at = $2, sync_status = 'LOCAL_UPDATE' WHERE id = $3",
        [newStatus, new Date().toISOString(), id],
      );
      await fetchUsers();
      await requestUserSync(
        sqlite,
        currentStatus ? "Bloqueo de Usuario" : "Desbloqueo de Usuario",
        "Se cambió el estado de acceso de un empleado.",
      );
      sileo.success({
        title: "Estado actualizado",
        description: newStatus ? "Usuario desbloqueado." : "Usuario bloqueado.",
      });
    } catch (error) {
      console.error("Error al cambiar estado:", error);
      sileo.error({
        title: "Error",
        description: "No se pudo cambiar el estado del usuario.",
      });
    }
  };

  const deleteUser = async (id: string, currentUserId: string) => {
    if (id === currentUserId) {
      sileo.warning({
        title: "Acción no permitida",
        description:
          "No puedes eliminar tu propia cuenta mientras estás en sesión.",
      });
      return;
    }

    try {
      const sqlite = await getDb();
      const now = Date.now();

      await sqlite.execute(
        "UPDATE usuarios SET deleted_at = $1, esta_activo = 0, sync_status = 'LOCAL_UPDATE' WHERE id = $2",
        [now, id],
      );

      await fetchUsers();
      await requestUserSync(
        sqlite,
        "Eliminación de Usuario",
        "Se retiró un usuario del sistema.",
      );
      sileo.success({
        title: "Usuario eliminado",
        description: "El usuario ha sido retirado del sistema.",
      });
    } catch (error) {
      console.error("Error al eliminar:", error);
      sileo.error({
        title: "Error",
        description: "No se pudo eliminar al usuario.",
      });
    }
  };

  const saveUser = async (userData: any, isEditing: boolean) => {
    try {
      const sqlite = await getDb();
      const now = new Date().toISOString();
      const username = String(userData.email || "").trim();

      if (!username) {
        throw new Error("El usuario o correo es obligatorio.");
      }

      if (isEditing) {
        if (userData.password) {
          const salt = bcrypt.genSaltSync(10);
          const hash = bcrypt.hashSync(userData.password, salt);
          await sqlite.execute(
            "UPDATE usuarios SET nombre_completo = $1, username = $2, rol = $3, password_hash = $4, updated_at = $5, sync_status = 'LOCAL_UPDATE' WHERE id = $6",
            [userData.name, username, userData.role, hash, now, userData.id],
          );
        } else {
          await sqlite.execute(
            "UPDATE usuarios SET nombre_completo = $1, username = $2, rol = $3, updated_at = $4, sync_status = 'LOCAL_UPDATE' WHERE id = $5",
            [userData.name, username, userData.role, now, userData.id],
          );
        }
      } else {
        if (!userData.password) {
          throw new Error("La contraseña es obligatoria para usuarios nuevos.");
        }

        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(userData.password, salt);

        const existing: any[] = await sqlite.select(
          "SELECT id FROM usuarios WHERE LOWER(username) = LOWER($1)",
          [username],
        );

        if (existing.length > 0) {
          const targetId = existing[0].id;
          await sqlite.execute(
            "UPDATE usuarios SET nombre_completo = $1, rol = $2, password_hash = $3, esta_activo = 1, deleted_at = NULL, updated_at = $4, sync_status = 'LOCAL_UPDATE' WHERE id = $5",
            [userData.name, userData.role, hash, now, targetId],
          );
        } else {
          const newId = crypto.randomUUID();
          const deviceResult: any[] = await sqlite.select(
            "SELECT id FROM dispositivos LIMIT 1",
          );
          const deviceId = deviceResult[0]?.id || "";

          await sqlite.execute(
            "INSERT INTO usuarios (id, username, password_hash, rol, nombre_completo, dispositivo_id, esta_activo, created_at, updated_at, sync_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'LOCAL_INSERT')",
            [
              newId,
              username,
              hash,
              userData.role,
              userData.name,
              deviceId,
              1,
              now,
              now,
            ],
          );
        }
      }

      await fetchUsers();
      await requestUserSync(
        sqlite,
        isEditing ? "Actualización de Perfil" : "Registro de Nuevo Usuario",
        `Se ${isEditing ? "modificaron los datos" : "creó la cuenta"} de ${userData.name}.`,
      );

      sileo.success({
        title: "Éxito",
        description: isEditing
          ? "Datos actualizados correctamente."
          : "Usuario registrado correctamente.",
      });
      return true;
    } catch (error: any) {
      console.error("Error al guardar usuario:", error);
      const msg = typeof error === "string" ? error : error.message;
      sileo.error({
        title: "Error al guardar",
        description: msg || "Error al guardar el usuario en la base de datos.",
      });
      return false;
    }
  };

  const resetToTemporaryPassword = async (id: string) => {
    try {
      const sqlite = await getDb();
      const tempPassword = "Valeska" + Math.floor(1000 + Math.random() * 9000);

      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(tempPassword, salt);

      await sqlite.execute(
        "UPDATE usuarios SET password_hash = $1, updated_at = $2, sync_status = 'LOCAL_UPDATE' WHERE id = $3",
        [hash, new Date().toISOString(), id],
      );
      await requestUserSync(
        sqlite,
        "Reseteo de Contraseña",
        "Se generó una clave temporal.",
      );

      sileo.success({
        title: "Contraseña reseteada",
        description: `Nueva contraseña temporal: ${tempPassword}`,
      });
    } catch (error) {
      console.error("Error al resetear contraseña:", error);
      sileo.error({
        title: "Error",
        description: "Error al intentar resetear la contraseña.",
      });
    }
  };

  const transferAdmin = async (currentAdminId: string, newAdminId: string) => {
    try {
      const sqlite = await getDb();
      await sqlite.execute(
        "UPDATE usuarios SET rol = 'OPERADOR', sync_status = 'LOCAL_UPDATE' WHERE id = $1",
        [currentAdminId],
      );
      await sqlite.execute(
        "UPDATE usuarios SET rol = 'ADMIN_CENTRAL', sync_status = 'LOCAL_UPDATE' WHERE id = $1",
        [newAdminId],
      );

      await fetchUsers();
      await requestUserSync(
        sqlite,
        "Transferencia de Mando",
        "Se cedió el rol de Administrador Central.",
      );
      sileo.success({
        title: "Transferencia exitosa",
        description: "El rol de Administrador Central ha sido transferido.",
      });
      return true;
    } catch (error) {
      console.error("Error al transferir mando:", error);
      sileo.error({
        title: "Error",
        description: "No se pudo transferir el mando.",
      });
      return false;
    }
  };

  const exportProvisioningFile = async (userId: string) => {
    try {
      const sqlite = await getDb();

      const userResult: any[] = await sqlite.select(
        "SELECT * FROM usuarios WHERE id = $1",
        [userId],
      );
      const user = userResult[0];
      if (!user) throw new Error("Usuario no encontrado.");

      const dispResult: any[] = await sqlite.select(
        "SELECT sucursal_id FROM dispositivos LIMIT 1",
      );
      const sucursalId = dispResult[0]?.sucursal_id;

      const sucResult: any[] = await sqlite.select(
        "SELECT * FROM sucursales WHERE id = $1",
        [sucursalId],
      );
      const sucursal = sucResult[0];
      if (!sucursal) throw new Error("Sucursal no encontrada.");

      const payload = {
        provision_id: crypto.randomUUID(),
        tipo_licencia: user.rol === "ADMIN_CENTRAL" ? "MASTER" : "OPERADOR",
        sucursal: {
          id: sucursal.id,
          nombre: sucursal.nombre,
          codigo: sucursal.codigo || null,
          direccion: sucursal.direccion || "",
        },
        admin: {
          id: user.id,
          username: user.username,
          nombre: user.nombre_completo,
          password_temporal_hash: user.password_hash,
        },
      };

      const filePath = await save({
        filters: [{ name: "Licencia Valeska", extensions: ["valeska"] }],
        defaultPath: `${user.nombre_completo.replace(/\s+/g, "_")}_Licencia.valeska`,
      });

      if (filePath) {
        const nonceArray = new Uint8Array(12);
        window.crypto.getRandomValues(nonceArray);

        await invoke("generate_provisioning_file", {
          payload: JSON.stringify(payload),
          filePath,
          nonceBytes: Array.from(nonceArray),
        });

        sileo.success({
          title: "Exportación exitosa",
          description: "Licencia exportada y encriptada exitosamente.",
        });
      }
    } catch (error: any) {
      console.error("Error al exportar:", error);
      sileo.error({
        title: "Error de exportación",
        description:
          error.message || "Error interno al generar el archivo de provisión.",
      });
    }
  };

  return {
    users,
    isLoading,
    toggleUserStatus,
    deleteUser,
    saveUser,
    transferAdmin,
    resetToTemporaryPassword,
    exportProvisioningFile,
  };
}
