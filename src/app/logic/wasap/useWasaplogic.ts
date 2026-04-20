import { useState, useEffect, useCallback } from "react";
import Database from "@tauri-apps/plugin-sql";
import { sileo } from "sileo";

export interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  createdAt: number;
}

export function useWasapLogic() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const sqlite = await Database.load("sqlite:valeska.db");

      // Solo cargamos los que no están eliminados lógicamente
      const result: any[] = await sqlite.select(
        "SELECT id, name, content, created_at FROM message_templates WHERE deleted_at IS NULL ORDER BY created_at DESC",
      );

      const formattedData: MessageTemplate[] = result.map((row) => ({
        id: row.id,
        name: row.name,
        content: row.content,
        createdAt: row.created_at,
      }));

      setTemplates(formattedData);
    } catch (error) {
      console.error("Error al cargar plantillas de WhatsApp:", error);
      sileo.error({
        title: "Error de Base de Datos",
        description: "No se pudieron cargar las plantillas de mensajes.",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const saveTemplate = async (
    data: { name: string; content: string },
    editingId: string | null,
  ) => {
    try {
      const sqlite = await Database.load("sqlite:valeska.db");
      const now = Date.now();

      if (editingId) {
        // ACTUALIZAR (Seteamos LOCAL_UPDATE para la nube)
        await sqlite.execute(
          "UPDATE message_templates SET name = $1, content = $2, updated_at = $3, sync_status = 'LOCAL_UPDATE' WHERE id = $4",
          [data.name, data.content, now, editingId],
        );
      } else {
        // CREAR NUEVO (Seteamos LOCAL_INSERT para la nube)
        const newId = crypto.randomUUID();
        await sqlite.execute(
          "INSERT INTO message_templates (id, name, content, created_at, updated_at, sync_status) VALUES ($1, $2, $3, $4, $5, 'LOCAL_INSERT')",
          [newId, data.name, data.content, now, now],
        );
      }

      await loadTemplates();

      // DISPARAMOS EL EVENTO PARA QUE EL SISTEMA SINCRONICE CON LA NUBE
      window.dispatchEvent(new Event("valeska_request_sync"));

      sileo.success({
        title: "Éxito",
        description: editingId
          ? "La plantilla fue actualizada."
          : "Plantilla creada correctamente.",
      });
      return true;
    } catch (error) {
      console.error("Error al guardar la plantilla:", error);
      sileo.error({
        title: "Error",
        description: "No se pudo guardar la plantilla.",
      });
      return false;
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      const sqlite = await Database.load("sqlite:valeska.db");
      const now = Date.now();

      // SOFT DELETE (Ocultamos el registro y avisamos a la nube que fue modificado)
      await sqlite.execute(
        "UPDATE message_templates SET deleted_at = $1, sync_status = 'LOCAL_UPDATE' WHERE id = $2",
        [now, id],
      );

      await loadTemplates();

      // DISPARAMOS EL EVENTO DE SINCRONIZACIÓN
      window.dispatchEvent(new Event("valeska_request_sync"));

      sileo.success({
        title: "Eliminada",
        description: "La plantilla ha sido eliminada.",
      });
      return true;
    } catch (error) {
      console.error("Error al eliminar la plantilla:", error);
      sileo.error({
        title: "Error",
        description: "No se pudo eliminar la plantilla.",
      });
      return false;
    }
  };

  return {
    templates,
    isLoading,
    loadTemplates,
    saveTemplate,
    deleteTemplate,
  };
}
