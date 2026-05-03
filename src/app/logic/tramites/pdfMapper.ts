export const mapPdfToFormData = (raw: any) => {
  let numBoleta = "";
  let tipoBoleta = "Electrónica";

  if (raw.comprobante) {
    const partes = raw.comprobante.split("-");
    if (partes.length >= 3) {
      numBoleta = partes.slice(2).join("-").split(" ")[0].replace(".XML", "");
      tipoBoleta = partes[2].includes("F") ? "Factura" : "Electrónica";
    } else {
      numBoleta = raw.comprobante.replace(".XML", "");
    }
  }

  return {
    cliente: raw.cliente || "",
    dni: raw.dni || "",
    num_formato_inmatriculacion: raw.form_inma || "",
    n_titulo: "",
    dua: raw.dua || "",
    vehiculo_chasis: raw.vin || "",
    vehiculo_motor: raw.motor || "",
    vehiculo_marca: raw.marca || "",
    vehiculo_modelo: raw.modelo || "",
    vehiculo_anio: raw.anio || "",
    vehiculo_color: raw.color || "",
    vehiculo_carroceria: raw.carroceria || "",
    vehiculo_categoria: "L3 - B",
    tipo_tramite: "Primera Inscripción Vehicular",
    estado_tramite: "En calificación",
    presentante_empresa: raw.empresa || "",
    presentante_persona: raw.representante || "",

    pdf_empresa_domicilio: raw.empresa_domicilio || "",
    pdf_rep_dni: raw.representante_dni || "",
    pdf_partida: raw.partida_registral || "",
    pdf_oficina: raw.oficina_registral || "",

    clausula_monto: raw.importe || "",
    clausula_forma_pago: raw.forma_pago || "",
    numero_boleta: numBoleta,
    tipo_boleta: tipoBoleta,
    vehiculo_placa: "",
  };
};
