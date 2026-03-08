export const mapXmlToFormData = (raw: any) => {
  return {
    ruc: raw.ruc || "",
    razon_social: raw.razon_social || "",
    direccion: raw.direccion || "",

    representante: "",
    dni_rep: "",
    partida: "",
    rol: "Concesionario",
  };
};
