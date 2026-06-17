import { useState } from "react";
import { useNavigate } from "react-router";
import { invoke } from "@tauri-apps/api/core";
import { getDb } from "../../db/localDb";
import { drizzle } from "drizzle-orm/sqlite-proxy";
import { eq } from "drizzle-orm";
import * as bcrypt from "bcryptjs";
import * as schema from "../../db/schema";
import { sileo } from "sileo";
import { executePush } from "../sync/pushActions";
import { executePull } from "../sync/pullActions";

const getDrizzleDb = async () => {
  const sqlite = await getDb();
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

type CloudLoginResult = {
  access_token: string;
  user: {
    id: string;
    username: string;
    nombreCompleto: string;
    rol: string;
    estaActivo: boolean;
    dispositivoId?: string | null;
  };
  dispositivo?: {
    id: string;
    macAddress: string;
    nombreEquipo: string;
    autorizado: boolean;
    provisionId?: string | null;
    sucursalId: string;
    usuarioId?: string | null;
    createdAt?: string;
    updatedAt?: string;
    deletedAt?: string | null;
    syncStatus?: string;
  };
  sucursal?: {
    id: string;
    nombre: string;
    codigo?: string | null;
    direccion?: string | null;
    esCentral?: boolean;
    createdAt?: string;
    updatedAt?: string;
    deletedAt?: string | null;
  };
};

type DeviceIdentity = {
  macAddress: string;
  machineName: string;
};

export type ProvisioningResult =
  | { status: "created"; user: LocalSessionUser }
  | { status: "existing_user"; identifier: string }
  | { status: "error"; message: string };

type LocalSessionUser = {
  id: string;
  username: string;
  rol: string;
  nombre: string;
  accessToken?: string;
};

export type LoginHistoryEntry = {
  identifier: string;
  username: string;
  nombre?: string;
  lastLoginAt: string;
};

export const LOGIN_HISTORY_KEY = "valeska_login_history";

export const getLoginHistory = (): LoginHistoryEntry[] => {
  try {
    const raw = localStorage.getItem(LOGIN_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const recordSuccessfulLogin = (entry: Omit<LoginHistoryEntry, "lastLoginAt">) => {
  const identifier = entry.identifier.trim();
  const username = entry.username.trim();
  if (!identifier || !username) return;

  const nextEntry: LoginHistoryEntry = {
    ...entry,
    identifier,
    username,
    lastLoginAt: new Date().toISOString(),
  };

  const filtered = getLoginHistory().filter(
    (item) =>
      item.identifier.toLowerCase() !== identifier.toLowerCase() &&
      item.username.toLowerCase() !== username.toLowerCase(),
  );

  localStorage.setItem(
    LOGIN_HISTORY_KEY,
    JSON.stringify([nextEntry, ...filtered].slice(0, 8)),
  );
};

const getDeviceIdentity = async (): Promise<DeviceIdentity> => {
  try {
    const identity = await invoke<any>("get_device_identity");
    return {
      macAddress: String(identity.mac_address || identity.macAddress || "")
        .trim()
        .toLowerCase(),
      machineName: String(identity.machine_name || identity.machineName || "EQUIPO-VALESKA")
        .trim()
        .toUpperCase(),
    };
  } catch {
    const fallbackMac = String(await invoke("get_device_mac")).trim().toLowerCase();
    return {
      macAddress: fallbackMac,
      machineName: "EQUIPO-VALESKA",
    };
  }
};

const provisionDeviceWithBackend = async (
  username: string,
  password: string,
  identity: DeviceIdentity,
): Promise<CloudLoginResult | null> => {
  try {
    const response = await fetch(`${API_URL}/auth/provision-device`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
        Accept: "application/json",
      },
      body: JSON.stringify({
        username,
        email: username,
        password,
        macAddress: identity.macAddress,
        nombreEquipo: identity.machineName,
      }),
    });

    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
};

const provisionDeviceFromFile = async (input: {
  identifier: string;
  passwordHash: string;
  nombreCompleto: string;
  rol: string;
  provisionData: any;
  userId: string;
  deviceId: string;
  identity: DeviceIdentity;
}): Promise<CloudLoginResult | null> => {
  try {
    const response = await fetch(`${API_URL}/auth/provision-device`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
        Accept: "application/json",
      },
      body: JSON.stringify({
        username: input.identifier,
        email: input.identifier,
        passwordHash: input.passwordHash,
        nombreCompleto: input.nombreCompleto,
        rol: input.rol,
        provisionId: input.provisionData.provision_id,
        userId: input.userId,
        deviceId: input.deviceId,
        sucursal: {
          id: input.provisionData.sucursal.id,
          nombre: input.provisionData.sucursal.nombre,
          codigo: input.provisionData.sucursal.codigo || null,
          direccion: input.provisionData.sucursal.direccion || null,
          esCentral: input.provisionData.tipo_licencia === "MASTER",
        },
        macAddress: input.identity.macAddress,
        nombreEquipo: input.identity.machineName,
      }),
    });

    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
};

const persistCloudProvisioning = async (
  sqlite: any,
  data: CloudLoginResult,
  passwordPlain: string,
) => {
  const now = new Date().toISOString();
  const passwordHash = bcrypt.hashSync(passwordPlain, bcrypt.genSaltSync(10));
  const sucursal = data.sucursal;
  const dispositivo = data.dispositivo;

  if (sucursal) {
    await sqlite.execute(
      `INSERT INTO sucursales
        (id, nombre, codigo, direccion, es_central, created_at, updated_at, deleted_at, sync_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'SYNCED')
       ON CONFLICT(id) DO UPDATE SET
         nombre = excluded.nombre,
         codigo = excluded.codigo,
         direccion = excluded.direccion,
         es_central = excluded.es_central,
         updated_at = excluded.updated_at,
         deleted_at = excluded.deleted_at,
         sync_status = 'SYNCED'`,
      [
        sucursal.id,
        sucursal.nombre,
        sucursal.codigo ?? null,
        sucursal.direccion ?? "",
        sucursal.esCentral ? 1 : 0,
        sucursal.createdAt ?? now,
        sucursal.updatedAt ?? now,
        sucursal.deletedAt ?? null,
      ],
    );
  }

  if (dispositivo) {
    await sqlite.execute(
      `INSERT INTO dispositivos
        (id, mac_address, nombre_equipo, autorizado, sucursal_id, provision_id, usuario_id, created_at, updated_at, deleted_at, sync_status)
       VALUES ($1, $2, $3, $4, $5, $6, NULL, $7, $8, $9, 'SYNCED')
       ON CONFLICT(id) DO UPDATE SET
         mac_address = excluded.mac_address,
         nombre_equipo = excluded.nombre_equipo,
         autorizado = excluded.autorizado,
         sucursal_id = excluded.sucursal_id,
         provision_id = excluded.provision_id,
         updated_at = excluded.updated_at,
         deleted_at = excluded.deleted_at,
         sync_status = 'SYNCED'`,
      [
        dispositivo.id,
        dispositivo.macAddress.trim().toLowerCase(),
        dispositivo.nombreEquipo,
        dispositivo.autorizado ? 1 : 0,
        dispositivo.sucursalId,
        dispositivo.provisionId ?? null,
        dispositivo.createdAt ?? now,
        dispositivo.updatedAt ?? now,
        dispositivo.deletedAt ?? null,
      ],
    );
  }

  await sqlite.execute(
    `INSERT INTO usuarios
      (id, username, password_hash, rol, nombre_completo, dispositivo_id, esta_activo, created_at, updated_at, sync_status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8, 'SYNCED')
     ON CONFLICT(id) DO UPDATE SET
       username = excluded.username,
       password_hash = excluded.password_hash,
       rol = excluded.rol,
       nombre_completo = excluded.nombre_completo,
       dispositivo_id = excluded.dispositivo_id,
       esta_activo = excluded.esta_activo,
       updated_at = excluded.updated_at,
       sync_status = 'SYNCED'`,
    [
      data.user.id,
      data.user.username,
      passwordHash,
      data.user.rol,
      data.user.nombreCompleto,
      dispositivo?.id ?? null,
      data.user.estaActivo ? 1 : 0,
      now,
    ],
  );

  if (dispositivo) {
    await sqlite.execute(
      "UPDATE dispositivos SET usuario_id = $1, updated_at = $2, sync_status = 'SYNCED' WHERE id = $3",
      [data.user.id, now, dispositivo.id],
    );
  }

  localStorage.setItem("valeska_access_token", data.access_token);
  const sessionRaw = localStorage.getItem("valeska_session_user");
  if (sessionRaw) {
    try {
      const session = JSON.parse(sessionRaw);
      localStorage.setItem(
        "valeska_session_user",
        JSON.stringify({ ...session, accessToken: data.access_token }),
      );
    } catch {
      localStorage.removeItem("valeska_session_user");
    }
  }
  if (dispositivo?.macAddress) {
    localStorage.setItem("valeska_device_mac", dispositivo.macAddress.trim().toLowerCase());
  }
};

const createLocalSession = (user: LocalSessionUser) => {
  const accessToken = user.accessToken || localStorage.getItem("valeska_access_token") || undefined;
  const session = {
    id: user.id,
    username: user.username,
    rol: user.rol,
    nombre: user.nombre,
    accessToken,
  };

  localStorage.setItem("valeska_session_user", JSON.stringify(session));
  recordSuccessfulLogin({
    identifier: user.username,
    username: user.username,
    nombre: user.nombre,
  });

  return session;
};

const findLocalUserByIdentifier = async (sqlite: any, identifier: string) => {
  const normalized = identifier.trim().toLowerCase();
  if (!normalized) return null;

  const rows: any[] = await sqlite.select(
    `SELECT id, username, rol, nombre_completo, password_hash, esta_activo
     FROM usuarios
     WHERE LOWER(username) = LOWER($1) AND deleted_at IS NULL
     LIMIT 1`,
    [normalized],
  );

  return rows[0] || null;
};

const parseProvisioningFile = async (filePath: string) => {
  const jsonString = await invoke<string>("import_provisioning_profile", {
    filePath,
  });

  const provisionData = JSON.parse(jsonString);
  const identifier =
    provisionData?.admin?.username ||
    provisionData?.usuario?.username ||
    provisionData?.admin?.email ||
    provisionData?.usuario?.email;

  if (!identifier) {
    throw new Error("El archivo .valeska no contiene un usuario válido.");
  }

  return { provisionData, identifier: String(identifier).trim() };
};

export function useAuthLogic() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isFirstRun, setIsFirstRun] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Función de inicio del sistema.
   * Verifica la integridad de la BD y el estado de la sesión.
   */
  const checkInitialSetup = async () => {
    try {
      const sqlite = await getDb();
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
        localStorage.removeItem("valeska_access_token");
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

  const processProvisioningFile = async (
    filePath: string,
  ): Promise<ProvisioningResult> => {
    setError(null);
    try {
      const { provisionData, identifier } = await parseProvisioningFile(filePath);
      const sqlite = await getDb();
      const existingUser = await findLocalUserByIdentifier(sqlite, identifier);

      if (existingUser) {
        return { status: "existing_user", identifier: existingUser.username };
      }

      const db = await getDrizzleDb();

      const usedProvision = await db
        .select()
        .from(schema.dispositivos)
        .where(eq(schema.dispositivos.provisionId, provisionData.provision_id));

      if (usedProvision.length > 0) {
        throw new Error("Este archivo de configuración ya fue utilizado.");
      }

      let realMacAddress = "MAC-DESCONOCIDA";
      let detectedMachineName = "EQUIPO-VALESKA";
      try {
        const identity = await getDeviceIdentity();
        realMacAddress = identity.macAddress;
        detectedMachineName = identity.machineName;
      } catch (e) {
        realMacAddress = `mac-fallback-${Date.now()}`;
      }

      const now = new Date();

      await db
        .insert(schema.sucursales)
        .values({
          id: provisionData.sucursal.id,
          nombre: provisionData.sucursal.nombre,
          codigo: provisionData.sucursal.codigo || null,
          direccion: provisionData.sucursal.direccion || "",
          esCentral: provisionData.tipo_licencia === "MASTER",
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoNothing();

      const userId =
        provisionData.admin?.id ||
        provisionData.usuario?.id ||
        crypto.randomUUID();
        
      const deviceId = crypto.randomUUID();
      const machineName = String(
          provisionData.dispositivo?.nombre_equipo ||
          provisionData.dispositivo?.nombreEquipo ||
          detectedMachineName,
      )
        .trim()
        .toUpperCase();
      await db.insert(schema.dispositivos).values({
        id: deviceId,
        macAddress: realMacAddress,
        nombreEquipo: machineName,
        autorizado: true,
        sucursalId: provisionData.sucursal.id,
        provisionId: provisionData.provision_id,
        createdAt: now,
        updatedAt: now,
      });

      let finalHash = provisionData.admin.password_temporal_hash;
      if (!finalHash && provisionData.admin.password_temporal) {
        const salt = bcrypt.genSaltSync(10);
        finalHash = bcrypt.hashSync(
          provisionData.admin.password_temporal,
          salt,
        );
      }

      if (!finalHash) {
        throw new Error("El archivo .valeska no contiene una credencial válida.");
      }

      const rol =
        provisionData.tipo_licencia === "MASTER"
          ? "ADMIN_CENTRAL"
          : "OPERADOR";
      const nombre = provisionData.admin.nombre || identifier;

      await db.insert(schema.usuarios).values({
        id: userId,
        username: identifier,
        passwordHash: finalHash,
        rol,
        nombreCompleto: nombre,
        dispositivoId: deviceId,
        estaActivo: true,
        createdAt: now,
        updatedAt: now,
      });

      await db
        .update(schema.dispositivos)
        .set({ usuarioId: userId, updatedAt: now })
        .where(eq(schema.dispositivos.id, deviceId));

      const user = { id: userId, username: identifier, rol, nombre };
      createLocalSession(user);
      localStorage.setItem("valeska_device_mac", realMacAddress);
      const identity = { macAddress: realMacAddress, machineName };

      try {
        const cloudProvision = await provisionDeviceFromFile({
          identifier,
          passwordHash: finalHash,
          nombreCompleto: nombre,
          rol,
          provisionData,
          userId,
          deviceId,
          identity,
        });

        if (cloudProvision?.access_token) {
          localStorage.setItem("valeska_access_token", cloudProvision.access_token);
          createLocalSession({
            id: cloudProvision.user.id,
            username: cloudProvision.user.username,
            rol: cloudProvision.user.rol,
            nombre: cloudProvision.user.nombreCompleto,
            accessToken: cloudProvision.access_token,
          });
          await executePush({ apiUrl: API_URL }, cloudProvision.user.id, sqlite);
        } else {
          sileo.warning({
            title: "Configuración local",
            description:
              "El equipo quedó configurado localmente. La nube se sincronizará cuando se obtenga un token válido.",
          });
        }
      } catch (cloudError) {
        console.warn("No se pudo provisionar el archivo .valeska en nube:", cloudError);
        sileo.warning({
          title: "Configuración local",
          description:
            "El equipo quedó configurado localmente. La sincronización se reintentará más adelante.",
        });
      }

      sileo.success({
        title: "Configuración Exitosa",
        description: "El equipo ha sido aprovisionado correctamente.",
      });
      return { status: "created", user };
    } catch (err: any) {
      console.error("Error en provisión:", err);
      setError(err.message || "El archivo está corrupto o alterado.");
      sileo.error({
        title: "Error de Provisión",
        description: err.message || "El archivo está corrupto o alterado.",
      });
      return {
        status: "error",
        message: err.message || "El archivo está corrupto o alterado.",
      };
    }
  };

  const cloudProvisioning = async (email: string, passwordPlain: string) => {
    setError(null);
    try {
      const identity = await getDeviceIdentity();
      const data = await provisionDeviceWithBackend(email, passwordPlain, identity);
      if (!data) {
        throw new Error("Credenciales invalidas o conexion a la nube fallida.");
      }

      const sqlite = await getDb();
      await persistCloudProvisioning(sqlite, data, passwordPlain);

      sileo.success({
        title: "Sincronizacion Exitosa",
        description: "Configuracion descargada desde la nube.",
      });
      return true;
    } catch (err: any) {
      console.error("Error en provision por nube:", err);
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
  const login = async (identifier: string, passwordPlain: string) => {
    setError(null);
    try {
      const normalizedIdentifier = identifier.trim();
      const sqlite = await getDb();
      const identity = await getDeviceIdentity();
      const cloudLogin = await provisionDeviceWithBackend(
        normalizedIdentifier,
        passwordPlain,
        identity,
      );

      if (cloudLogin?.access_token) {
        await persistCloudProvisioning(sqlite, cloudLogin, passwordPlain);
      }

      let result: any[] = await sqlite.select(
        `SELECT id, username, rol, nombre_completo, password_hash, esta_activo
         FROM usuarios
         WHERE deleted_at IS NULL
           AND (LOWER(username) = LOWER($1) OR LOWER(username) = LOWER($2))`,
        [normalizedIdentifier, cloudLogin?.user?.username || normalizedIdentifier],
      );

      let user = result[0];

      if (user && cloudLogin?.access_token) {
        localStorage.setItem(
          "valeska_session_user",
          JSON.stringify({
            id: user.id,
            username: user.username,
            rol: user.rol,
            nombre: user.nombre_completo,
            accessToken: cloudLogin.access_token,
          }),
        );

        try {
          const config = { apiUrl: API_URL };

          await executePush(config, user.id, sqlite);

          localStorage.removeItem("valeska_last_sync");
          await executePull(config, user.id, sqlite);

          result = await sqlite.select(
            `SELECT id, username, rol, nombre_completo, password_hash, esta_activo
             FROM usuarios
             WHERE deleted_at IS NULL
               AND (LOWER(username) = LOWER($1) OR LOWER(username) = LOWER($2))`,
            [normalizedIdentifier, cloudLogin?.user?.username || normalizedIdentifier],
          );
          user = result[0];
        } catch (e) {
          console.warn(
            "Ignorando error de sincronización inicial (Modo Offline)",
            e,
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

      createLocalSession({
        id: user.id,
        username: user.username,
        rol: user.rol,
        nombre: user.nombre_completo,
        accessToken:
          cloudLogin?.access_token ||
          localStorage.getItem("valeska_access_token") ||
          undefined,
      });
      recordSuccessfulLogin({
        identifier: normalizedIdentifier,
        username: user.username,
        nombre: user.nombre_completo,
      });

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
      const sqlite = await getDb();
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
    localStorage.removeItem("valeska_access_token");
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
