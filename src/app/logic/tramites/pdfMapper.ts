export const mapPdfToFormData = (raw: any) => {
  return {
    cliente: raw.cliente || "",
    dni: raw.dni || "",
    n_formato: raw.form_inma || "",
    n_titulo: raw.form_inma || "",
    dua: raw.dua || "",
    vin: raw.vin || "",
    motor: raw.motor || "",
    marca: raw.marca || "",
    modelo: raw.modelo || "",
    anio: raw.anio || "",
    color: raw.color || "",
    carroceria: raw.carroceria || "MOTOCICLETA",
    tipo_tramite: raw.tipo_tramite || "Inmatriculación",
    situacion: raw.situacion || "En calificación",
    empresa: raw.empresa || "",
    placa: "",
  };
};
