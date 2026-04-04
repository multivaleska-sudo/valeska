import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { mapPdfToFormData } from "./pdfMapper";
import { sileo } from "sileo";

export const handlePdfAutofillAction = async () => {
  try {
    const selected = await open({
      multiple: false,
      filters: [{ name: "SUNARP PDF", extensions: ["pdf"] }],
    });
    if (!selected) return null;

    const rawData: any = await invoke("extract_pdf_data", { path: selected });
    return mapPdfToFormData(rawData);
  } catch (error: any) {
    console.error("Error en Autofill:", error);
    sileo.error({
      title: "Error al leer PDF",
      description:
        error.message ||
        "Ocurrió un problema al intentar extraer los datos del documento.",
    });
    return null;
  }
};
