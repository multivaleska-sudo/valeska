import { RefreshCw, Cloud, AlertTriangle, CheckCircle2, Clock } from "lucide-react";

export function SyncPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#111827]">Sincronización</h1>
        <p className="text-sm text-[#6B7280] mt-1">
          Estado de sincronización y gestión de conflictos
        </p>
      </div>

      {/* Sync Status */}
      <div className="bg-white rounded-lg border border-[#E5E7EB] p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-[#111827]">
              Estado General
            </h2>
            <p className="text-sm text-[#6B7280] mt-1">
              Última sincronización: hace 5 minutos
            </p>
          </div>
          <button className="px-4 py-2 bg-[#2563EB] text-white rounded-md hover:bg-[#1D4ED8] transition-colors flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Re-sync total
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Cloud className="w-8 h-8 text-[#2563EB]" />
              <div>
                <div className="text-xs text-[#1E40AF]">Último Push</div>
                <div className="text-sm font-medium text-[#1E3A8A]">
                  14:35 - 3 registros
                </div>
              </div>
            </div>
          </div>
          <div className="bg-[#DCFCE7] border border-[#86EFAC] rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Cloud className="w-8 h-8 text-[#16A34A]" />
              <div>
                <div className="text-xs text-[#15803D]">Último Pull</div>
                <div className="text-sm font-medium text-[#166534]">
                  14:30 - 1 registro
                </div>
              </div>
            </div>
          </div>
          <div className="bg-[#FEE2E2] border border-[#FCA5A5] rounded-lg p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-[#DC2626]" />
              <div>
                <div className="text-xs text-[#991B1B]">Conflictos</div>
                <div className="text-sm font-medium text-[#7F1D1D]">1 pendiente</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sync Queue */}
      <div className="bg-white rounded-lg border border-[#E5E7EB]">
        <div className="p-6 border-b border-[#E5E7EB]">
          <h2 className="text-lg font-semibold text-[#111827]">Cola de Sincronización</h2>
        </div>
        <div className="divide-y divide-[#E5E7EB]">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-[#F59E0B]" />
              <div>
                <h3 className="text-sm font-medium text-[#111827]">
                  T-2024-0350 - Modificación
                </h3>
                <p className="text-xs text-[#6B7280] mt-1">
                  Pendiente de enviar
                </p>
              </div>
            </div>
            <span className="text-xs px-2 py-1 bg-[#FEF3C7] text-[#F59E0B] rounded">
              Pendiente
            </span>
          </div>
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#16A34A]" />
              <div>
                <h3 className="text-sm font-medium text-[#111827]">
                  T-2024-0345 - Actualización
                </h3>
                <p className="text-xs text-[#6B7280] mt-1">
                  Sincronizado correctamente
                </p>
              </div>
            </div>
            <span className="text-xs px-2 py-1 bg-[#DCFCE7] text-[#16A34A] rounded">
              Completado
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
