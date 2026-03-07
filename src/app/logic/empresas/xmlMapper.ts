/**
 * ⚡ Protocolo V11: xmlMapper
 * Traduce los datos extraídos del XML de SUNAT al estado del formulario de Empresas.
 * Solo rellena los campos fiscales disponibles, dejando los legales para entrada manual.
 */
export const mapXmlToFormData = (raw: any) => {
  return {
    // Datos provenientes del XML (SUNAT)
    ruc: raw.ruc || "",
    razon_social: raw.razon_social || "",
    direccion: raw.direccion || "",

    // Campos que no vienen en la factura XML y requieren llenado manual
    representante: "",
    dni_rep: "",
    partida: "",

    // Valor por defecto sugerido
    rol: "Concesionario",
  };
};
