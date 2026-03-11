import { jsPDF } from "jspdf";
import { ask } from "@tauri-apps/plugin-dialog";
import pantigosoConfig from "../../config/pantigosoConfig.json";
import { getBase64ImageFromUrl } from "../../lib/imageConverter";

export const generatePantigosoPdf = async (formData: any) => {
  try {
    const confirmed = await ask("¿Deseas emitir la Carta Poder P. PANTIGOSO?", {
      title: "Confirmación de Emisión",
      kind: "info",
      okLabel: "Emitir PDF",
      cancelLabel: "Cancelar",
    });

    if (!confirmed) return;

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });
    const {
      settings,
      images,
      apoderados_fijos,
      common_labels,
      page_1_sunarp,
      page_2_aap,
    } = pantigosoConfig as any;

    const imgAap = await getBase64ImageFromUrl(images.logo_aap.path);

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
    const fechaActual = `${settings.default_city}, ${now.getDate()} ${meses[now.getMonth()]} ${now.getFullYear()}`;

    const drawApoderadosTable = (startY: number) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.rect(20, startY, 130, 7);
      doc.rect(150, startY, 40, 7);
      doc.text("Nombres y apellidos completos", 25, startY + 5);
      doc.text("DNI", 155, startY + 5);
      doc.setFont("helvetica", "normal");
      apoderados_fijos.forEach((ap: any, i: number) => {
        const y = startY + 7 + i * 7;
        doc.rect(20, y, 130, 7);
        doc.rect(150, y, 40, 7);
        doc.text(ap.nombre, 25, y + 5);
        doc.text(ap.dni, 155, y + 5);
      });
    };

    const drawSignatureBlock = (y: number) => {
      doc.setFontSize(10);
      doc.text(common_labels.firma_line, 20, y);
      doc.setFont("helvetica", "bold");
      doc.text(
        `${common_labels.nombre_label} ${formData.cliente || "................................................"}`,
        20,
        y + 8,
      );
      doc.text(
        `${common_labels.dni_label} ${formData.dni || "................"}`,
        20,
        y + 16,
      );
      doc.setFontSize(6);
      doc.setFont("helvetica", "normal");
      doc.text(common_labels.footer_valeska, 105, 285, {
        align: "center",
        maxWidth: 180,
      });
    };

    // ================= PÁGINA 1 (SUNARP) =================
    doc.setFont("helvetica", "bold");
    doc.setFontSize(page_1_sunarp.title.size);
    doc.text(
      page_1_sunarp.title.text,
      page_1_sunarp.title.x,
      page_1_sunarp.title.y,
      { align: "center" },
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(page_1_sunarp.date_pos.size);
    doc.text(fechaActual, page_1_sunarp.date_pos.x, page_1_sunarp.date_pos.y, {
      align: "center",
    });

    page_1_sunarp.addressee.lines.forEach((line: string, i: number) => {
      doc.text(
        line,
        page_1_sunarp.addressee.x,
        page_1_sunarp.addressee.y + i * 5,
      );
    });

    doc.text(page_1_sunarp.intro_text, 20, 85, { maxWidth: 170 });

    const vt1 = page_1_sunarp.vehicle_table;
    doc.rect(20, vt1.y, 85, vt1.h);
    doc.rect(105, vt1.y, 85, vt1.h);
    doc.setFont("helvetica", "bold");
    doc.text("N° SERIE Y/O CHASIS", 25, vt1.y + 6);
    doc.text("N° MOTOR", 110, vt1.y + 6);
    doc.setFont("helvetica", "normal");
    doc.text(
      formData.vin || "................................",
      25,
      vt1.y + 14,
    );
    doc.text(
      formData.motor || "................................",
      110,
      vt1.y + 14,
    );

    doc.setFontSize(9);
    doc.text(page_1_sunarp.faculties_text, 20, 135, {
      maxWidth: 170,
      align: "justify",
      lineHeightFactor: 1.3,
    });
    drawApoderadosTable(page_1_sunarp.apoderados_table.y);

    doc.setFontSize(8.5);
    doc.text(page_1_sunarp.legal_footer_text, 20, 215, {
      maxWidth: 170,
      align: "justify",
    });
    doc.text(page_1_sunarp.closing, 20, 230);
    drawSignatureBlock(page_1_sunarp.signature_y);

    doc.setFontSize(7);
    doc.text(
      page_1_sunarp.page_tag.text,
      page_1_sunarp.page_tag.x,
      page_1_sunarp.page_tag.y,
      { align: "right" },
    );

    // ================= PÁGINA 2 (AAP) =================
    doc.addPage();
    if (imgAap && imgAap.startsWith("data:image")) {
      doc.addImage(
        imgAap,
        "JPEG",
        images.logo_aap.x,
        images.logo_aap.y,
        images.logo_aap.w,
        images.logo_aap.h,
      );
    }

    doc.setFontSize(page_2_aap.date_pos.size);
    doc.setFont("helvetica", "normal");
    doc.text(fechaActual, page_2_aap.date_pos.x, page_2_aap.date_pos.y, {
      align: "center",
    });

    let currentY = page_2_aap.addressee.y;
    page_2_aap.addressee.lines.forEach((line: string) => {
      doc.text(line, page_2_aap.addressee.x, currentY);
      currentY += 5;
    });
    doc.setFont("helvetica", "bolditalic");
    doc.text(page_2_aap.addressee.bold_line, page_2_aap.addressee.x, currentY);
    currentY += 10;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(page_2_aap.body_text, 20, currentY, {
      maxWidth: 170,
      align: "justify",
      lineHeightFactor: 1.4,
    });

    const vt2 = page_2_aap.vehicle_table;
    doc.rect(20, vt2.y, 85, vt2.h);
    doc.rect(105, vt2.y, 85, vt2.h);
    doc.text("SERIE:", 25, vt2.y + 7);
    doc.text("MOTOR:", 110, vt2.y + 7);
    doc.setFont("helvetica", "bold");
    doc.text(formData.vin || "", 25, vt2.y + 15);
    doc.text(formData.motor || "", 110, vt2.y + 15);

    doc.rect(20, vt2.y + vt2.h, 170, 8);
    doc.setFont("helvetica", "normal");
    doc.text(`Placa N°:`, 25, vt2.y + vt2.h + 5);
    doc.setFont("helvetica", "bold");
    doc.text(`${formData.placa || ""}`, 45, vt2.y + vt2.h + 5);

    doc.setFont("helvetica", "normal");
    doc.text(page_2_aap.post_table_text, 20, vt2.y + vt2.h + 15);

    drawApoderadosTable(page_2_aap.apoderados_table.y);
    doc.text(page_2_aap.closing, 20, 240);
    drawSignatureBlock(page_2_aap.signature_y);

    doc.save(
      `PODER_PANTIGOSO_${(formData.cliente || "PLANTILLA").replace(/\s/g, "_")}.pdf`,
    );
  } catch (error) {
    console.error("Error Generador Pantigoso:", error);
  }
};
