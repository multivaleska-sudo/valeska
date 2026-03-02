import { Plus, Tag } from "lucide-react";

export function SituacionesPage() {
  const situaciones = [
    { id: 1, nombre: "En proceso", color: "#2563EB", count: 15 },
    { id: 2, nombre: "Documentación", color: "#F59E0B", count: 8 },
    { id: 3, nombre: "Entregado", color: "#16A34A", count: 42 },
    { id: 4, nombre: "Pendiente", color: "#DC2626", count: 5 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#111827]">Situaciones</h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Gestión de estados de trámites
          </p>
        </div>
        <button className="px-4 py-2 bg-[#2563EB] text-white rounded-md hover:bg-[#1D4ED8] transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nueva Situación
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {situaciones.map((sit) => (
          <div
            key={sit.id}
            className="bg-white rounded-lg border border-[#E5E7EB] p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: sit.color }}
              >
                <Tag className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-semibold text-[#111827]">
                {sit.count}
              </span>
            </div>
            <h3 className="font-medium text-[#111827]">{sit.nombre}</h3>
          </div>
        ))}
      </div>
    </div>
  );
}
