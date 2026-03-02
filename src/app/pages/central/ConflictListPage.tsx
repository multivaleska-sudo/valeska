import { ArrowLeft, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router";

export function ConflictListPage() {
  const navigate = useNavigate();

  const conflicts = [
    {
      id: "T-2024-0348",
      tramite: "T-2024-0348",
      field: "Placa",
      localValue: "ABC-123",
      remoteValue: "ABC-124",
      date: "2024-03-01 14:30",
    },
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
        <div>
          <h1 className="text-2xl font-semibold text-[#111827]">Conflictos</h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Resolver conflictos de sincronización
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-[#E5E7EB] overflow-hidden">
        <div className="divide-y divide-[#E5E7EB]">
          {conflicts.map((conflict) => (
            <div
              key={conflict.id}
              className="p-4 hover:bg-[#F9FAFB] cursor-pointer transition-colors"
              onClick={() => navigate(`/central/conflictos/${conflict.id}`)}
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-[#DC2626] shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-[#111827]">
                    Conflicto en {conflict.tramite}
                  </h3>
                  <p className="text-sm text-[#6B7280] mt-1">
                    Campo: {conflict.field} • Local: {conflict.localValue} vs Remoto: {conflict.remoteValue}
                  </p>
                  <p className="text-xs text-[#6B7280] mt-1">{conflict.date}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
