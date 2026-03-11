import {
  Radio,
  AlertCircle,
  Monitor,
  ChevronRight,
  ShieldAlert,
  Activity,
  ArrowUpRight,
} from "lucide-react";
import { useNavigate } from "react-router";

export function CentralPage() {
  const navigate = useNavigate();

  const modules = [
    {
      id: "conflictos",
      icon: AlertCircle,
      title: "Gestión de Conflictos",
      description:
        "Resolución de discrepancias de datos entre sucursales y la nube.",
      count: 1,
      path: "/central/conflictos",
      color: "bg-red-600",
      lightColor: "bg-red-50",
      textColor: "text-red-600",
    },
    {
      id: "dispositivos",
      icon: Monitor,
      title: "Monitor de Instancias",
      description:
        "Estado de conexión y sincronización de todas las terminales activas.",
      count: 5,
      path: "/central/devices",
      color: "bg-emerald-600",
      lightColor: "bg-emerald-50",
      textColor: "text-emerald-600",
    },
  ];

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 bg-[#F6F7FB] min-h-screen pb-20">
      {/* BANNER DE RESTRICCIÓN (UI MEJORADA) */}
      <div className="bg-blue-50 border border-blue-100 p-5 rounded-[2rem] flex items-start gap-5 shadow-sm">
        <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg shadow-blue-200">
          <ShieldAlert size={24} />
        </div>
        <div>
          <p className="text-xs font-black text-blue-900 uppercase tracking-[0.2em] mb-1">
            Acceso de Nivel Central
          </p>
          <p className="text-xs text-blue-700 font-bold leading-relaxed max-w-2xl">
            Este panel permite la administración global del ecosistema Valeska.
            Las acciones realizadas aquí afectan la integridad de los datos en
            todas las sucursales conectadas. Solo disponible para roles de{" "}
            <strong>Admin Central</strong>.
          </p>
        </div>
      </div>

      {/* HEADER DE MÓDULO */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 pb-8">
        <div>
          <h1 className="text-3xl font-black text-[#111827] tracking-tighter flex items-center gap-3 uppercase">
            <Radio className="text-[#2563EB] animate-pulse" /> Panel de Control
            Maestro
          </h1>
          <p className="text-sm text-[#6B7280] mt-1 font-bold">
            Supervisión técnica y conciliación de datos del sistema.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-gray-200 shadow-sm">
          <Activity size={16} className="text-emerald-500" />
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
            Red: Sincronizada
          </span>
        </div>
      </div>

      {/* GRID DE MÓDULOS FILTRADOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {modules.map((module) => (
          <button
            key={module.id}
            onClick={() => navigate(module.path)}
            className="group bg-white rounded-[3rem] border border-gray-100 p-10 hover:shadow-2xl hover:shadow-blue-900/5 transition-all duration-500 text-left relative overflow-hidden active:scale-[0.98]"
          >
            <div
              className={`absolute -right-10 -top-10 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500 ${module.textColor}`}
            >
              <module.icon size={250} />
            </div>

            <div className="flex items-start justify-between mb-8 relative z-10">
              <div
                className={`${module.color} w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-blue-200 group-hover:scale-110 transition-transform duration-500`}
              >
                <module.icon className="w-8 h-8 text-white" />
              </div>

              <div className="flex flex-col items-end gap-2">
                {module.count > 0 && (
                  <span
                    className={`px-4 py-1 ${module.lightColor} ${module.textColor} text-[10px] font-black rounded-full uppercase tracking-widest border border-current/20`}
                  >
                    {module.count}{" "}
                    {module.id === "conflictos" ? "Pendiente" : "Activos"}
                  </span>
                )}
                <div className="p-2 bg-gray-50 rounded-xl text-gray-300 group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <ArrowUpRight size={20} />
                </div>
              </div>
            </div>

            <div className="space-y-3 relative z-10">
              <h3 className="text-2xl font-black text-[#111827] tracking-tight uppercase group-hover:text-blue-600 transition-colors">
                {module.title}
              </h3>
              <p className="text-sm text-[#6B7280] font-bold leading-relaxed max-w-[280px]">
                {module.description}
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-50 flex items-center justify-between relative z-10">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                Ingresar al módulo
              </span>
              <ChevronRight
                size={16}
                className="text-gray-300 group-hover:translate-x-1 transition-transform"
              />
            </div>
          </button>
        ))}
      </div>

      {/* FOOTER DE ESTADO */}
      <div className="flex justify-center pt-12 opacity-30">
        <div className="flex items-center gap-4">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
          <span className="text-[10px] font-black uppercase tracking-[0.4em]">
            Valeska Central
          </span>
          <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
        </div>
      </div>
    </div>
  );
}
