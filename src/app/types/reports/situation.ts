/**
 * Representa el resumen de un estado o situación de trámite
 * para visualización en el Dashboard (KPIs).
 */
export interface SituationData {
  id: number;
  nombre: string;
  color: string;
  count: number;
}

/**
 * Representa una entrada en el historial de cambios de situación
 * (Útil para la línea de tiempo de auditoría).
 */
export interface SituationHistory {
  id: string;
  tramite_id: string;
  situacion_anterior: string;
  situacion_nueva: string;
  fecha_cambio: string;
  usuario_id: string;
  comentario?: string;
}

/**
 * Resumen global de productividad por sucursal.
 */
export interface ReportSummary {
  total_tramites: number;
  total_pendientes: number;
  total_finalizados: number;
  porcentaje_exito: number;
}
