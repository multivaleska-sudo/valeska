import { jsPDF } from "jspdf";
import { ask } from "@tauri-apps/plugin-dialog";
import medinaConfig from "../../config/medinaConfig.json";

/**
 * Función Helper Mejorada para convertir imagen local a Base64.
 * Valida si la respuesta es correcta para evitar PDFs corruptos.
 */
const getBase64ImageFromUrl = async (url: string): Promise<string> => {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`No se pudo encontrar la imagen en: ${url}`);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error cargando imagen:", error);
    return "";
  }
};

/**
 * Motor de Generación P. MEDINA v2.2
 * v2.2: FIX DE ESPACIADO - Se han ajustado las coordenadas para evitar solapamiento
 * entre la tabla del vehículo y el texto legal en la Página 1.
 */
export const generateMedinaPdf = async (formData: any) => {
  console.log("Iniciando generación de Medina PDF con datos:", formData);

  try {
    const confirmed = await ask("¿Deseas emitir la Carta Poder P. MEDINA?", {
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
    } = medinaConfig as any;

    // Carga de imágenes con validación (Ruta corregida en JSON: /src/app/image/...)
    const imgNotaria = await getBase64ImageFromUrl(images.logo_notaria_p1.path);
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

    // --- FUNCIONES INTERNAS DE DIBUJO ---
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

    // ================= PÁGINA 1: SUNARP =================
    if (imgNotaria && imgNotaria.startsWith("data:image")) {
      doc.addImage(
        imgNotaria,
        "JPEG",
        images.logo_notaria_p1.x,
        images.logo_notaria_p1.y,
        images.logo_notaria_p1.w,
        images.logo_notaria_p1.h,
      );
    }

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

    doc.text(
      page_1_sunarp.intro_text.text,
      page_1_sunarp.intro_text.x,
      page_1_sunarp.intro_text.y,
      { maxWidth: 170 },
    );

    // Tabla Vehículo SUNARP (y: 100, h: 18)
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

    // Fila Placa (y: 118, h: 8) -> Termina en 126
    doc.rect(20, vt1.y + vt1.h, 170, 8);
    doc.text(
      `N° PLACA:  ${formData.placa || "................"}`,
      25,
      vt1.y + vt1.h + 5,
    );

    // Facultades (y: 135) -> Espacio de 9mm libre desde el final de la tabla
    doc.setFontSize(page_1_sunarp.faculties_text.size);
    doc.text(
      page_1_sunarp.faculties_text.text,
      page_1_sunarp.faculties_text.x,
      page_1_sunarp.faculties_text.y,
      {
        maxWidth: page_1_sunarp.faculties_text.maxWidth,
        align: "justify",
        lineHeightFactor: 1.3,
      },
    );

    // Tabla Apoderados (y: 188)
    drawApoderadosTable(page_1_sunarp.apoderados_table.y);

    // Bloques finales bajados para evitar amontonamiento
    doc.setFontSize(8.5);
    doc.text(page_1_sunarp.legal_footer_text, 20, 215, {
      maxWidth: 170,
      align: "justify",
    });
    doc.text(page_1_sunarp.closing, 20, 230);

    // Firma P1 (y: 255)
    drawSignatureBlock(page_1_sunarp.signature_y);

    // ================= PÁGINA 2: AAP =================
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
    if (imgNotaria && imgNotaria.startsWith("data:image")) {
      doc.addImage(
        imgNotaria,
        "JPEG",
        images.logo_notaria_p2.x,
        images.logo_notaria_p2.y,
        images.logo_notaria_p2.w,
        images.logo_notaria_p2.h,
      );
    }

    doc.setFontSize(page_2_aap.date_pos.size);
    doc.text(fechaActual, page_2_aap.date_pos.x, page_2_aap.date_pos.y, {
      align: "center",
    });

    page_2_aap.addressee.lines.forEach((line: string, i: number) => {
      doc.text(line, page_2_aap.addressee.x, page_2_aap.addressee.y + i * 5);
    });

    doc.setFontSize(page_2_aap.body_text.size);
    doc.text(
      page_2_aap.body_text.text,
      page_2_aap.body_text.x,
      page_2_aap.body_text.y,
      {
        maxWidth: page_2_aap.body_text.maxWidth,
        align: "justify",
        lineHeightFactor: 1.4,
      },
    );

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
    doc.text(`Placa N°:  ${formData.placa || ""}`, 25, vt2.y + vt2.h + 5);
    doc.text(page_2_aap.post_table_text, 20, vt2.y + vt2.h + 15);

    drawApoderadosTable(page_2_aap.apoderados_table.y);
    doc.text(page_2_aap.closing, 20, 240);
    drawSignatureBlock(page_2_aap.signature_y);

    doc.save(
      `PODER_MEDINA_${(formData.cliente || "PLANTILLA").replace(/\s/g, "_")}.pdf`,
    );
  } catch (error) {
    console.error("ERROR CRÍTICO GENERADOR:", error);
  }
};
