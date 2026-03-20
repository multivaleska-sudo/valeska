import {
  RefreshCw,
  Cloud,
  AlertTriangle,
  CheckCircle2,
  Clock,
  CloudOff,
  Loader2,
  Monitor,
  User,
  ArrowDownToLine,
  ArrowUpFromLine,
} from "lucide-react";
import { useSyncLogic } from "../logic/sync/useSyncLogic";

export function SyncPage() {
  const {
    isSyncing,
    lastSyncTime,
    syncError,
    syncStats,
    syncHistory,
    triggerSync,
  } = useSyncLogic();

  const totalPushed =
    (syncStats?.push?.sucursales || 0) +
    (syncStats?.push?.dispositivos || 0) +
    (syncStats?.push?.usuarios || 0);
  const totalPulled =
    (syncStats?.pull?.sucursales || 0) +
    (syncStats?.pull?.dispositivos || 0) +
    (syncStats?.pull?.usuarios || 0);

  return (
    <div className="p-8 space-y-6 bg-[#F6F7FB] min-h-screen font-sans animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-semibold text-[#111827]">
          Sincronización
        </h1>
        <p className="text-sm text-[#6B7280] mt-1">
          Estado de sincronización con la Nube Central y gestión de conflictos
        </p>
      </div>

      {syncError && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg flex items-start gap-4 shadow-sm animate-in slide-in-from-top-2">
          <CloudOff className="text-red-600 shrink-0 mt-0.5" size={24} />
          <div>
            <h3 className="text-sm font-black text-red-800 uppercase tracking-widest">
              Error de Conexión
            </h3>
            <p className="text-xs text-red-600 font-bold mt-1">{syncError}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-[#E5E7EB] p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-[#111827]">
              Estado General
            </h2>
            <p className="text-sm text-[#6B7280] mt-1 font-medium">
              Última sincronización exitosa:{" "}
              <span className="font-bold text-gray-800">
                {lastSyncTime || "Nunca"}
              </span>
            </p>
          </div>
          <button
            onClick={() =>
              triggerSync({
                title: "Sincronización Manual Forzada",
                details: "Solicitada por el usuario.",
              })
            }
            disabled={isSyncing}
            className={`px-5 py-2.5 rounded-md transition-colors flex items-center gap-2 font-bold shadow-sm ${isSyncing ? "bg-blue-400 text-white cursor-not-allowed" : "bg-[#2563EB] text-white hover:bg-[#1D4ED8] active:scale-95"}`}
          >
            {isSyncing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {isSyncing ? "Sincronizando..." : "Re-sync total"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg p-4">
            <div className="flex items-center gap-3">
              <ArrowUpFromLine className="w-8 h-8 text-[#2563EB]" />
              <div>
                <div className="text-xs font-bold text-[#1E40AF] uppercase tracking-wider">
                  Último Push (Subida)
                </div>
                <div className="text-sm font-black text-[#1E3A8A] mt-0.5">
                  {lastSyncTime
                    ? `${totalPushed} registros enviados`
                    : "Sin datos"}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#DCFCE7] border border-[#86EFAC] rounded-lg p-4">
            <div className="flex items-center gap-3">
              <ArrowDownToLine className="w-8 h-8 text-[#16A34A]" />
              <div>
                <div className="text-xs font-bold text-[#15803D] uppercase tracking-wider">
                  Último Pull (Bajada)
                </div>
                <div className="text-sm font-black text-[#166534] mt-0.5">
                  {lastSyncTime
                    ? `${totalPulled} registros actualizados`
                    : "Sin datos"}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#FEE2E2] border border-[#FCA5A5] rounded-lg p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle
                className={`w-8 h-8 ${syncError ? "text-[#DC2626] animate-pulse" : "text-[#FCA5A5]"}`}
              />
              <div>
                <div className="text-xs font-bold text-[#991B1B] uppercase tracking-wider">
                  Conflictos
                </div>
                <div
                  className={`text-sm font-black mt-0.5 ${syncError ? "text-[#7F1D1D]" : "text-[#FCA5A5]"}`}
                >
                  {syncError ? "1 Error Crítico" : "0 pendientes"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[#E5E7EB] bg-gray-50/50 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-[#111827]">
            Bitácora de Auditoría (Local)
          </h2>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
            {syncHistory.length} Registros
          </span>
        </div>
        <div className="divide-y divide-[#E5E7EB] max-h-[400px] overflow-y-auto">
          {syncHistory.length === 0 ? (
            <div className="p-8 text-center text-gray-500 font-medium">
              No hay registros recientes en este dispositivo.
            </div>
          ) : (
            syncHistory.map((log) => (
              <div
                key={log.id}
                className="p-4 flex items-center justify-between hover:bg-blue-50/50 transition-colors group"
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    {log.status === "COMPLETED" ? (
                      <CheckCircle2 className="w-5 h-5 text-[#16A34A]" />
                    ) : log.status === "ERROR" ? (
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                    ) : (
                      <Clock className="w-5 h-5 text-[#F59E0B]" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#111827] flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black tracking-widest uppercase ${log.type === "SYNC" ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-700"}`}
                      >
                        {log.type}
                      </span>
                      {log.title}
                    </h3>
                    <p className="text-xs font-medium text-[#6B7280] mt-1.5 flex items-center gap-3">
                      <span className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                        <Monitor size={12} /> {log.machine}
                      </span>
                      <span className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                        <User size={12} /> {log.user}
                      </span>
                    </p>
                    <p className="text-xs font-bold text-gray-400 mt-1.5">
                      Detalle: {log.details}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span
                    className={`text-[10px] font-black px-2 py-1 rounded uppercase tracking-wider border ${log.status === "COMPLETED" ? "bg-[#DCFCE7] text-[#16A34A] border-green-200" : "bg-red-50 text-red-600 border-red-200"}`}
                  >
                    {log.status === "COMPLETED" ? "Exitoso" : "Fallido"}
                  </span>
                  <span className="text-[10px] text-gray-400 font-bold">
                    {log.timestamp.split(",")[0]} a las{" "}
                    {log.timestamp.split(",")[1]}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
