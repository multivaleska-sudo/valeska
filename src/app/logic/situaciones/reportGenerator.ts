import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { ask } from "@tauri-apps/plugin-dialog";
import Database from "@tauri-apps/plugin-sql";
import { sileo } from "sileo";

export const generateSituacionesReport = async () => {
  try {
    const confirmed = await ask("¿Deseas generar el reporte en formato PDF?", {
      title: "Confirmación de Reporte",
      kind: "info",
      okLabel: "Generar PDF",
      cancelLabel: "Cancelar",
    });

    if (!confirmed) return;

    const sqlite = await Database.load("sqlite:valeska.db");
    const query = `
        SELECT 
            cs.nombre, 
            cs.color_hex as color, 
            COUNT(t.id) as count 
        FROM catalogo_situaciones cs
        LEFT JOIN tramites t ON cs.id = t.situacion_id AND t.deleted_at IS NULL
        WHERE cs.activo = 1
        GROUP BY cs.id, cs.nombre, cs.color_hex
        ORDER BY count DESC
    `;

    const dbResult: any[] = await sqlite.select(query);

    const situaciones = dbResult.map((r) => ({
      nombre: r.nombre || "Desconocido",
      count: Number(r.count) || 0,
      color: r.color || "#cccccc",
    }));

    const total = situaciones.reduce((acc, curr) => acc + curr.count, 0);

    if (total === 0) {
      sileo.warning({
        title: "Sin datos",
        description: "No hay trámites registrados para generar la gráfica.",
      });
      return;
    }

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const now = new Date();
    const dateStr = now.toLocaleDateString() + " " + now.toLocaleTimeString();

    doc.setFillColor(30, 58, 138);
    doc.rect(0, 0, 210, 40, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("REPORTE ESTADÍSTICO DE TRÁMITES", 20, 20);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Sistema de Gestión Valeska - Generado el: ${dateStr}`, 20, 30);

    // 2. Tabla de Resumen
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Resumen por Situación", 20, 55);

    const tableRows = situaciones.map((s, index) => [
      index + 1,
      s.nombre.toUpperCase(),
      s.count,
      `${((s.count / total) * 100).toFixed(1)}%`,
    ]);

    autoTable(doc, {
      startY: 60,
      head: [["#", "SITUACIÓN", "CANTIDAD", "PORCENTAJE"]],
      body: tableRows,
      theme: "striped",
      headStyles: { fillColor: [37, 99, 235], fontStyle: "bold" },
      margin: { left: 20, right: 20 },
    });

    const finalY = (doc as any).lastAutoTable.finalY || 100;

    const titleY = finalY + 20;
    const centerY = titleY + 45;
    const centerX = 70;
    const radius = 35;

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Distribución de Carga ", 20, titleY);

    let currentAngle = 0;

    // Helper para parsear colores hexadecimales de forma segura
    const getRGB = (hex: string) => {
      const cleanHex = hex.startsWith("#") ? hex : `#${hex}`;
      const r = parseInt(cleanHex.slice(1, 3), 16) || 200;
      const g = parseInt(cleanHex.slice(3, 5), 16) || 200;
      const b = parseInt(cleanHex.slice(5, 7), 16) || 200;
      return { r, g, b };
    };

    situaciones.forEach((s) => {
      if (s.count === 0) return;

      const sliceAngle = (s.count / total) * 2 * Math.PI;
      const { r, g, b } = getRGB(s.color);

      doc.setFillColor(r, g, b);
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(0.5);

      const lines = [];

      // Primer punto: Del centro al inicio del arco
      let startXRel = radius * Math.cos(currentAngle);
      let startYRel = radius * Math.sin(currentAngle);
      lines.push([startXRel, startYRel]);

      // Puntos del arco: Cada punto es relativo al ANTERIOR
      let lastX = startXRel;
      let lastY = startYRel;
      const segments = 40;
      for (let i = 1; i <= segments; i++) {
        const angle = currentAngle + sliceAngle * (i / segments);
        const nextX = radius * Math.cos(angle);
        const nextY = radius * Math.sin(angle);

        lines.push([nextX - lastX, nextY - lastY]);
        lastX = nextX;
        lastY = nextY;
      }

      lines.push([-lastX, -lastY]);

      doc.lines(lines, centerX, centerY, [1, 1], "FD", true);

      currentAngle += sliceAngle;
    });

    doc.setFillColor(255, 255, 255);
    doc.circle(centerX, centerY, radius * 0.55, "F");

    doc.setFontSize(16);
    doc.setTextColor(50, 50, 50);
    doc.text(`${total}`, centerX, centerY + 2, { align: "center" });
    doc.setFontSize(7);
    doc.text("TRÁMITES", centerX, centerY + 7, { align: "center" });

    // 4. Leyenda Calibrada
    let legendY = centerY - 15;
    const legendX = 125;

    situaciones.forEach((s) => {
      const { r, g, b } = getRGB(s.color);

      doc.setFillColor(r, g, b);
      doc.roundedRect(legendX, legendY, 5, 5, 1, 1, "F");

      doc.setTextColor(60, 60, 60);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(`${s.nombre}`, legendX + 8, legendY + 4);

      const percentage = ((s.count / total) * 100).toFixed(1);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(130, 130, 130);
      doc.text(
        `${s.count} expedientes (${percentage}%)`,
        legendX + 8,
        legendY + 9,
      );

      legendY += 15;
    });

    doc.setFontSize(8);
    doc.setTextColor(180, 180, 180);
    doc.text(
      "Este reporte es generado por el núcleo de auditoría de Valeska.",
      105,
      285,
      { align: "center" },
    );

    doc.save(`REPORTE_SITUACIONES_${now.getTime()}.pdf`);
    sileo.success({
      title: "Reporte Generado",
      description: "El documento PDF ha sido guardado exitosamente.",
    });
  } catch (error: any) {
    console.error("CRASH EN GENERADOR PDF:", error);
    sileo.error({
      title: "Error de PDF",
      description: error.message || "Fallo al generar el reporte estadístico.",
    });
  }
};
