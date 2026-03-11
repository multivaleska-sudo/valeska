import { ArrowLeft, Lock } from "lucide-react";
import { useNavigate, useParams } from "react-router";

export function ResolveConflictPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/central/conflictos")}
          className="p-2 hover:bg-white rounded-md transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[#6B7280]" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-[#111827]">
            Resolver Conflicto - {id}
          </h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Selección campo por campo
          </p>
        </div>
      </div>

      {/* Lock Banner */}
      <div className="bg-[#FEF3C7] border border-[#FDE047] rounded-lg p-4 flex items-start gap-3">
        <Lock className="w-5 h-5 text-[#92400E] shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-[#92400E]">
            Registro bloqueado para resolución
          </h3>
          <p className="text-sm text-[#92400E] mt-1">
            TTL: 15 minutos • Tu sesión: Admin Central
          </p>
        </div>
      </div>

      {/* Field-by-field comparison */}
      <div className="bg-white rounded-lg border border-[#E5E7EB] p-6">
        <h2 className="text-lg font-semibold text-[#111827] mb-4">
          Selección de Valores
        </h2>
        <div className="space-y-4">
          <div className="border border-[#E5E7EB] rounded-lg p-4">
            <h3 className="text-sm font-medium text-[#111827] mb-3">Placa</h3>
            <div className="grid grid-cols-2 gap-3">
              <button className="p-3 border-2 border-[#2563EB] bg-[#EFF6FF] rounded-md text-left">
                <div className="text-xs text-[#6B7280] mb-1">Valor Local</div>
                <div className="text-sm font-medium text-[#111827] font-mono">
                  ABC-123
                </div>
              </button>
              <button className="p-3 border border-[#E5E7EB] rounded-md text-left hover:border-[#2563EB]">
                <div className="text-xs text-[#6B7280] mb-1">Valor Remoto</div>
                <div className="text-sm font-medium text-[#111827] font-mono">
                  ABC-124
                </div>
              </button>
            </div>
          </div>
        </div>
        <button className="w-full mt-6 px-4 py-2 bg-[#2563EB] text-white rounded-md hover:bg-[#1D4ED8] transition-colors">
          Resolver y Publicar
        </button>
      </div>
    </div>
  );
}
