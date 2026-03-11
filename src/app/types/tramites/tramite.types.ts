/**
 * 📄 tramite.types.ts
 * Contrato único para la gestión de expedientes Valeska V2.
 */

export interface TramiteData {
  cliente: string;
  dni: string;
  tipo_tramite: string;
  n_titulo: string;
  n_formato: string;
  situacion: string;
  check_recibo: boolean;
  check_dni: boolean;
  fecha_entrega: string;
  observaciones: string;
  dua: string;
  vin: string;
  motor: string;
  placa: string;
  marca: string;
  modelo: string;
  anio: string;
  color: string;
  carroceria: string;
  empresa: string;
}

// Props para componentes compartidos específicos de trámites
export interface FormFieldProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  type?: "text" | "date" | "number";
  mono?: boolean; // Para VIN/Motor/DUA
}

export interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: string[];
}
