import { jsPDF } from "jspdf";
import { ask } from "@tauri-apps/plugin-dialog";
import clausulaConfig from "../../config/clausulaConfig.json";

export const generateClausulaPdf = async (formData: any) => {
  try {
    const confirmed = await ask(
      "¿Deseas emitir la Cláusula de Medio de Pago?",
      {
        title: "Confirmación de Documento",
        kind: "info",
        okLabel: "Emitir PDF",
        cancelLabel: "Cancelar",
      },
    );

    if (!confirmed) return;

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const { settings, content, mapping } = clausulaConfig;
    doc.setFont(settings.font_family, "normal");

    // --- CABECERA ---
    const now = new Date();
    const meses = [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ];
    const fechaActual = `${now.getDate()} ${meses[now.getMonth()]} ${now.getFullYear()}`;
    doc.setFontSize(content.header_city.size);
    doc.text(
      settings.default_city,
      content.header_city.x,
      content.header_city.y,
    );
    doc.text(fechaActual, content.header_date.x, content.header_date.y);

    // --- TÍTULO ---
    doc.setFont(settings.font_family, content.title.style as any);
    doc.setFontSize(content.title.size);
    doc.text(content.title.text, content.title.x, content.title.y, {
      align: "center",
    });

    // --- DESTINATARIO ---
    doc.setFont(settings.font_family, "normal");
    doc.setFontSize(content.addressee.size);
    content.addressee.lines.forEach((line, index) => {
      doc.text(line, content.addressee.x, content.addressee.y + index * 5);
    });

    // --- REFERENCIA ---
    doc.setFont(settings.font_family, content.reference_label.style as any);
    doc.setFontSize(content.reference_label.size);
    doc.text(
      content.reference_label.text,
      content.reference_label.x,
      content.reference_label.y,
    );

    // --- DATOS DE REFERENCIA ---
    doc.setFont(settings.font_family, "normal");
    const refFields = [
      "cliente",
      "dni",
      "comprobante",
      "marca",
      "modelo",
      "vin",
    ];
    refFields.forEach((key) => {
      const config = (mapping as any)[key];
      if (!config) return;
      const value = formData[key] || config.default;
      doc.setFontSize(10);
      doc.text(config.label, config.x, config.y);
      doc.text(String(value), config.x + 45, config.y);
    });
    const legal = content.legal_body_p1;
    doc.setFontSize(legal.size);

    doc.text(legal.text, legal.x, legal.y, {
      maxWidth: legal.maxWidth,
      align: legal.align as "justify",
      lineHeightFactor: 1.5,
    });

    // --- DATOS DE OPERACIÓN ---
    const opFields = ["monto_op", "forma_pago", "pago_banco"];
    opFields.forEach((key) => {
      const config = (mapping as any)[key];
      if (!config) return;
      const value = formData[key] || config.default;
      doc.text(`${config.label} ${value}`, config.x, config.y);
    });

    // --- FIRMAS ---
    doc.setFontSize(9);
    doc.text(
      mapping.firma_cliente.line_text,
      mapping.firma_cliente.x,
      mapping.firma_cliente.line_y,
      { align: "center" },
    );
    doc.text(
      mapping.firma_cliente.label,
      mapping.firma_cliente.x,
      mapping.firma_cliente.y,
      { align: "center" },
    );
    doc.text(
      mapping.firma_empresa.line_text,
      mapping.firma_empresa.x,
      mapping.firma_empresa.line_y,
      { align: "center" },
    );
    doc.text(
      mapping.firma_empresa.label,
      mapping.firma_empresa.x,
      mapping.firma_empresa.y,
      { align: "center" },
    );

    // --- PIE DE PÁGINA ---
    doc.setFontSize(content.footer_legal.size);
    doc.text(
      content.footer_legal.text,
      content.footer_legal.x,
      content.footer_legal.y,
      {
        align: "center",
        maxWidth: 180,
      },
    );

    const nameSlug = (formData.cliente || "Plantilla").replace(/\s/g, "_");
    doc.save(`CLAUSULA_${nameSlug}.pdf`);
  } catch (error) {
    console.error("Error al generar PDF:", error);
  }
};
