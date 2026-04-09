import React, { useEffect, useState } from "react";
import { AlertCircle, Monitor, ChevronRight, ArrowUpRight } from "lucide-react";
import { useNavigate } from "react-router";
import Database from "@tauri-apps/plugin-sql";
import { useConflictosLogic } from "../../logic/central/useConflictosLogic";

export function CentralPage() {
  const navigate = useNavigate();
  const { conflictCount, loadConflictCount } = useConflictosLogic();
  const [deviceCount, setDeviceCount] = useState(0);

  useEffect(() => {
    loadConflictCount();

    const loadDeviceCount = async () => {
      try {
        const sqlite = await Database.load("sqlite:valeska.db");
        const res: any[] = await sqlite.select(
          "SELECT COUNT(id) as count FROM dispositivos WHERE deleted_at IS NULL",
        );
        setDeviceCount(res[0]?.count || 0);
      } catch (error) {
        console.error("Error cargando dispositivos:", error);
      }
    };
    loadDeviceCount();
  }, [loadConflictCount]);

  const modules = [
    {
      id: "conflictos",
      icon: AlertCircle,
      title: "Gestión de Conflictos",
      description:
        "Resolución de discrepancias de datos entre sucursales y la nube.",
      count: conflictCount,
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
      count: deviceCount,
      path: "/central/devices",
      color: "bg-emerald-600",
      lightColor: "bg-emerald-50",
      textColor: "text-emerald-600",
    },
  ];

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 bg-[#F6F7FB] min-h-screen">
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-[#111827] tracking-tight">
            Central Command
          </h1>
          <p className="text-lg text-[#6B7280] font-medium">
            Centro de control y sincronización de sistema
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((module) => (
          <button
            key={module.id}
            onClick={() => navigate(module.path)}
            className="group relative bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-gray-50 to-transparent rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />

            <div className="flex justify-between items-start mb-8 relative z-10">
              <div
                className={`p-4 rounded-xl ${module.lightColor} ${module.textColor}`}
              >
                <module.icon size={28} strokeWidth={2.5} />
              </div>
              <div className="flex flex-col items-end">
                <span
                  className={`text-3xl font-black ${module.textColor} tracking-tighter`}
                >
                  {module.count}
                </span>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                  Registros
                </span>
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
    </div>
  );
}
