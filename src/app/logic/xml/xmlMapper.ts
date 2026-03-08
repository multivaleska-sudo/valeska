export const mapXmlToInvoiceData = (raw: any) => {
  return {
    emisor_ruc: raw.emisor_ruc || "---",
    emisor_razon: raw.emisor_razon || "---",
    receptor_ruc: raw.receptor_ruc || "---",
    receptor_razon: raw.receptor_razon || "---",

    fecha_emision: raw.fecha_emision || "---",
    moneda: raw.moneda || "S/",
    importe_total: raw.importe_total || "0.00",

    items: (raw.items || []).map((item: any) => ({
      id: item.id || "0",
      unidad: item.unidad || "NIU",
      cantidad: item.cantidad || "0",
      codigo: item.codigo || "-",
      descripcion: item.descripcion || "Sin descripción",
      precio_total: item.precio_total || "0.00",
    })),
  };
};
