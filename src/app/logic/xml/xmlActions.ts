import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { mapXmlToInvoiceData } from "./xmlMapper";

export const handleInvoiceXmlAuditAction = async () => {
  try {
    const selected = await open({
      multiple: false,
      filters: [{ name: "Factura XML SUNAT", extensions: ["xml"] }],
    });

    if (!selected) return null;
    const rawData: any = await invoke("extract_full_invoice_data", {
      path: selected,
    });

    return mapXmlToInvoiceData(rawData);
  } catch (error) {
    console.error("Error crítico en el flujo de Auditoría XML:", error);
    return null;
  }
};
