import { Radio, AlertCircle, FileText, Monitor, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router";

export function CentralPage() {
  const navigate = useNavigate();

  const modules = [
    {
      icon: AlertCircle,
      title: "Conflictos",
      description: "Resolver conflictos de sincronización",
      count: 1,
      path: "/central/conflictos",
      color: "bg-[#DC2626]",
    },
    {
      icon: FileText,
      title: "Plantillas",
      description: "Gestión de plantillas de documentos",
      count: 12,
      path: "/central/templates",
      color: "bg-[#2563EB]",
    },
    {
      icon: Monitor,
      title: "Dispositivos",
      description: "Monitor de dispositivos conectados",
      count: 5,
      path: "/central/devices",
      color: "bg-[#16A34A]",
    },
    {
      icon: BarChart3,
      title: "Reportes",
      description: "Reportes y analíticas centrales",
      count: 0,
      path: "/central/reports",
      color: "bg-[#F59E0B]",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Radio className="w-6 h-6 text-[#2563EB]" />
          <h1 className="text-2xl font-semibold text-[#111827]">Admin Central</h1>
        </div>
        <p className="text-sm text-[#6B7280]">
          Panel de administración central del sistema
        </p>
      </div>

      <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg p-4">
        <p className="text-sm text-[#1E40AF]">
          <strong>Nota:</strong> Este módulo solo está disponible para usuarios con rol Admin Central.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {modules.map((module) => (
          <button
            key={module.path}
            onClick={() => navigate(module.path)}
            className="bg-white rounded-lg border border-[#E5E7EB] p-6 hover:shadow-md transition-shadow text-left"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`${module.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                <module.icon className="w-6 h-6 text-white" />
              </div>
              {module.count > 0 && (
                <span className="px-2 py-1 bg-[#FEE2E2] text-[#DC2626] text-xs font-medium rounded">
                  {module.count}
                </span>
              )}
            </div>
            <h3 className="text-lg font-semibold text-[#111827] mb-2">
              {module.title}
            </h3>
            <p className="text-sm text-[#6B7280]">{module.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
