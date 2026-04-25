import React, { useRef, useState, useEffect } from "react";
import {
  FileText,
  Users,
  AlertCircle,
  TrendingUp,
  Plus,
  FileCode,
  RefreshCw,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router";
import { useDashboardLogic } from "../logic/dashboard/useDashboardLogic";
import { toast } from "sonner";
import { importarPipeline } from "../logic/dashboard/inyectorDataLogic";

export function DashboardPage() {
  const navigate = useNavigate();
  const {
    stats: dbStats,
    recentTramites,
    syncStats,
    isLoading,
    refreshData,
  } = useDashboardLogic();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const [isInjectionModalOpen, setIsInjectionModalOpen] = useState(false);
  const [injectionProgress, setInjectionProgress] = useState(0);
  const [injectionStatus, setInjectionStatus] = useState<
    "loading" | "success" | "warning" | "error"
  >("loading");
  const [injectionLogs, setInjectionLogs] = useState<string[]>([]);

  // Guardamos el desglose de errores completo para mostrarlo en el UI
  const [injectionSummary, setInjectionSummary] = useState<{
    exitosos: number;
    totalErrores: number;
    detalles: any;
  } | null>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [injectionLogs]);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setInjectionLogs((prev) => [...prev, `[${time}] ${msg}`]);
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setInjectionProgress(0);
    setInjectionLogs([]);
    setInjectionSummary(null);
    setInjectionStatus("loading");
    setIsInjectionModalOpen(true);

    addLog(`Analizando archivo: ${file.name}...`);
    addLog("Inicializando conexión con la base de datos local...");

    try {
      const resultado = await importarPipeline(file, (progreso) => {
        setInjectionProgress(progreso);
        if (progreso === 10)
          addLog("Validando y limpiando estructura del documento...");
        if (progreso === 50)
          addLog("Guardando lotes de registros verificados...");
        if (progreso === 90) addLog("Sincronizando entidades relacionadas...");
      });

      const { errores } = resultado;
      const totalErrores =
        errores.duplicadosChasis.length +
        errores.duplicadosMotor.length +
        errores.duplicadosBDChasis.length +
        errores.duplicadosBDMotor.length +
        errores.otros.length;

      setInjectionSummary({
        exitosos: resultado.exitosos,
        totalErrores,
        detalles: errores,
      });

      if (resultado.exitosos > 0 && totalErrores === 0) {
        setInjectionStatus("success");
        addLog(
          `¡Operación completada! ${resultado.exitosos} trámites nuevos guardados.`,
        );
        toast.success(`Inyección exitosa de ${resultado.exitosos} trámites.`);
        refreshData();
      } else if (resultado.exitosos > 0 && totalErrores > 0) {
        setInjectionStatus("warning");
        addLog(
          `Inyección parcial. Exitosos: ${resultado.exitosos} | Omitidos: ${totalErrores}`,
        );
        toast.warning(
          `Completado: ${resultado.exitosos} guardados, ${totalErrores} filas omitidas. Verifica el reporte en pantalla.`,
        );
        refreshData();
      } else {
        setInjectionStatus("error");
        addLog(
          "El archivo fue procesado, pero todas las filas fueron omitidas debido a errores.",
        );
        toast.error("Atención: Ningún registro pudo ser importado.");
      }
    } catch (error: any) {
      console.error("Error crítico durante la inyección:", error);
      setInjectionStatus("error");

      let errorMsg = "Ocurrió un error interno al procesar el archivo Excel.";
      if (
        error.message === "Sesión no encontrada" ||
        error.message === "Usuario sin sucursal"
      ) {
        errorMsg = `Acceso denegado: ${error.message}`;
      }

      addLog(`[ERROR CRÍTICO] ${errorMsg}`);
      toast.error(errorMsg);
    } finally {
      event.target.value = "";
    }
  };

  const statsList = [
    {
      label: "Trámites Activos",
      value: dbStats.activos.toString(),
      icon: FileText,
      color: "bg-[#2563EB]",
    },
    {
      label: "Clientes",
      value: dbStats.clientes.toString(),
      icon: Users,
      color: "bg-[#16A34A]",
    },
    {
      label: "Pendientes",
      value: dbStats.pendientes.toString(),
      icon: AlertCircle,
      color: "bg-[#F59E0B]",
    },
    {
      label: "Completados (mes)",
      value: dbStats.completadosMes.toString(),
      icon: TrendingUp,
      color: "bg-[#0284C7]",
    },
  ];

  return (
    <div className="space-y-6 relative">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".xlsx, .xls"
        onChange={handleFileSelect}
      />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#111827]">Dashboard</h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Resumen general del sistema
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-white border border-[#E5E7EB] text-[#111827] rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-green-600" />
            <span className="hidden sm:inline">Inyectar Data</span>
          </button>

          <button
            onClick={() => navigate("/xml")}
            className="px-4 py-2 bg-white border border-[#E5E7EB] text-[#111827] rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm"
          >
            <FileCode className="w-4 h-4" />
            <span className="hidden sm:inline">Importar XML</span>
          </button>

          <button
            onClick={() => {
              refreshData();
              navigate("/sync");
            }}
            className="px-4 py-2 bg-white border border-[#E5E7EB] text-[#111827] rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm"
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
            />
            <span className="hidden sm:inline">Sincronizar</span>
          </button>

          <button
            onClick={() => navigate("/tramites/new")}
            className="px-4 py-2 bg-[#2563EB] text-white rounded-md hover:bg-[#1D4ED8] transition-colors flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Nuevo Trámite
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-[#E5E7EB] p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-medium text-[#111827]">
              Estado de Sincronización
            </h3>
            <p className="text-xs text-[#6B7280] mt-1">
              Última revisión: {syncStats.lastSync}
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-xs text-[#6B7280]">Pendientes</div>
              <div className="text-lg font-semibold text-[#111827]">
                {syncStats.pendientes}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-[#6B7280]">Conflictos</div>
              <div
                className={`text-lg font-semibold ${syncStats.conflictos > 0 ? "text-[#DC2626]" : "text-[#111827]"}`}
              >
                {syncStats.conflictos}
              </div>
            </div>

            {syncStats.pendientes === 0 && syncStats.conflictos === 0 ? (
              <button className="px-4 py-2 bg-[#16A34A] text-white rounded-md hover:bg-[#15803D] transition-colors text-sm font-medium shadow-sm">
                Todo sincronizado
              </button>
            ) : syncStats.conflictos > 0 ? (
              <button
                onClick={() => navigate("/central/conflictos")}
                className="px-4 py-2 bg-[#DC2626] text-white rounded-md hover:bg-[#B91C1C] transition-colors text-sm font-medium flex items-center gap-2 shadow-sm"
              >
                <AlertTriangle className="w-4 h-4" />
                Resolver Conflictos
              </button>
            ) : (
              <button
                onClick={() => navigate("/sync")}
                className="px-4 py-2 bg-[#F59E0B] text-white rounded-md hover:bg-[#D97706] transition-colors text-sm font-medium flex items-center gap-2 shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Sincronizar Pendientes
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsList.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-lg border border-[#E5E7EB] p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#6B7280]">{stat.label}</p>
                <p className="text-3xl font-semibold text-[#111827] mt-2">
                  {isLoading ? "-" : stat.value}
                </p>
              </div>
              <div
                className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center shadow-inner`}
              >
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[#E5E7EB]">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#111827]">
              Trámites Recientes
            </h2>
            <button
              onClick={() => navigate("/tramites")}
              className="text-sm text-[#2563EB] hover:underline font-medium"
            >
              Ver todos
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider">
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider">
                  Situación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-[#6B7280] uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[#E5E7EB]">
              {recentTramites.length === 0 && !isLoading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-sm text-[#6B7280]"
                  >
                    No hay trámites registrados.
                  </td>
                </tr>
              ) : (
                recentTramites.map((tramite) => (
                  <tr
                    key={tramite.id}
                    className="hover:bg-[#F9FAFB] cursor-pointer transition-colors"
                    onClick={() => navigate(`/tramites/${tramite.id}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#111827]">
                      {tramite.codigo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#111827]">
                      {tramite.cliente}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                          tramite.status === "success"
                            ? "bg-[#DCFCE7] text-[#16A34A]"
                            : tramite.status === "conflict"
                              ? "bg-[#FEE2E2] text-[#DC2626]"
                              : "bg-[#DBEAFE] text-[#2563EB]"
                        }`}
                      >
                        {tramite.situacion}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#6B7280]">
                      {tramite.fecha}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#2563EB] text-right">
                      <button className="hover:underline font-medium">
                        Ver detalles
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE INYECCIÓN DE DATOS */}
      {isInjectionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-[#E5E7EB]">
              <h2 className="text-xl font-semibold text-[#111827] flex items-center gap-2">
                <FileSpreadsheet className="w-6 h-6 text-green-600" />
                Reporte de Importación
              </h2>
            </div>

            <div className="p-6 space-y-6 flex-1 max-h-[70vh] overflow-y-auto">
              <div className="flex items-center gap-3">
                {injectionStatus === "loading" && (
                  <Loader2 className="w-6 h-6 text-[#2563EB] animate-spin" />
                )}
                {injectionStatus === "success" && (
                  <CheckCircle className="w-6 h-6 text-[#16A34A]" />
                )}
                {injectionStatus === "warning" && (
                  <AlertTriangle className="w-6 h-6 text-[#F59E0B]" />
                )}
                {injectionStatus === "error" && (
                  <XCircle className="w-6 h-6 text-[#DC2626]" />
                )}
                <span className="font-medium text-[#111827] text-lg">
                  {injectionStatus === "loading"
                    ? "Procesando documento..."
                    : injectionStatus === "success"
                      ? "Importación completada sin errores"
                      : injectionStatus === "warning"
                        ? "Importación finalizada con registros omitidos"
                        : "Error en la importación"}
                </span>
              </div>

              {injectionStatus === "loading" && (
                <>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#6B7280] font-medium">
                        Progreso general
                      </span>
                      <span className="font-semibold text-[#111827]">
                        {injectionProgress}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden shadow-inner">
                      <div
                        className="h-2.5 rounded-full bg-[#2563EB] transition-all duration-300"
                        style={{ width: `${injectionProgress}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                      Registro de eventos
                    </label>
                    <div className="bg-gray-900 rounded-md p-3 h-48 overflow-y-auto font-mono text-xs text-green-400 space-y-1 shadow-inner">
                      {injectionLogs.map((log, index) => (
                        <div key={index} className="break-all">
                          {log}
                        </div>
                      ))}
                      <div ref={logsEndRef} />
                    </div>
                  </div>
                </>
              )}

              {/* INFORME EXPLICITO POST-CARGA */}
              {injectionSummary && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 grid grid-cols-2 gap-4">
                    <div className="flex flex-col border-r border-gray-200">
                      <span className="text-gray-500 text-sm font-medium">
                        Insertados Correctamente
                      </span>
                      <span className="text-[#16A34A] font-bold text-3xl">
                        {injectionSummary.exitosos}
                      </span>
                    </div>
                    <div className="flex flex-col pl-2">
                      <span className="text-gray-500 text-sm font-medium">
                        Filas Omitidas
                      </span>
                      <span
                        className={`${injectionSummary.totalErrores > 0 ? "text-[#DC2626]" : "text-[#111827]"} font-bold text-3xl`}
                      >
                        {injectionSummary.totalErrores}
                      </span>
                    </div>
                  </div>

                  {injectionSummary.totalErrores > 0 && (
                    <div className="bg-white border border-red-200 rounded-lg overflow-hidden">
                      <div className="bg-red-50 px-4 py-3 border-b border-red-200">
                        <h4 className="text-sm font-semibold text-red-700 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          Atención a los Operadores: Corrige estas filas en el
                          Excel
                        </h4>
                      </div>
                      <div className="p-4 space-y-3 text-sm text-gray-700 max-h-64 overflow-y-auto">
                        {injectionSummary.detalles.otros?.length > 0 && (
                          <div>
                            <span className="font-semibold text-red-600 block mb-1">
                              • Datos Faltantes (Falta DNI, Cliente, Trámite o
                              Estado):
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {injectionSummary.detalles.otros.map(
                                (f: number) => (
                                  <span
                                    key={f}
                                    className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium border border-red-200"
                                  >
                                    Fila {f}
                                  </span>
                                ),
                              )}
                            </div>
                          </div>
                        )}

                        {injectionSummary.detalles.duplicadosChasis?.length >
                          0 && (
                          <div className="pt-2">
                            <span className="font-semibold text-amber-600 block mb-1">
                              • Chasis Repetido (Dentro del mismo Excel):
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {injectionSummary.detalles.duplicadosChasis.map(
                                (f: number) => (
                                  <span
                                    key={f}
                                    className="px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs font-medium border border-amber-200"
                                  >
                                    Fila {f}
                                  </span>
                                ),
                              )}
                            </div>
                          </div>
                        )}

                        {injectionSummary.detalles.duplicadosBDChasis?.length >
                          0 && (
                          <div className="pt-2">
                            <span className="font-semibold text-amber-600 block mb-1">
                              • El Vehículo ya existe (Chasis encontrado en Base
                              de Datos):
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {injectionSummary.detalles.duplicadosBDChasis.map(
                                (f: number) => (
                                  <span
                                    key={f}
                                    className="px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs font-medium border border-amber-200"
                                  >
                                    Fila {f}
                                  </span>
                                ),
                              )}
                            </div>
                          </div>
                        )}

                        {injectionSummary.detalles.duplicadosMotor?.length >
                          0 && (
                          <div className="pt-2">
                            <span className="font-semibold text-orange-500 block mb-1">
                              • Motor Repetido (Dentro del mismo Excel):
                            </span>
                            <p className="text-xs text-gray-600 leading-relaxed">
                              Filas:{" "}
                              {injectionSummary.detalles.duplicadosMotor.join(
                                ", ",
                              )}
                            </p>
                          </div>
                        )}

                        {injectionSummary.detalles.duplicadosBDMotor?.length >
                          0 && (
                          <div className="pt-2">
                            <span className="font-semibold text-orange-500 block mb-1">
                              • El Motor ya existe en la Base de Datos:
                            </span>
                            <p className="text-xs text-gray-600 leading-relaxed">
                              Filas:{" "}
                              {injectionSummary.detalles.duplicadosBDMotor.join(
                                ", ",
                              )}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-[#E5E7EB] bg-gray-50 flex justify-end">
              <button
                onClick={() => setIsInjectionModalOpen(false)}
                disabled={injectionStatus === "loading"}
                className="px-6 py-2 bg-white border border-[#E5E7EB] text-[#111827] rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm"
              >
                Cerrar Reporte
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
