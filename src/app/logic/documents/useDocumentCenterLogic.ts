import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router";
import { MOCK_TEMPLATES, TemplateType, TemplateData } from "../../mocks/documents.mock";

export function useDocumentCenterLogic() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const requestedType = searchParams.get("type") as TemplateType | null;

    const [selectedTemplate, setSelectedTemplate] = useState<TemplateData | null>(null);

    useEffect(() => {
        if (requestedType) {
            const template = MOCK_TEMPLATES.find(t => t.tipo === requestedType);
            if (template) setSelectedTemplate(template);
        }
    }, [requestedType]);

    const handleGenerateAndPrint = () => {
        if (!selectedTemplate) return;
        alert(`Iniciando motor de PDF-LIB...\n\nTomando la plantilla: ${selectedTemplate.nombre}\nInyectando datos del Trámite ID: ${id}\n\nPróximamente: Descarga/Impresión del PDF final.`);
    };

    return {
        id,
        navigate,
        templates: MOCK_TEMPLATES,
        selectedTemplate,
        setSelectedTemplate,
        handleGenerateAndPrint
    };
}