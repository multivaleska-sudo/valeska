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

export interface TramiteFormData {
  id?: string;
  tramite_anio: string;
  cliente: string;
  telefono: string;
  dni: string;
  n_titulo: string;
  tipo_tramite: string;
  estado_tramite: string;
  observaciones: string;
  fecha_presentacion: string;

  check_tarjeta_oficina: boolean;
  fecha_tarjeta_oficina: string;
  check_placa_oficina: boolean;
  fecha_placa_oficina: string;

  check_entrega_tarjeta: boolean;
  fecha_entrega_tarjeta: string;
  metodo_entrega_tarjeta: string;

  check_entrega_placa: boolean;
  fecha_entrega_placa: string;
  metodo_entrega_placa: string;

  codigo_verificacion: string;

  vehiculo_marca: string;
  vehiculo_motor: string;
  vehiculo_chasis: string;
  vehiculo_anio: string;
  vehiculo_color: string;
  vehiculo_carroceria: string;
  vehiculo_placa: string;
  vehiculo_modelo: string;

  presentante_empresa: string;
  presentante_persona: string;

  tipo_boleta: string;
  numero_boleta: string;
  fecha_boleta: string;
  dua: string;
  num_formato_inmatriculacion: string;
  numero_recibo_tramite: string;

  clausula_monto: string;
  clausula_forma_pago: string;
  clausula_pago_bancarizado: string;

  aclaracion_dice: string;
  aclaracion_debe_decir: string;

  fecha_impresion: string;
}

export interface FormFieldProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  type?: "text" | "date" | "number";
  mono?: boolean;
}

export interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: string[];
}