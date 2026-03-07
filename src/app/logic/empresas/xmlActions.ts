import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { mapXmlToFormData } from "./xmlMapper";

/**
 * 🚀 handleXmlAutofillAction
 * Gestiona la apertura del explorador de archivos, invoca el motor de Rust
 * y devuelve los datos mapeados para el formulario.
 */
export const handleXmlAutofillAction = async () => {
  try {
    // 1. Abrir diálogo nativo filtrando solo archivos XML
    const selected = await open({
      multiple: false,
      filters: [{ name: "Factura XML SUNAT", extensions: ["xml"] }],
    });

    if (!selected) return null;

    // 2. Invocar el comando de Rust registrado en lib.rs
    // Nota: El comando en Rust es 'extract_xml_data'
    const rawData: any = await invoke("extract_xml_data", { path: selected });

    // 3. Traducir y limpiar datos para React
    return mapXmlToFormData(rawData);
  } catch (error) {
    console.error("Error crítico en el flujo de Autofill XML:", error);
    return null;
  }
};
