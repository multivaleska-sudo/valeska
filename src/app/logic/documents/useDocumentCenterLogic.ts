import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import Database from "@tauri-apps/plugin-sql";
import { TemplateData } from "../../types/documents/template.types";

export function useDocumentCenterLogic() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [templates, setTemplates] = useState<TemplateData[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<TemplateData | null>(null);
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

            const formattedData: TemplateData[] = result.map(row => {
                const variablesCount = (row.contenido_html.match(/\{\{/g) || []).length;

                const fecha = new Date(row.updated_at).toLocaleDateString('es-PE', {
                    year: 'numeric', month: 'short', day: 'numeric'
                });

                return {
                    id: row.id,
                    nombre: row.nombre_documento,
                    contenidoHtml: row.contenido_html,
                    orientacion: row.orientacion_papel as 'PORTRAIT' | 'LANDSCAPE',
                    ultima_edicion: fecha,
                    variables_mapeadas: variablesCount,
                    activo: row.activo === 1
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

    return {
        id,
        navigate,
        templates,
        selectedTemplate,
        setSelectedTemplate,
        handleGenerateAndPrint,
        isGenerating,
        isLoading
    };
}