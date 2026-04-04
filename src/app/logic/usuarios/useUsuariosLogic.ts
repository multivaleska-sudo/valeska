import { useState, useEffect } from "react";
import Database from "@tauri-apps/plugin-sql";
import * as bcrypt from "bcryptjs";
import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import { sileo } from "sileo";

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
      const result: UserDB[] = await sqlite.select(
        "SELECT * FROM usuarios ORDER BY created_at DESC",
      );
      setUsers(result);
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
      sileo.error({
        title: "Error de Carga",
        description: "No se pudieron cargar los usuarios.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleUserStatus = async (
    id: string,
    currentStatus: boolean | number,
  ) => {
    try {
      const sqlite = await Database.load("sqlite:valeska.db");
      const newStatus = currentStatus ? 0 : 1;
      await sqlite.execute(
        "UPDATE usuarios SET esta_activo = $1, updated_at = $2 WHERE id = $3",
        [newStatus, new Date().toISOString(), id],
      );
      await fetchUsers();
      window.dispatchEvent(
        new CustomEvent("valeska_request_sync", {
          detail: {
            title: currentStatus
              ? "Bloqueo de Usuario"
              : "Desbloqueo de Usuario",
            details: `Se cambió el estado de acceso de un empleado.`,
          },
        }),
      );
      sileo.success({
        title: "Estado Actualizado",
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

  const deleteUser = async (id: string, role: string) => {
    if (role === "ADMIN_CENTRAL") {
      sileo.warning({
        title: "Acción no permitida",
        description: "No puedes eliminar al Administrador Central.",
      });
      return;
    }
    const confirm = window.confirm(
      "¿Estás seguro de que deseas eliminar este usuario permanentemente?",
    );
    if (!confirm) return;

    try {
      const sqlite = await Database.load("sqlite:valeska.db");
      await sqlite.execute("DELETE FROM usuarios WHERE id = $1", [id]);
      await fetchUsers();
      window.dispatchEvent(new Event("valeska_request_sync"));
      sileo.success({
        title: "Usuario Eliminado",
        description: "El usuario ha sido eliminado correctamente.",
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
      const sqlite = await Database.load("sqlite:valeska.db");
      const now = new Date().toISOString();

      if (isEditing) {
        if (userData.password) {
          const salt = bcrypt.genSaltSync(10);
          const hash = bcrypt.hashSync(userData.password, salt);
          await sqlite.execute(
            "UPDATE usuarios SET nombre_completo = $1, username = $2, rol = $3, password_hash = $4, updated_at = $5 WHERE id = $6",
            [
              userData.name,
              userData.email,
              userData.role,
              hash,
              now,
              userData.id,
            ],
          );
        } else {
          await sqlite.execute(
            "UPDATE usuarios SET nombre_completo = $1, username = $2, rol = $3, updated_at = $4 WHERE id = $5",
            [userData.name, userData.email, userData.role, now, userData.id],
          );
        }
      } else {
        if (!userData.password)
          throw new Error("La contraseña es obligatoria para usuarios nuevos.");

        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(userData.password, salt);
        const newId = crypto.randomUUID();

        const deviceResult: any[] = await sqlite.select(
          "SELECT id FROM dispositivos LIMIT 1",
        );
        const deviceId = deviceResult[0]?.id || "";

        await sqlite.execute(
          "INSERT INTO usuarios (id, username, password_hash, rol, nombre_completo, dispositivo_id, esta_activo, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
          [
            newId,
            userData.email,
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
      await fetchUsers();
      window.dispatchEvent(
        new CustomEvent("valeska_request_sync", {
          detail: {
            title: isEditing
              ? "Actualización de Perfil"
              : "Registro de Nuevo Usuario",
            details: `Se ${isEditing ? "modificaron los datos" : "creó la cuenta"} de ${userData.name}.`,
          },
        }),
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
      sileo.error({
        title: "Error al guardar",
        description:
          error.message || "Error al guardar el usuario en la base de datos.",
      });
      return false;
    }
  };

  const resetToTemporaryPassword = async (id: string) => {
    try {
      const sqlite = await Database.load("sqlite:valeska.db");
      const tempPassword = "Valeska" + Math.floor(1000 + Math.random() * 9000);

      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(tempPassword, salt);

      await sqlite.execute(
        "UPDATE usuarios SET password_hash = $1, updated_at = $2 WHERE id = $3",
        [hash, new Date().toISOString(), id],
      );
      window.dispatchEvent(
        new CustomEvent("valeska_request_sync", {
          detail: {
            title: "Reseteo de Contraseña",
            details: "Se generó una clave temporal.",
          },
        }),
      );

      sileo.success({
        title: "Contraseña Reseteada",
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
      const sqlite = await Database.load("sqlite:valeska.db");
      await sqlite.execute(
        "UPDATE usuarios SET rol = 'OPERADOR' WHERE id = $1",
        [currentAdminId],
      );
      await sqlite.execute(
        "UPDATE usuarios SET rol = 'ADMIN_CENTRAL' WHERE id = $1",
        [newAdminId],
      );

      await fetchUsers();
      window.dispatchEvent(
        new CustomEvent("valeska_request_sync", {
          detail: {
            title: "Transferencia de Mando (Peligro)",
            details: "Se ha cedido el rol de Administrador Central.",
          },
        }),
      );
      sileo.success({
        title: "Transferencia Exitosa",
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

  // =======================================================================
  // NUEVO: GENERAR ARCHIVO .VALESKA ENCRIPTADO (VIA RUST)
  // =======================================================================
  const exportProvisioningFile = async (userId: string) => {
    try {
      const sqlite = await Database.load("sqlite:valeska.db");

      // 1. Obtener datos del usuario y sucursal
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

      // 2. Armar el Payload (El contenido)
      const payload = {
        provision_id: crypto.randomUUID(),
        tipo_licencia: user.rol === "ADMIN_CENTRAL" ? "MASTER" : "OPERADOR",
        sucursal: {
          id: sucursal.id,
          nombre: sucursal.nombre,
          direccion: sucursal.direccion || "",
        },
        admin: {
          username: user.username,
          nombre: user.nombre_completo,
          password_temporal_hash: user.password_hash,
        },
      };

      const fileContent = JSON.stringify(payload);

      // 3. Abrir la ventana nativa de Windows/Mac para elegir dónde guardarlo
      const filePath = await save({
        filters: [{ name: "Licencia Valeska", extensions: ["valeska"] }],
        defaultPath: `${user.nombre_completo.replace(/\s+/g, "_")}_Licencia.valeska`,
      });

      // Si el usuario no canceló la ventana de guardar...
      if (filePath) {
        // Generamos 12 bytes aleatorios para la encriptación (Nonce) desde el navegador seguro
        const nonceArray = new Uint8Array(12);
        window.crypto.getRandomValues(nonceArray);
        const nonceBytes = Array.from(nonceArray);

        // 4. Se lo pasamos a Rust para que lo encripte con la llave maestra y lo guarde
        await invoke("generate_provisioning_file", {
          payload: fileContent,
          filePath: filePath,
          nonceBytes: nonceBytes,
        });

        sileo.success({
          title: "Exportación Exitosa",
          description: "Licencia exportada y encriptada exitosamente.",
        });
      }
    } catch (error: any) {
      console.error("Error al exportar:", error);
      sileo.error({
        title: "Error de Exportación",
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
