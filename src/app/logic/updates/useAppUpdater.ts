import { useCallback, useState } from "react";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { sileo } from "sileo";

export function useAppUpdater() {
  const [isChecking, setIsChecking] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [progress, setProgress] = useState(0);
  const [latestVersion, setLatestVersion] = useState<string | null>(null);

  const checkAndInstallUpdate = useCallback(async () => {
    setIsChecking(true);
    setProgress(0);

    try {
      const sessionRaw = localStorage.getItem("valeska_session_user");
      const session = sessionRaw ? JSON.parse(sessionRaw) : null;
      const accessToken =
        session?.accessToken || localStorage.getItem("valeska_access_token");

      const update = await check({
        timeout: 30000,
        headers: accessToken
          ? {
              Authorization: `Bearer ${accessToken}`,
            }
          : undefined,
      });

      if (!update) {
        sileo.success({ title: "Valeska ya esta actualizada" });
        return false;
      }

      setLatestVersion(update.version);
      setIsInstalling(true);

      let downloaded = 0;
      let contentLength = 0;

      await update.downloadAndInstall((event) => {
        if (event.event === "Started") {
          contentLength = event.data.contentLength || 0;
        }

        if (event.event === "Progress") {
          downloaded += event.data.chunkLength;
          if (contentLength > 0) {
            setProgress(Math.min(100, Math.round((downloaded / contentLength) * 100)));
          }
        }

        if (event.event === "Finished") {
          setProgress(100);
        }
      });

      sileo.success({
        title: "Actualizacion instalada",
        description: "La aplicacion se reiniciara para completar el proceso.",
      });
      await relaunch();
      return true;
    } catch (error: any) {
      sileo.error({
        title: "No se pudo actualizar",
        description: error?.message || "Error consultando actualizaciones.",
      });
      return false;
    } finally {
      setIsChecking(false);
      setIsInstalling(false);
    }
  }, []);

  return {
    isChecking,
    isInstalling,
    progress,
    latestVersion,
    checkAndInstallUpdate,
  };
}
