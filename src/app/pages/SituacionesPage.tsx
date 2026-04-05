import {
  Tag,
  TrendingUp,
  BarChart3,
  PieChart as PieIcon,
  Activity,
  Printer,
} from "lucide-react";
import { generateSituacionesReport } from "../logic/situaciones/reportGenerator";
import { useSituacionesLogic } from "../logic/situaciones/useSituacionesLogic";

export function SituacionesPage() {
  const { situaciones, total, pieSlices, isLoading } = useSituacionesLogic();

  if (isLoading) {
    return (
      <div className="p-6 h-screen flex items-center justify-center animate-in fade-in duration-300">
        <p className="text-gray-500 font-bold animate-pulse">
          Cargando métricas...
        </p>
      </div>
    );
  }

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
            {total > 0 ? (
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
            ) : (
              <div className="w-full h-full rounded-full border-4 border-dashed border-gray-200 flex items-center justify-center">
                <span className="text-xs text-gray-400 font-bold">
                  Sin datos
                </span>
              </div>
            )}

            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-4xl font-black text-gray-800">{total}</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase">
                Expedientes
              </span>
            </div>
          </div>

          <div className="w-full space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
            {pieSlices.map(
              (s) =>
                s.count > 0 && (
                  <div
                    key={s.id}
                    className="flex items-center justify-between text-xs font-bold p-2 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: s.color }}
                      />
                      <span className="text-gray-600 truncate max-w-[120px]">
                        {s.nombre}
                      </span>
                    </div>
                    <span className="text-gray-900">{s.percentage}%</span>
                  </div>
                ),
            )}
          </div>
        </section>

        {/* PANEL DERECHO: TARJETAS CON GRÁFICOS INDIVIDUALES */}
        <section className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
            {situaciones.map((sit) => (
              <StatusCard key={sit.id} situation={sit} total={total} />
            ))}
            {situaciones.length === 0 && (
              <div className="col-span-2 text-center text-gray-500 py-10 font-bold">
                No hay situaciones registradas en el catálogo.
              </div>
            )}
          </div>

          {/* SECCIÓN DE INSIGHTS (TOQUE PRO) */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-200 flex items-center gap-6 overflow-hidden relative">
              <TrendingUp className="w-20 h-20 text-blue-500 absolute -right-4 -bottom-4 rotate-12 opacity-50" />
              <div className="bg-white/20 p-4 rounded-xl shrink-0">
                <Activity className="w-8 h-8 text-white" />
              </div>
              <div className="z-10">
                <h4 className="font-bold text-lg">Resumen de Operatividad</h4>
                <p className="text-blue-100 text-sm max-w-md mt-1">
                  Mantienes <span className="font-bold">{total}</span> trámites
                  activos en el sistema actualmente. Los datos se actualizan en
                  tiempo real desde la base de datos local.
                </p>
              </div>
            </div>

            {/* BOTÓN DE REPORTE PDF (ESTÉTICO) */}
            <div className="flex justify-end">
              <button
                onClick={() => generateSituacionesReport()}
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

function StatusCard({ situation, total }: { situation: any; total: number }) {
  const percentage = total > 0 ? (situation.count / total) * 100 : 0;
  const strokeDasharray = `${percentage}, 100`;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 flex items-center justify-between shadow-sm hover:border-blue-300 transition-all group">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div
            className="p-2.5 rounded-xl text-white shadow-md shrink-0"
            style={{ backgroundColor: situation.color }}
          >
            <Tag size={18} />
          </div>
          <div>
            <h3
              className="font-bold text-gray-900 leading-tight line-clamp-1"
              title={situation.nombre}
            >
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
      <div className="relative w-20 h-20 shrink-0">
        <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
          <path
            className="text-gray-100"
            stroke="currentColor"
            strokeWidth="3.8"
            fill="none"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          {percentage > 0 && (
            <path
              stroke={situation.color}
              strokeDasharray={strokeDasharray}
              strokeLinecap="round"
              strokeWidth="3.8"
              fill="none"
              className="transition-all duration-1000 ease-out"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          )}
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
