export interface TemplateData {
    id: string;
    nombre: string;
    contenidoHtml: string;
    orientacion: 'PORTRAIT' | 'LANDSCAPE';
    ultima_edicion: string;
    variables_mapeadas: number;
    activo: boolean;
}