import { ArrowLeft, FileText, Lock, Upload } from "lucide-react";
import { useNavigate } from "react-router";

export function TemplateManagerPage() {
  const navigate = useNavigate();

  const templates = [
    { id: 1, name: "SUNARP A", versions: 3, current: "1.2.0", locked: false },
    { id: 2, name: "SUNARP B", versions: 2, current: "1.1.5", locked: false },
    { id: 3, name: "R estricto", versions: 4, current: "2.0.0", locked: true, lockedBy: "Admin 2" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/central")}
          className="p-2 hover:bg-white rounded-md transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[#6B7280]" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-[#111827]">
            Gestión de Plantillas
          </h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Administrar plantillas de documentos
          </p>
        </div>
        <button
          onClick={() => navigate("/central/calibration")}
          className="px-4 py-2 bg-[#2563EB] text-white rounded-md hover:bg-[#1D4ED8] transition-colors"
        >
          Calibración de Impresoras
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Templates List */}
        <div className="bg-white rounded-lg border border-[#E5E7EB]">
          <div className="p-4 border-b border-[#E5E7EB]">
            <h2 className="font-semibold text-[#111827]">Plantillas</h2>
          </div>
          <div className="divide-y divide-[#E5E7EB]">
            {templates.map((template) => (
              <div
                key={template.id}
                className="p-4 hover:bg-[#F9FAFB] cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-[#111827]">
                    {template.name}
                  </h3>
                  {template.locked && (
                    <Lock className="w-4 h-4 text-[#F59E0B]" />
                  )}
                </div>
                <p className="text-xs text-[#6B7280]">
                  {template.versions} versiones • v{template.current}
                </p>
                {template.locked && (
                  <p className="text-xs text-[#F59E0B] mt-1">
                    Bloqueado por {template.lockedBy}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Versions */}
        <div className="bg-white rounded-lg border border-[#E5E7EB]">
          <div className="p-4 border-b border-[#E5E7EB]">
            <h2 className="font-semibold text-[#111827]">Versiones</h2>
          </div>
          <div className="p-4 text-center text-sm text-[#6B7280]">
            Selecciona una plantilla
          </div>
        </div>

        {/* Detail */}
        <div className="bg-white rounded-lg border border-[#E5E7EB]">
          <div className="p-4 border-b border-[#E5E7EB]">
            <h2 className="font-semibold text-[#111827]">Detalle</h2>
          </div>
          <div className="p-4 text-center text-sm text-[#6B7280]">
            Selecciona una versión
          </div>
        </div>
      </div>
    </div>
  );
}
