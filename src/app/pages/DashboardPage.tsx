import React from "react";
import {
  FileText,
  Users,
  AlertCircle,
  TrendingUp,
  Plus,
  FileCode,
  RefreshCw,
  AlertTriangle, // <- Añadido para el botón de conflictos
} from "lucide-react";
import { useNavigate } from "react-router";
import { useDashboardLogic } from "../logic/dashboard/useDashboardLogic";

export function DashboardPage() {
  const navigate = useNavigate();
  const {
    stats: dbStats,
    recentTramites,
    syncStats,
    isLoading,
    refreshData,
  } = useDashboardLogic();

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#111827]">Dashboard</h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Resumen general del sistema
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => navigate("/xml")}
            className="px-4 py-2 bg-white border border-[#E5E7EB] text-[#111827] rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <FileCode className="w-4 h-4" />
            <span className="hidden sm:inline">Importar XML</span>
          </button>
          <button
            onClick={() => {
              refreshData(); // Refresca el dashboard
              navigate("/sync");
            }}
            className="px-4 py-2 bg-white border border-[#E5E7EB] text-[#111827] rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
            />
            <span className="hidden sm:inline">Sincronizar</span>
          </button>
          <button
            onClick={() => navigate("/tramites/new")}
            className="px-4 py-2 bg-[#2563EB] text-white rounded-md hover:bg-[#1D4ED8] transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nuevo Trámite
          </button>
        </div>
      </div>

      {/* Sync Status Widget */}
      <div className="bg-white rounded-lg border border-[#E5E7EB] p-6">
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

            {/* Lógica dinámica del botón de acción */}
            {syncStats.pendientes === 0 && syncStats.conflictos === 0 ? (
              <button className="px-4 py-2 bg-[#16A34A] text-white rounded-md hover:bg-[#15803D] transition-colors text-sm font-medium">
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

      {/* Stats Grid */}
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
                className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center`}
              >
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Tramites */}
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
    </div>
  );
}
