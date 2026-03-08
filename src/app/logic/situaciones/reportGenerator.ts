import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface SituationData {
  id: number;
  nombre: string;
  color: string;
  count: number;
}

export const generateSituacionesReport = (situaciones: SituationData[]) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const total = situaciones.reduce((acc, curr) => acc + curr.count, 0);
  const now = new Date();
  const dateStr = now.toLocaleDateString() + " " + now.toLocaleTimeString();

  // 1. Cabecera Estilizada
  doc.setFillColor(30, 58, 138); // Azul oscuro corporativo
  doc.rect(0, 0, 210, 40, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("REPORTE ESTADÍSTICO DE TRÁMITES", 20, 20);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Sistema de Gestión Valeska v2 - Generado el: ${dateStr}`, 20, 30);

  // 2. Tabla de Resumen
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
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
    headStyles: { fillColor: [37, 99, 235] },
    margin: { left: 20, right: 20 },
  });

  // 3. Gráfico Circular (Vectores Matemáticos)
  const chartY = (doc as any).lastAutoTable.finalY + 40;
  const centerX = 105;
  const centerY = chartY + 30;
  const radius = 35;

  doc.setFontSize(14);
  doc.text("Distribución Visual (Análisis de Carga)", 20, chartY - 10);

  let currentAngle = 0;

  situaciones.forEach((s) => {
    const sliceAngle = (s.count / total) * 2 * Math.PI;

    // Configurar color del sector
    const r = parseInt(s.color.slice(1, 3), 16);
    const g = parseInt(s.color.slice(3, 5), 16);
    const b = parseInt(s.color.slice(5, 7), 16);
    doc.setFillColor(r, g, b);

    // Dibujar sector del gráfico
    doc.setLineWidth(0.5);
    doc.setDrawColor(255, 255, 255);

    // jsPDF no tiene un "pie slice" nativo fácil, usamos lineas y arcos
    // o simplemente dibujamos el circulo y las leyendas
    // Para simplificar y asegurar compatibilidad, dibujaremos los sectores:
    const startX = centerX + radius * Math.cos(currentAngle);
    const startY = centerY + radius * Math.sin(currentAngle);

    doc.lines(
      [[radius * Math.cos(currentAngle), radius * Math.sin(currentAngle)]],
      centerX,
      centerY,
    );

    // Incrementamos ángulo
    currentAngle += sliceAngle;
  });

  // Dibujamos el círculo base para la estética
  doc.setLineWidth(0.1);
  doc.setDrawColor(200, 200, 200);
  doc.circle(centerX, centerY, radius, "S");

  // 4. Leyenda del Gráfico
  let legendY = centerY - 20;
  situaciones.forEach((s) => {
    const r = parseInt(s.color.slice(1, 3), 16);
    const g = parseInt(s.color.slice(3, 5), 16);
    const b = parseInt(s.color.slice(5, 7), 16);

    doc.setFillColor(r, g, b);
    doc.rect(155, legendY, 4, 4, "F");

    doc.setTextColor(80, 80, 80);
    doc.setFontSize(9);
    doc.text(
      `${s.nombre} (${((s.count / total) * 100).toFixed(0)}%)`,
      162,
      legendY + 3.5,
    );
    legendY += 8;
  });

  // 5. Footer Pro
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    "Este reporte es de carácter informativo para la gestión interna de trámites.",
    105,
    285,
    { align: "center" },
  );

  doc.save(`REPORTE_SITUACIONES_${now.getTime()}.pdf`);
};
