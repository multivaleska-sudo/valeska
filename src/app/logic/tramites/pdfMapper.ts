export const mapPdfToFormData = (raw: any) => {
  return {
    cliente: raw.cliente || "",
    dni: raw.dni || "",
    num_formato_inmatriculacion: raw.form_inma || "",
    n_titulo: raw.form_inma || "",
    dua: raw.dua || "",
    vehiculo_chasis: raw.vin || "",
    vehiculo_motor: raw.motor || "",
    vehiculo_marca: raw.marca || "",
    vehiculo_modelo: raw.modelo || "",
    vehiculo_anio: raw.anio || "",
    vehiculo_color: raw.color || "",
    vehiculo_categoria: raw.carroceria || "L3 - B",
    tipo_tramite: raw.tipo_tramite || "Primera Inscripción Vehicular",
    estado_tramite: raw.situacion || "En calificación",
    presentante_empresa: raw.empresa || "",
    vehiculo_placa: raw.placa || "",
  };
};
