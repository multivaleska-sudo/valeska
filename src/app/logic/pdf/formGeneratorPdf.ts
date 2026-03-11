import { jsPDF } from "jspdf";
import { ask } from "@tauri-apps/plugin-dialog";
import formConfig from "../../config/formconfig.json";

export const generateLegacyForm = async () => {
  try {
    const confirmed = await ask("¿Deseas emitir el Formulario?", {
      title: "Confirmación de Emisión",
      kind: "warning",
      okLabel: "Sí, Emitir PDF",
      cancelLabel: "Cancelar",
    });

    if (!confirmed) {
      return;
    }

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const { mapping } = formConfig;

    doc.setFont("helvetica", "normal");

    Object.entries(mapping).forEach(([key, value]) => {
      const fontSize = value.size || 9;
      doc.setFontSize(fontSize);
      if (value.text !== undefined) {
        doc.text(String(value.text), value.x, value.y);
      } else {
        console.warn(`Campo omitido: ${key} no tiene la propiedad 'text'.`);
      }
    });
    const fileName = "FORMULARIO_SISTEMA_NUEVO.pdf";
    doc.save(fileName);
  } catch (error) {
    console.error("Error crítico durante la generación del PDF:", error);
  }
};
