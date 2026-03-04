export const mapPdfToFormData = (raw: any) => ({
  cliente: raw.cliente || "",
  dni: raw.dni || "",
  dua: raw.dua || "",
  vin: raw.vin || "",
  motor: raw.motor || "",
  marca: raw.marca || "",
  modelo: raw.modelo || "",
  anio: raw.anio || "",
  color: raw.color || "",
  carroceria: raw.carroceria || "MOTOCICLETA",
});
