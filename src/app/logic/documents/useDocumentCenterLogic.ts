import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import Database from "@tauri-apps/plugin-sql";
import { TemplateData } from "../../types/documents/template.types";
import { sileo } from "sileo";

export function useDocumentCenterLogic() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [templates, setTemplates] = useState<TemplateData[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateData | null>(
    null,
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const sqlite = await Database.load("sqlite:valeska.db");

      const query = `
        SELECT * FROM plantillas_documentos 
        WHERE deleted_at IS NULL AND activo = 1
        ORDER BY nombre_documento ASC
      `;

      const result: any[] = await sqlite.select(query);

      const formattedData: TemplateData[] = result.map((row) => {
        const variablesCount = (row.contenido_html.match(/\{\{/g) || []).length;

        // Ahora row.updated_at es un número seguro (Date.now())
        const fecha = new Date(row.updated_at).toLocaleDateString("es-PE", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });

        return {
          id: row.id,
          nombre: row.nombre_documento,
          contenidoHtml: row.contenido_html,
          orientacion: row.orientacion_papel as "PORTRAIT" | "LANDSCAPE",
          ultima_edicion: fecha,
          variables_mapeadas: variablesCount,
          activo: row.activo === 1,
        };
      });

      setTemplates(formattedData);

      // Usamos callback form de setState para NO depender de selectedTemplate en el useCallback
      setSelectedTemplate((prevSelected) => {
        if (!prevSelected && formattedData.length > 0) {
          return formattedData[0];
        }
        // Si teníamos una seleccionada pero ya no existe (ej. fue borrada), seleccionamos la primera
        if (prevSelected && !formattedData.some(t => t.id === prevSelected.id)) {
          return formattedData.length > 0 ? formattedData[0] : null;
        }
        return prevSelected;
      });

    } catch (error) {
      console.error("Error al cargar plantillas desde SQLite:", error);
      sileo.error({
        title: "Error",
        description: "No se pudieron cargar las plantillas.",
      });
    } finally {
      setIsLoading(false);
    }
  }, []); // <-- Se quitó selectedTemplate de las dependencias para evitar carreras al eliminar

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const filteredTemplates = templates.filter((tpl) =>
    tpl.nombre.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleGenerateAndPrint = async () => {
    if (!selectedTemplate || !id) return;
    setIsGenerating(true);
    try {
      navigate(`/tramites/${id}/print/${selectedTemplate.id}`);
    } catch (error) {
      console.error("Error crítico al generar:", error);
      sileo.error({
        title: "Error",
        description: "No se pudo iniciar el proceso de impresión.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateNewTemplate = async (nombre: string, htmlBase: string) => {
    try {
      const sqlite = await Database.load("sqlite:valeska.db");
      const newId = crypto.randomUUID();
      const now = Date.now(); // Estandarizado a milisegundos

      const insertQuery = `
        INSERT INTO plantillas_documentos (id, nombre_documento, contenido_html, orientacion_papel, activo, created_at, updated_at, sync_status)
        VALUES ($1, $2, $3, 'PORTRAIT', 1, $4, $5, 'LOCAL_INSERT')
      `;

      await sqlite.execute(insertQuery, [newId, nombre, htmlBase, now, now]);
      sileo.success({
        title: "Plantilla Creada",
        description: "La plantilla se ha creado correctamente.",
      });

      window.dispatchEvent(new Event("valeska_request_sync"));
      navigate(`/plantillas/${newId}/edit`);
    } catch (error) {
      console.error("Error al crear la nueva plantilla:", error);
      sileo.error({
        title: "Error",
        description:
          "Ocurrió un error al guardar la plantilla en la base de datos.",
      });
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      const sqlite = await Database.load("sqlite:valeska.db");
      const now = Date.now(); // Formato compatible con tu schema.ts

      // Actualizamos a milisegundos y disparamos sync_status
      await sqlite.execute(
        `UPDATE plantillas_documentos SET deleted_at = $1, sync_status = 'LOCAL_UPDATE' WHERE id = $2`,
        [now, templateId],
      );

      // Actualizar el estado local de forma inmediata para que desaparezca en tiempo real
      const remainingTemplates = templates.filter((t) => t.id !== templateId);
      setTemplates(remainingTemplates);

      if (selectedTemplate?.id === templateId) {
        setSelectedTemplate(
          remainingTemplates.length > 0 ? remainingTemplates[0] : null,
        );
      }

      sileo.success({
        title: "Plantilla Eliminada",
        description: "La plantilla ha sido eliminada permanentemente.",
      });

      // Disparar sincronización para la nube
      window.dispatchEvent(new Event("valeska_request_sync"));

    } catch (error) {
      console.error("Error al eliminar la plantilla:", error);
      sileo.error({
        title: "Error",
        description: "No se pudo eliminar la plantilla.",
      });
      throw error;
    }
  };

  return {
    id,
    navigate,
    templates,
    filteredTemplates,
    searchTerm,
    setSearchTerm,
    selectedTemplate,
    setSelectedTemplate,
    handleGenerateAndPrint,
    isGenerating,
    isLoading,
    handleCreateNewTemplate,
    handleDeleteTemplate,
  };
}