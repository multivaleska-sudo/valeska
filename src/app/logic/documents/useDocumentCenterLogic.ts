import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import Database from "@tauri-apps/plugin-sql";
import { TemplateData } from "../../types/documents/template.types";

export function useDocumentCenterLogic() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [templates, setTemplates] = useState<TemplateData[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateData | null>(
    null,
  );
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

      if (formattedData.length > 0 && !selectedTemplate) {
        setSelectedTemplate(formattedData[0]);
      }
    } catch (error) {
      console.error("Error al cargar plantillas desde SQLite:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedTemplate]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleGenerateAndPrint = async () => {
    if (!selectedTemplate || !id) return;
    setIsGenerating(true);
    try {
      navigate(`/tramites/${id}/print/${selectedTemplate.id}`);
    } catch (error) {
      console.error("Error crítico al generar:", error);
      alert("No se pudo iniciar el proceso de impresión.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateNewTemplate = async (nombre: string, htmlBase: string) => {
    try {
      const sqlite = await Database.load("sqlite:valeska.db");

      // 1. Generamos un ID único en formato texto (ej: "e581236a-2321-4f32-...")
      const newId = crypto.randomUUID();

      // 2. Agregamos el "id" a la consulta de inserción (ahora son 3 parámetros)
      const insertQuery = `
                INSERT INTO plantillas_documentos (id, nombre_documento, contenido_html, orientacion_papel, activo, created_at, updated_at)
                VALUES ($1, $2, $3, 'PORTRAIT', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            `;

      // 3. Ejecutamos la inserción con el nuevo ID como primer parámetro
      await sqlite.execute(insertQuery, [newId, nombre, htmlBase]);

      // 4. Como ya conocemos el newId, navegamos directamente al editor
      navigate(`/plantillas/${newId}/edit`);
    } catch (error) {
      console.error("Error al crear la nueva plantilla:", error);
      alert("Ocurrió un error al guardar la plantilla en la base de datos.");
    }
  };

  return {
    id,
    navigate,
    templates,
    selectedTemplate,
    setSelectedTemplate,
    handleGenerateAndPrint,
    isGenerating,
    isLoading,
    handleCreateNewTemplate,
  };
}
