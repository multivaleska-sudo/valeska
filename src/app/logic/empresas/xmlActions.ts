import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { mapXmlToFormData } from "./xmlMapper";

export const handleXmlAutofillAction = async () => {
  try {
    const selected = await open({
      multiple: false,
      filters: [{ name: "Factura XML SUNAT", extensions: ["xml"] }],
    });

    if (!selected) return null;
    const rawData: any = await invoke("extract_xml_data", { path: selected });

    return mapXmlToFormData(rawData);
  } catch (error) {
    console.error("Error crítico en el flujo de Autofill XML:", error);
    return null;
  }
};
