export type TemplateType = "Formulario" | "Clausula" | "Medina" | "Pantigoso";

export interface TemplateData {
    id: string;
    nombre: string;
    tipo: TemplateType;
    ultima_edicion: string;
    estado: string;
    variables_mapeadas: number;
    ruta: string;
}

export const MOCK_TEMPLATES: TemplateData[] = [
    {
        id: "tpl_1",
        nombre: "Plantilla_Formulario_Inmatriculacion.pdf",
        tipo: "Formulario",
        ultima_edicion: "2024-03-01",
        estado: "Activo",
        variables_mapeadas: 24,
        ruta: "/plantillas/base_formulario.pdf",
    },
    {
        id: "tpl_2",
        nombre: "Plantilla_Clausula_Cancelacion.pdf",
        tipo: "Clausula",
        ultima_edicion: "2024-03-05",
        estado: "Activo",
        variables_mapeadas: 8,
        ruta: "/plantillas/base_clausula.pdf",
    },
    {
        id: "tpl_3",
        nombre: "Plantilla_P_Medina_Oficial.pdf",
        tipo: "Medina",
        ultima_edicion: "2024-02-15",
        estado: "Activo",
        variables_mapeadas: 12,
        ruta: "/plantillas/base_medina.pdf",
    },
    {
        id: "tpl_4",
        nombre: "Plantilla_P_Pantigoso.pdf",
        tipo: "Pantigoso",
        ultima_edicion: "2024-02-15",
        estado: "Activo",
        variables_mapeadas: 15,
        ruta: "/plantillas/base_pantigoso.pdf",
    }
];