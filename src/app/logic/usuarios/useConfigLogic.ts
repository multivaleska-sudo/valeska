import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { confirm } from "@tauri-apps/plugin-dialog";
import { getDb } from "../../db/localDb";
import * as bcrypt from "bcryptjs";
import { sileo } from "sileo";
import {
  LocalSyncDiagnostics,
  collectLocalSyncDiagnostics,
  countPendingLocalChanges,
  exportLocalSyncDiagnostics,
  forceTramiteResync,
} from "../sync/diagnostics";

const API_URL = (import.meta as any).env.VITE_API_URL;

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
  const [detectedMacAddress, setDetectedMacAddress] = useState("");
  const [registeredMacAddress, setRegisteredMacAddress] = useState("");
  const [dispositivoAutorizado, setDispositivoAutorizado] = useState(false);
  const [sucursalId, setSucursalId] = useState("");
  const [sucursalesList, setSucursalesList] = useState<any[]>([]);
  const [autoSync, setAutoSync] = useState(true);
  const [syncDiagnostics, setSyncDiagnostics] = useState<LocalSyncDiagnostics | null>(null);
  const [isLoadingDiagnostics, setIsLoadingDiagnostics] = useState(false);
  const [isRepairingSync, setIsRepairingSync] = useState(false);

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
        const sqlite = await getDb();
        try {
          const identity = await invoke<any>("get_device_identity");
          setDetectedMacAddress(
            String(identity.mac_address || identity.macAddress || "")
              .trim()
              .toLowerCase(),
          );
        } catch {
          try {
            setDetectedMacAddress(
              String(await invoke("get_device_mac")).trim().toLowerCase(),
            );
          } catch {
            setDetectedMacAddress("No detectada");
          }
        }

        // 1. Obtener a qué dispositivo está amarrado este usuario
        const userDb: any[] = await sqlite.select(
          "SELECT dispositivo_id FROM usuarios WHERE id = $1",
          [session.id],
        );
        if (userDb.length > 0 && userDb[0].dispositivo_id) {
          const currentDispId = userDb[0].dispositivo_id;
          setDispositivoId(currentDispId);

          // 2. Obtener el nombre del dispositivo y su sucursal actual
          const dispDb: any[] = await sqlite.select(
            "SELECT nombre_equipo, mac_address, autorizado, sucursal_id FROM dispositivos WHERE id = $1",
            [currentDispId],
          );
          if (dispDb.length > 0) {
            setDispositivoNombre(dispDb[0].nombre_equipo || "PC-DESCONOCIDA");
            setRegisteredMacAddress(dispDb[0].mac_address || "");
            setDispositivoAutorizado(
              dispDb[0].autorizado === 1 ||
                dispDb[0].autorizado === true ||
                dispDb[0].autorizado === "1",
            );
            setSucursalId(dispDb[0].sucursal_id || "");
          }
        }

        // 3. Cargar la lista de todas las sucursales para el combo-box (Select)
        const sucursales: any[] = await sqlite.select(
          "SELECT id, nombre FROM sucursales ORDER BY nombre ASC",
        );
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
      const sqlite = await getDb();
      await sqlite.execute(
        "UPDATE usuarios SET nombre_completo = $1, updated_at = $2 WHERE id = $3",
        [nombre, new Date().toISOString(), userId],
      );

      const sessionStr = localStorage.getItem("valeska_session_user");
      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        session.nombre = nombre;
        localStorage.setItem("valeska_session_user", JSON.stringify(session));
      }

      sileo.success({
        title: "Perfil Actualizado",
        description: "Perfil actualizado correctamente.",
      });
      window.dispatchEvent(new Event("storage"));
    } catch (error) {
      console.error(error);
      sileo.error({
        title: "Error",
        description: "Error al actualizar el perfil.",
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      sileo.warning({
        title: "Atención",
        description: "Las contraseñas no coinciden.",
      });
      return;
    }
    if (newPassword.length < 6) {
      sileo.warning({
        title: "Atención",
        description: "La contraseña debe tener mínimo 6 caracteres.",
      });
      return;
    }

    setIsSavingSecurity(true);
    try {
      const sqlite = await getDb();
      const result: any[] = await sqlite.select(
        "SELECT password_hash FROM usuarios WHERE id = $1",
        [userId],
      );

      if (!bcrypt.compareSync(currentPassword, result[0].password_hash)) {
        sileo.error({
          title: "Error",
          description: "La contraseña actual es incorrecta.",
        });
        setIsSavingSecurity(false);
        return;
      }

      const hash = bcrypt.hashSync(newPassword, bcrypt.genSaltSync(10));
      await sqlite.execute(
        "UPDATE usuarios SET password_hash = $1, updated_at = $2 WHERE id = $3",
        [hash, new Date().toISOString(), userId],
      );

      sileo.success({
        title: "Éxito",
        description: "Contraseña actualizada con éxito.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error(error);
      sileo.error({
        title: "Error",
        description: "Error al cambiar la contraseña.",
      });
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
        const sqlite = await getDb();
        await sqlite.execute(
          "UPDATE dispositivos SET nombre_equipo = $1, sucursal_id = $2, updated_at = $3 WHERE id = $4",
          [
            dispositivoNombre.toUpperCase(),
            sucursalId,
            new Date().toISOString(),
            dispositivoId,
          ],
        );
      }

      sileo.success({
        title: "Configuración Guardada",
        description:
          "Configuración del sistema y dispositivo guardada correctamente.",
      });
    } catch (error) {
      console.error("Error al actualizar el sistema:", error);
      sileo.error({
        title: "Error",
        description:
          "Error interno al guardar la configuración del dispositivo.",
      });
    } finally {
      setIsSavingSystem(false);
    }
  };

  const handleRefreshSyncDiagnostics = async () => {
    setIsLoadingDiagnostics(true);
    try {
      const sqlite = await getDb();
      const diagnostics = await collectLocalSyncDiagnostics(sqlite);
      setSyncDiagnostics(diagnostics);
      return diagnostics;
    } catch (error) {
      console.error("Error al generar diagnostico local:", error);
      sileo.error({
        title: "Diagnostico no disponible",
        description: "No se pudo leer la base local de sincronizacion.",
      });
      return null;
    } finally {
      setIsLoadingDiagnostics(false);
    }
  };

  const handleExportSyncDiagnostics = async () => {
    const diagnostics = syncDiagnostics || await handleRefreshSyncDiagnostics();
    if (!diagnostics) return;

    try {
      const filePath = await exportLocalSyncDiagnostics(diagnostics);
      if (filePath) {
        sileo.success({
          title: "Diagnostico exportado",
          description: "Reporte local guardado correctamente.",
        });
      }
    } catch (error) {
      console.error("Error exportando diagnostico:", error);
      sileo.error({
        title: "No se pudo exportar",
        description: "Intenta guardar el diagnostico en otra carpeta.",
      });
    }
  };

  const handleForceTramiteResync = async () => {
    if (!userId) return;

    const diagnostics = syncDiagnostics || await handleRefreshSyncDiagnostics();
    if (!diagnostics) return;

    const pendingChanges = countPendingLocalChanges(diagnostics);
    if (pendingChanges > 0) {
      sileo.warning({
        title: "Reparacion bloqueada",
        description: `Hay ${pendingChanges} cambios locales pendientes. Sincronizalos antes de reparar.`,
      });
      return;
    }

    const accepted = await confirm(
      "Se creara un backup local, se borraran solo los cursores de sincronizacion y se descargaran nuevamente los datos relacionados a tramites. Continuar?",
      { title: "Forzar resincronizacion de tramites", kind: "warning" },
    );
    if (!accepted) return;

    setIsRepairingSync(true);
    try {
      const sqlite = await getDb();
      await forceTramiteResync(sqlite, { apiUrl: API_URL }, userId);
      const refreshed = await collectLocalSyncDiagnostics(sqlite);
      setSyncDiagnostics(refreshed);
      window.dispatchEvent(new Event("valeska_sync_completed"));
      window.dispatchEvent(new Event("valeska_reload_tramites"));
      sileo.success({
        title: "Resincronizacion completada",
        description: "Se reconstruyeron los datos locales relacionados a tramites.",
      });
    } catch (error: any) {
      console.error("Error reparando sincronizacion:", error);
      sileo.error({
        title: "No se pudo reparar",
        description: error?.message || "La resincronizacion fue interrumpida.",
      });
    } finally {
      setIsRepairingSync(false);
    }
  };

  const handleLimpiarConflictosHuerfanos = async () => {
    const accepted = await confirm(
      "¿Seguro que deseas vaciar la tabla de conflictos? Esto borrara permanentemente cualquier conflicto huérfano local, ideal antes de una nueva importación masiva.",
      { title: "Limpiar Conflictos Huérfanos", kind: "warning" }
    );
    if (!accepted) return;
    try {
      const sqlite = await getDb();
      await sqlite.execute("DELETE FROM sync_conflictos");
      const refreshed = await collectLocalSyncDiagnostics(sqlite);
      setSyncDiagnostics(refreshed);
      sileo.success({
        title: "Limpieza Completada",
        description: "Se han eliminado todos los conflictos locales."
      });
    } catch (e: any) {
      console.error(e);
      sileo.error({ title: "Error", description: e?.message || "No se pudo limpiar." });
    }
  };

  return {
    isLoading,
    isSavingProfile,
    isSavingSecurity,
    isSavingSystem,
    username,
    rol,
    nombre,
    setNombre,
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    dispositivoNombre,
    setDispositivoNombre,
    detectedMacAddress,
    registeredMacAddress,
    dispositivoAutorizado,
    sucursalId,
    setSucursalId,
    sucursalesList,
    autoSync,
    setAutoSync,
    syncDiagnostics,
    isLoadingDiagnostics,
    isRepairingSync,
    handleUpdateProfile,
    handleChangePassword,
    handleUpdateSystem,
    handleRefreshSyncDiagnostics,
    handleExportSyncDiagnostics,
    handleForceTramiteResync,
    handleLimpiarConflictosHuerfanos,
  };
}
