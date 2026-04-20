import { useState } from "react";
import { useNavigate } from "react-router";
import { invoke } from "@tauri-apps/api/core";
import Database from "@tauri-apps/plugin-sql";
import { drizzle } from "drizzle-orm/sqlite-proxy";
import { eq } from "drizzle-orm";
import * as bcrypt from "bcryptjs";
import * as schema from "../../db/schema";
import { sileo } from "sileo";
// Solo importamos formatDateForNest, ya no usamos buildPushPayload aquí
import { formatDateForNest } from "../sync/pushActions";
import { processPullSync } from "../sync/pullActions";

const getDb = async () => {
  const sqlite = await Database.load("sqlite:valeska.db");
  return drizzle(
    async (sql, params, method) => {
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
    },
    { schema },
  );
};

const API_URL = (import.meta as any).env.VITE_API_URL;

export function useAuthLogic() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isFirstRun, setIsFirstRun] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkInitialSetup = async () => {
    try {
      const sqlite = await Database.load("sqlite:valeska.db");
      const allUsers: any[] = await sqlite.select(
        "SELECT id FROM usuarios LIMIT 1",
      );

      if (allUsers.length === 0) {
        setIsFirstRun(true);
        if (window.location.pathname !== "/auth/welcome")
          navigate("/auth/welcome");
        return;
      }

      setIsFirstRun(false);

      const sessionString = localStorage.getItem("valeska_session_user");

      if (!sessionString) {
        if (
          window.location.pathname !== "/auth/login" &&
          window.location.pathname !== "/auth/forgot-password"
        ) {
          navigate("/auth/login");
        }
        return;
      }

      const sessionData = JSON.parse(sessionString);
      const userCheck: any[] = await sqlite.select(
        "SELECT esta_activo FROM usuarios WHERE id = $1",
        [sessionData.id],
      );
      const dbUser = userCheck[0];

      if (
        !dbUser ||
        dbUser.esta_activo === 0 ||
        dbUser.esta_activo === false ||
        dbUser.esta_activo === "0"
      ) {
        localStorage.removeItem("valeska_session_user");
        sileo.error({
          title: "Acceso Denegado",
          description:
            "Tu sesión ha expirado o tu cuenta fue bloqueada por el Administrador Central.",
        });
        navigate("/auth/login");
        return;
      }

      if (
        window.location.pathname === "/auth/login" ||
        window.location.pathname === "/auth/welcome"
      ) {
        navigate("/");
      }
    } catch (err) {
      console.error("Error validando BD:", err);
      setError("Error de conexión con la base de datos local.");
      sileo.error({
        title: "Error",
        description: "Error de conexión con la base de datos local.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const processProvisioningFile = async (filePath: string) => {
    setError(null);
    try {
      const jsonString = await invoke<string>("import_provisioning_profile", {
        filePath,
      });
      const provisionData = JSON.parse(jsonString);

      const db = await getDb();

      const usedProvision = await db
        .select()
        .from(schema.dispositivos)
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

      await db
        .insert(schema.sucursales)
        .values({
          id: provisionData.sucursal.id,
          nombre: provisionData.sucursal.nombre,
          direccion: provisionData.sucursal.direccion || "",
          esCentral: provisionData.tipo_licencia === "MASTER",
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoNothing();

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

      const userId =
        provisionData.admin?.id ||
        provisionData.usuario?.id ||
        crypto.randomUUID();

      let finalHash = provisionData.admin.password_temporal_hash;
      if (!finalHash && provisionData.admin.password_temporal) {
        const salt = bcrypt.genSaltSync(10);
        finalHash = bcrypt.hashSync(
          provisionData.admin.password_temporal,
          salt,
        );
      }

      await db.insert(schema.usuarios).values({
        id: userId,
        username: provisionData.admin.username,
        passwordHash: finalHash,
        rol:
          provisionData.tipo_licencia === "MASTER"
            ? "ADMIN_CENTRAL"
            : "OPERADOR",
        nombreCompleto: provisionData.admin.nombre,
        dispositivoId: deviceId,
        estaActivo: true,
        createdAt: now,
        updatedAt: now,
      });

      sileo.success({
        title: "Configuración Exitosa",
        description: "El equipo ha sido aprovisionado correctamente.",
      });
      return true;
    } catch (err: any) {
      console.error("Error en provisión:", err);
      setError(err.message || "El archivo está corrupto o alterado.");
      sileo.error({
        title: "Error de Provisión",
        description: err.message || "El archivo está corrupto o alterado.",
      });
      return false;
    }
  };

  const cloudProvisioning = async (email: string, passwordPlain: string) => {
    setError(null);
    try {
      let realMacAddress = "MAC-DESCONOCIDA";
      try {
        realMacAddress = await invoke("get_device_mac");
      } catch (e) {
        realMacAddress = `MAC-FALLBACK-${Date.now()}`;
      }

      const response = await fetch(`${API_URL}/auth/provision-device`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email,
          password: passwordPlain,
          macAddress: realMacAddress,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(
          errData.message ||
            "Credenciales inválidas o conexión a la nube fallida.",
        );
      }

      const data = await response.json();

      const db = await getDb();
      const now = new Date();

      await db
        .insert(schema.sucursales)
        .values({
          id: data.sucursal.id,
          nombre: data.sucursal.nombre,
          direccion: data.sucursal.direccion || "",
          esCentral: data.sucursal.es_central,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoNothing();

      await db
        .insert(schema.dispositivos)
        .values({
          id: data.dispositivo.id,
          macAddress: data.dispositivo.macAddress,
          nombreEquipo: "NUEVA-PC-NUBE",
          autorizado: true,
          sucursalId: data.sucursal.id,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoNothing();

      await db
        .insert(schema.usuarios)
        .values({
          id: data.usuario.id,
          username: data.usuario.username,
          passwordHash: data.usuario.passwordHash,
          rol: data.usuario.rol,
          nombreCompleto: data.usuario.nombreCompleto,
          dispositivoId: data.dispositivo.id,
          estaActivo: true,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoNothing();

      sileo.success({
        title: "Sincronización Exitosa",
        description: "Configuración descargada desde la nube.",
      });
      return true;
    } catch (err: any) {
      console.error("Error en provisión por nube:", err);
      setError(
        err.message ||
          "Error interno al configurar el dispositivo desde la nube.",
      );
      sileo.error({
        title: "Error en Nube",
        description:
          err.message ||
          "Error interno al configurar el dispositivo desde la nube.",
      });
      return false;
    }
  };

  const login = async (username: string, passwordPlain: string) => {
    setError(null);
    try {
      const sqlite = await Database.load("sqlite:valeska.db");

      let result: any[] = await sqlite.select(
        "SELECT id, username, rol, nombre_completo, password_hash, esta_activo FROM usuarios WHERE username = $1",
        [username],
      );

      let user = result[0];

      if (user) {
        // ========================================================================
        // 1. PUSH MINIMALISTA: SOLO SUBIMOS LA CONFIGURACIÓN BASE (USUARIO)
        // ========================================================================
        try {
          const sucursalesRaw: any[] = await sqlite.select(
            "SELECT * FROM sucursales",
          );
          const dispositivosRaw: any[] = await sqlite.select(
            "SELECT * FROM dispositivos",
          );
          const usuariosRaw: any[] = await sqlite.select(
            "SELECT * FROM usuarios WHERE id = $1",
            [user.id],
          );

          // Payload ultra-ligero: SOLO manda las credenciales para que el backend te conozca
          const minimalPayload = {
            sucursales: sucursalesRaw.map((s) => ({
              id: s.id,
              nombre: s.nombre,
              direccion: s.direccion,
              esCentral: s.es_central === 1 || s.es_central === true,
              createdAt: formatDateForNest(s.created_at),
              updatedAt: formatDateForNest(s.updated_at),
              deletedAt: formatDateForNest(s.deleted_at),
            })),
            dispositivos: dispositivosRaw.map((d) => ({
              id: d.id,
              macAddress: d.mac_address,
              nombreEquipo: d.nombre_equipo,
              autorizado: d.autorizado === 1 || d.autorizado === true,
              provisionId: d.provision_id,
              sucursalId: d.sucursal_id,
              createdAt: formatDateForNest(d.created_at),
              updatedAt: formatDateForNest(d.updated_at),
              deletedAt: formatDateForNest(d.deleted_at),
            })),
            usuarios: usuariosRaw.map((u) => ({
              id: u.id,
              username: u.username,
              passwordHash: u.password_hash,
              rol: u.rol,
              nombreCompleto: u.nombre_completo,
              estaActivo: u.esta_activo === 1 || u.esta_activo === true,
              dispositivoId: u.dispositivo_id,
              createdAt: formatDateForNest(u.created_at),
              updatedAt: formatDateForNest(u.updated_at),
              deletedAt: formatDateForNest(u.deleted_at),
            })),
            // Todo lo demás va completamente vacío, el useSyncLogic se encargará de esto luego
            catalogoTiposTramite: [],
            catalogoSituaciones: [],
            clientes: [],
            vehiculos: [],
            empresasGestoras: [],
            representantesLegales: [],
            presentantes: [],
            plantillasDocumentos: [],
            messageTemplates: [],
            tramites: [],
            tramiteDetalles: [],
            conflictos: [],
          };

          const pushRes = await fetch(`${API_URL}/sync/push`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-user-id": user.id,
              "ngrok-skip-browser-warning": "true",
              Accept: "application/json",
            },
            body: JSON.stringify(minimalPayload),
          });

          if (!pushRes.ok) {
            console.warn(
              "La API central rechazó el registro inicial del usuario:",
              pushRes.status,
            );
          }

          // 2. PULL: Descargamos si el admin central nos bloqueó o cambió la contraseña
          const pullRes = await fetch(`${API_URL}/sync/pull?lastSync=`, {
            headers: {
              "x-user-id": user.id,
              "ngrok-skip-browser-warning": "true",
              Accept: "application/json",
            },
          });

          if (pullRes.ok) {
            const pullData = await pullRes.json();
            await processPullSync(sqlite, pullData);

            // Refrescamos los datos locales del usuario tras el PULL
            result = await sqlite.select(
              "SELECT id, username, rol, nombre_completo, password_hash, esta_activo FROM usuarios WHERE username = $1",
              [username],
            );
            user = result[0];
          }
        } catch (e) {
          console.warn(
            "Ignorando error de sincronización inicial (Modo Offline)",
          );
        }
      }

      if (!user) {
        setError("Usuario o correo no encontrado.");
        sileo.error({
          title: "Error de Login",
          description: "Usuario o correo no encontrado.",
        });
        return false;
      }

      const isActive =
        user.esta_activo === 1 ||
        user.esta_activo === true ||
        user.esta_activo === "1";

      const isMatch = bcrypt.compareSync(passwordPlain, user.password_hash);

      if (!isActive) {
        setError("Su cuenta ha sido bloqueada por el Administrador.");
        sileo.error({
          title: "Acceso Denegado",
          description: "Su cuenta ha sido bloqueada por el Administrador.",
        });
        return false;
      }

      if (!isMatch) {
        setError("Contraseña incorrecta.");
        sileo.error({
          title: "Error de Login",
          description: "Contraseña incorrecta.",
        });
        return false;
      }

      localStorage.setItem(
        "valeska_session_user",
        JSON.stringify({
          id: user.id,
          username: user.username,
          rol: user.rol,
          nombre: user.nombre_completo,
        }),
      );

      sileo.success({
        title: "Bienvenido",
        description: "Sesión iniciada correctamente.",
      });
      navigate("/");
      return true;
    } catch (err) {
      console.error("Fallo de Login:", err);
      setError("Error interno al procesar el inicio de sesión.");
      sileo.error({
        title: "Error del Sistema",
        description: "Error interno al procesar el inicio de sesión.",
      });
      return false;
    }
  };

  const updatePasswordLocal = async (
    username: string,
    newPasswordPlain: string,
  ) => {
    try {
      const sqlite = await Database.load("sqlite:valeska.db");
      const salt = bcrypt.genSaltSync(10);
      const newHash = bcrypt.hashSync(newPasswordPlain, salt);

      await sqlite.execute(
        "UPDATE usuarios SET password_hash = $1, updated_at = $2 WHERE username = $3",
        [newHash, new Date().toISOString(), username],
      );

      sileo.success({
        title: "Contraseña Actualizada",
        description: "Tu contraseña ha sido cambiada con éxito.",
      });
      return true;
    } catch (err) {
      console.error("Error actualizando contraseña:", err);
      sileo.error({
        title: "Error",
        description: "No se pudo actualizar la contraseña.",
      });
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("valeska_session_user");
    sileo.success({
      title: "Sesión Finalizada",
      description: "Has cerrado sesión correctamente.",
    });
    navigate("/auth/login");
  };

  return {
    checkInitialSetup,
    processProvisioningFile,
    cloudProvisioning,
    login,
    updatePasswordLocal,
    logout,
    isLoading,
    isFirstRun,
    error,
  };
}
