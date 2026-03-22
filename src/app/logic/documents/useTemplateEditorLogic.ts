import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import Database from "@tauri-apps/plugin-sql";
import { TEMPLATE_VARIABLES } from "../../constants/templateVariables";

export function useTemplateEditorLogic() {
    const { id } = useParams();
    const navigate = useNavigate();
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [templateName, setTemplateName] = useState("");
    const [htmlContent, setHtmlContent] = useState("");
    const [orientation, setOrientation] = useState<'PORTRAIT' | 'LANDSCAPE'>('PORTRAIT');

    useEffect(() => {
        const fetchTemplate = async () => {
            if (id === 'new') {
                setHtmlContent('<div style="padding: 40px; font-family: sans-serif; font-size: 14px;">\n  <h1 style="text-align: center;">NUEVO DOCUMENTO</h1>\n  <p>Redacte su documento aquí...</p>\n</div>');
                setIsLoading(false);
                return;
            }

            try {
                const sqlite = await Database.load("sqlite:valeska.db");
                const result: any[] = await sqlite.select("SELECT * FROM plantillas_documentos WHERE id = $1", [id]);

                if (result.length > 0) {
                    const tpl = result[0];
                    setTemplateName(tpl.nombre_documento);
                    setHtmlContent(tpl.contenido_html);
                    setOrientation(tpl.orientacion_papel);
                } else {
                    alert("Plantilla no encontrada");
                    navigate("/tramites/undefined/documents");
                }
            } catch (error) {
                console.error("Error al cargar plantilla:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTemplate();
    }, [id, navigate]);

    const insertAtCursor = useCallback((textToInsert: string) => {
        if (!textareaRef.current) return;

        const textarea = textareaRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const currentVal = htmlContent;

        const newVal = currentVal.substring(0, start) + textToInsert + currentVal.substring(end);
        setHtmlContent(newVal);

        setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = start + textToInsert.length;
            textarea.focus();
        }, 0);
    }, [htmlContent]);

    const insertHtmlTag = (tag: string) => {
        if (!textareaRef.current) return;
        const start = textareaRef.current.selectionStart;
        const end = textareaRef.current.selectionEnd;
        const selectedText = htmlContent.substring(start, end);

        let textToInsert = "";
        if (tag === 'bold') textToInsert = `<strong>${selectedText || 'texto'}</strong>`;
        if (tag === 'italic') textToInsert = `<em>${selectedText || 'texto'}</em>`;
        if (tag === 'underline') textToInsert = `<u style="text-decoration: underline;">${selectedText || 'texto'}</u>`;
        if (tag === 'h1') textToInsert = `<h1 style="text-align: center; margin-bottom: 20px;">${selectedText || 'TITULO'}</h1>`;
        if (tag === 'p') textToInsert = `\n<p style="margin-bottom: 10px; line-height: 1.5;">\n  ${selectedText || 'Su párrafo aquí...'}\n</p>\n`;
        if (tag === 'br') textToInsert = `<br/>\n`;

        insertAtCursor(textToInsert);
    };

    const handleSave = async () => {
        if (!templateName.trim()) {
            alert("Por favor, ponle un nombre a la plantilla.");
            return;
        }

        setIsSaving(true);
        try {
            const sqlite = await Database.load("sqlite:valeska.db");
            const now = new Date().toISOString();

            if (id === 'new') {
                const newId = `TPL_${crypto.randomUUID().split('-')[0]}`;
                await sqlite.execute(
                    `INSERT INTO plantillas_documentos (id, nombre_documento, contenido_html, orientacion_papel, activo, created_at, updated_at) VALUES ($1, $2, $3, $4, 1, $5, $6)`,
                    [newId, templateName, htmlContent, orientation, now, now]
                );
            } else {
                await sqlite.execute(
                    `UPDATE plantillas_documentos SET nombre_documento = $1, contenido_html = $2, orientacion_papel = $3, updated_at = $4 WHERE id = $5`,
                    [templateName, htmlContent, orientation, now, id]
                );
            }

            window.dispatchEvent(new CustomEvent("valeska_request_sync", {
                detail: { title: "Plantilla Actualizada", details: `Se modificó la plantilla HTML: ${templateName}` }
            }));

            alert("✅ Plantilla guardada con éxito.");
            navigate("/tramites/undefined/documents");
        } catch (error) {
            console.error("Error al guardar plantilla:", error);
            alert("Error al guardar. Asegúrate de que el nombre no esté duplicado.");
        } finally {
            setIsSaving(false);
        }
    };

    return {
        isLoading, isSaving, navigate,
        templateName, setTemplateName,
        htmlContent, setHtmlContent,
        orientation, setOrientation,
        textareaRef, insertAtCursor, insertHtmlTag, handleSave,
        TEMPLATE_VARIABLES
    };
}