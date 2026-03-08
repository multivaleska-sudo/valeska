import React, { useMemo } from "react";
import {
  Tag,
  TrendingUp,
  BarChart3,
  PieChart as PieIcon,
  Activity,
  Printer,
  FileDown,
} from "lucide-react";
import { generateSituacionesReport } from "../logic/situaciones/reportGenerator";

export function SituacionesPage() {
  // --- MOCK DE DATOS ACTUALIZADO ---
  const situaciones = [
    { id: 1, nombre: "En proceso", color: "#2563EB", count: 15 },
    { id: 2, nombre: "Documentación", color: "#F59E0B", count: 8 },
    { id: 3, nombre: "Entregado", color: "#16A34A", count: 42 },
    { id: 4, nombre: "Pendiente", color: "#DC2626", count: 5 },
  ];

  // Cálculos para los gráficos
  const total = useMemo(
    () => situaciones.reduce((acc, curr) => acc + curr.count, 0),
    [situaciones],
  );

  // Generar coordenadas para el Pie Chart SVG
  const pieSlices = useMemo(() => {
    let cumulativePercent = 0;
    return situaciones.map((sit) => {
      const percent = sit.count / total;
      const startX = Math.cos(2 * Math.PI * cumulativePercent);
      const startY = Math.sin(2 * Math.PI * cumulativePercent);
      cumulativePercent += percent;
      const endX = Math.cos(2 * Math.PI * cumulativePercent);
      const endY = Math.sin(2 * Math.PI * cumulativePercent);
      const largeArcFlag = percent > 0.5 ? 1 : 0;

      // Path de SVG para el sector circular
      const pathData = [
        `M ${startX} ${startY}`,
        `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
        `L 0 0`,
      ].join(" ");

      return { ...sit, pathData, percentage: (percent * 100).toFixed(1) };
    });
  }, [situaciones, total]);

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-500">
      {/* HEADER: SIN BOTÓN DE CREACIÓN */}
      <div className="flex items-end justify-between border-b border-gray-100 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="text-blue-600 w-7 h-7" /> Estadísticas de
            Situación
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Análisis visual del estado actual de todos los expedientes en el
            sistema.
          </p>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">
            Total Trámites
          </span>
          <p className="text-3xl font-black text-blue-600">{total}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* PANEL IZQUIERDO: GRÁFICO CIRCULAR GENERAL */}
        <section className="lg:col-span-1 bg-white p-8 rounded-2xl border border-gray-200 shadow-sm flex flex-col items-center justify-center space-y-6">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <PieIcon size={16} /> Distribución Global
          </h3>

          <div className="relative w-64 h-64">
            <svg
              viewBox="-1 -1 2 2"
              className="transform -rotate-90 w-full h-full drop-shadow-xl"
            >
              {pieSlices.map((slice) => (
                <path
                  key={slice.id}
                  d={slice.pathData}
                  fill={slice.color}
                  className="transition-all hover:opacity-80 cursor-help"
                />
              ))}
              {/* Círculo central para efecto Donut opcional */}
              <circle cx="0" cy="0" r="0.6" fill="white" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-4xl font-black text-gray-800">{total}</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase">
                Expedientes
              </span>
            </div>
          </div>

          <div className="w-full space-y-2">
            {pieSlices.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between text-xs font-bold p-2 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: s.color }}
                  />
                  <span className="text-gray-600">{s.nombre}</span>
                </div>
                <span className="text-gray-900">{s.percentage}%</span>
              </div>
            ))}
          </div>
        </section>

        {/* PANEL DERECHO: TARJETAS CON GRÁFICOS INDIVIDUALES */}
        <section className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {situaciones.map((sit) => (
              <StatusCard key={sit.id} situation={sit} total={total} />
            ))}
          </div>

          {/* SECCIÓN DE INSIGHTS (TOQUE PRO) */}
          <div className="space-y-4">
            <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-200 flex items-center gap-6 overflow-hidden relative">
              <TrendingUp className="w-20 h-20 text-blue-500 absolute -right-4 -bottom-4 rotate-12 opacity-50" />
              <div className="bg-white/20 p-4 rounded-xl">
                <Activity className="w-8 h-8 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-lg">Resumen de Operatividad</h4>
                <p className="text-blue-100 text-sm max-w-md">
                  El estado{" "}
                  <span className="font-bold underline">"Entregado"</span>{" "}
                  representa el {((42 / total) * 100).toFixed(0)}% de tu carga
                  laboral. Mantienes una tasa de eficiencia alta este mes.
                </p>
              </div>
            </div>

            {/* BOTÓN DE REPORTE PDF (ESTÉTICO) */}
            <div className="flex justify-end">
              <button
                onClick={() => generateSituacionesReport(situaciones)}
                className="bg-white border border-gray-200 text-gray-700 px-6 py-3 rounded-xl font-bold flex items-center gap-3 shadow-sm hover:bg-gray-50 hover:border-blue-300 hover:text-blue-600 transition-all active:scale-95 group text-sm"
              >
                <div className="bg-blue-50 p-2 rounded-lg group-hover:bg-blue-100 transition-colors">
                  <Printer className="w-4 h-4 text-blue-600" />
                </div>
                Generar Reporte Estadístico PDF
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

// --- COMPONENTE: TARJETA DE ESTADO CON GRÁFICO RADIAL ---
function StatusCard({ situation, total }: { situation: any; total: number }) {
  const percentage = (situation.count / total) * 100;
  const strokeDasharray = `${percentage}, 100`;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 flex items-center justify-between shadow-sm hover:border-blue-300 transition-all group">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div
            className="p-2.5 rounded-xl text-white shadow-md"
            style={{ backgroundColor: situation.color }}
          >
            <Tag size={18} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 leading-tight">
              {situation.nombre}
            </h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
              Situación de Trámite
            </p>
          </div>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-black text-gray-800">
            {situation.count}
          </span>
          <span className="text-xs font-bold text-gray-400">docs</span>
        </div>
      </div>

      {/* MINI GRÁFICO RADIAL INDIVIDUAL */}
      <div className="relative w-20 h-20">
        <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
          <path
            className="text-gray-100"
            stroke="currentColor"
            strokeWidth="3.8"
            fill="none"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          <path
            stroke={situation.color}
            strokeDasharray={strokeDasharray}
            strokeLinecap="round"
            strokeWidth="3.8"
            fill="none"
            className="transition-all duration-1000 ease-out"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] font-black text-gray-700">
            {percentage.toFixed(0)}%
          </span>
        </div>
      </div>
    </div>
  );
}
