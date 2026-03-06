import { jsPDF } from "jspdf";
import { ask } from "@tauri-apps/plugin-dialog";
import formConfig from "../../config/formconfig.json";

/**
 * Motor de Impresión Estricto "Copia Fiel" v4.3.
 * Emite el documento basándose exclusivamente en los valores fijos de formconfig.json.
 * * CAMBIOS:
 * 1. Confirmación de usuario obligatoria antes de emitir.
 * 2. Eliminación total de la rejilla (hoja en blanco).
 * 3. Procesamiento literal de textos desde el JSON.
 */
export const generateLegacyForm = async () => {
  try {
    // 1. Diálogo de confirmación nativo de Tauri
    const confirmed = await ask(
      "¿Deseas emitir el Formulario Legacy con los datos predeterminados del sistema original?",
      {
        title: "Confirmación de Emisión",
        kind: "warning",
        okLabel: "Sí, Emitir PDF",
        cancelLabel: "Cancelar",
      },
    );

    if (!confirmed) {
      console.log("Emisión cancelada por el usuario.");
      return;
    }

    console.log("Generando documento en hoja en blanco...");

    // 2. Configuración del documento (A4, mm, vertical)
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const { mapping } = formConfig;

    // 3. Estampado de textos (Bucle estricto sobre el mapping del JSON)
    doc.setFont("helvetica", "normal");

    Object.entries(mapping).forEach(([key, value]) => {
      // Establecer tamaño de fuente (por defecto 9)
      const fontSize = value.size || 9;
      doc.setFontSize(fontSize);

      // Estampar el texto literal definido en la propiedad 'text' del JSON
      if (value.text !== undefined) {
        // doc.text(texto, x, y)
        doc.text(String(value.text), value.x, value.y);
      } else {
        console.warn(`Campo omitido: ${key} no tiene la propiedad 'text'.`);
      }
    });

    // 4. Finalización y descarga
    const fileName = "FORMULARIO_SISTEMA_NUEVO.pdf";
    doc.save(fileName);

    console.log("PDF generado exitosamente en hoja blanca.");
  } catch (error) {
    console.error("Error crítico durante la generación del PDF:", error);
  }
};
