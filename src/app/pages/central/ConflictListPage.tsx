import React, { useEffect } from "react";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router";
import { useConflictosLogic } from "../../logic/central/useConflictosLogic";

export function ConflictListPage() {
  const navigate = useNavigate();
  const { conflictos, isLoading, loadConflictos } = useConflictosLogic();

  useEffect(() => {
    loadConflictos();
  }, [loadConflictos]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/central")}
          className="p-2 hover:bg-white rounded-md transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[#6B7280]" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-[#111827]">
            Conflictos Pendientes
          </h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Revisar y resolver discrepancias de sincronización
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-[#E5E7EB] overflow-hidden min-h-[300px]">
        {isLoading ? (
          <div className="p-8 text-center text-[#6B7280]">
            Cargando conflictos...
          </div>
        ) : conflictos.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-3">
              <svg
                className="w-6 h-6 text-emerald-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                ></path>
              </svg>
            </div>
            <p className="text-[#111827] font-medium text-lg">Todo al día</p>
            <p className="text-[#6B7280] text-sm">
              No existen conflictos de sincronización pendientes.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#E5E7EB]">
            {conflictos.map((conflict) => (
              <div
                key={conflict.id}
                className="p-4 hover:bg-[#F9FAFB] cursor-pointer transition-colors group"
                onClick={() => navigate(`/central/conflictos/${conflict.id}`)}
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-[#DC2626] shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className="text-sm font-medium text-[#111827] group-hover:text-[#2563EB] transition-colors">
                        {conflict.identificadorVisual}
                      </h3>
                      <span className="text-xs text-[#6B7280]">
                        {new Date(conflict.fechaConflicto).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-[#6B7280] mt-1">
                      Tabla afectada:{" "}
                      <span className="font-mono text-xs bg-gray-100 px-1 rounded">
                        {conflict.tablaAfectada}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
