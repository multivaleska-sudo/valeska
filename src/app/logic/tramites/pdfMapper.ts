/**
 * Traduce los datos crudos extraídos por el motor de Rust
 * al estado exacto que espera el formulario de React.
 * * v2: Se eliminan valores por defecto estáticos y se usa
 * la lógica condicional solicitada.
 */
export const mapPdfToFormData = (raw: any) => {
  return {
    // Datos del Propietario
    cliente: raw.cliente || "",
    dni: raw.dni || "",

    // Datos del Trámite
    n_formato: raw.form_inma || "",
    n_titulo: raw.form_inma || "",

    // Datos del Vehículo
    dua: raw.dua || "",
    vin: raw.vin || "",
    motor: raw.motor || "",
    marca: raw.marca || "",
    modelo: raw.modelo || "",
    anio: raw.anio || "",
    color: raw.color || "",

    // Condicionales solicitados: Valor del PDF || Valor por defecto
    carroceria: raw.carroceria || "MOTOCICLETA",
    tipo_tramite: raw.tipo_tramite || "Inmatriculación",
    situacion: raw.situacion || "En calificación",
    empresa: raw.empresa || "", // Cambiado según sugerencia de imagen

    // La placa no existe en los documentos, se deja en blanco por defecto
    placa: "",
  };
};
