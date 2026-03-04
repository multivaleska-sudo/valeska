import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { mapPdfToFormData } from "./pdfMapper";

export const handlePdfAutofillAction = async () => {
  try {
    const selected = await open({
      multiple: false,
      filters: [{ name: "SUNARP PDF", extensions: ["pdf"] }],
    });
    if (!selected) return null;
    const rawData: any = await invoke("extract_pdf_data", { path: selected });
    return mapPdfToFormData(rawData);
  } catch (error) {
    console.error("Error en Autofill:", error);
    return null;
  }
};
