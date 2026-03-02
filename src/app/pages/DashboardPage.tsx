import { FileText, Users, AlertCircle, TrendingUp, Plus, FileCode, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router";

export function DashboardPage() {
  const navigate = useNavigate();

  const stats = [
    { label: "Trámites Activos", value: "24", icon: FileText, color: "bg-[#2563EB]" },
    { label: "Clientes", value: "156", icon: Users, color: "bg-[#16A34A]" },
    { label: "Pendientes", value: "8", icon: AlertCircle, color: "bg-[#F59E0B]" },
    { label: "Completados (mes)", value: "42", icon: TrendingUp, color: "bg-[#0284C7]" },
  ];

  const recentTramites = [
    { id: "T-2024-0345", cliente: "Juan Pérez García", situacion: "En proceso", fecha: "2024-03-01", status: "normal" },
    { id: "T-2024-0346", cliente: "María López Ruiz", situacion: "Documentación", fecha: "2024-03-01", status: "normal" },
    { id: "T-2024-0347", cliente: "Carlos Mendoza", situacion: "Entregado", fecha: "2024-02-28", status: "success" },
    { id: "T-2024-0348", cliente: "Ana Torres", situacion: "Conflicto", fecha: "2024-02-28", status: "conflict" },
    { id: "T-2024-0349", cliente: "Luis Ramírez", situacion: "En proceso", fecha: "2024-02-27", status: "normal" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#111827]">Dashboard</h1>
          <p className="text-sm text-[#6B7280] mt-1">Resumen general del sistema</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate("/xml")}
            className="px-4 py-2 bg-white border border-[#E5E7EB] text-[#111827] rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <FileCode className="w-4 h-4" />
            Importar XML
          </button>
          <button
            onClick={() => navigate("/sync")}
            className="px-4 py-2 bg-white border border-[#E5E7EB] text-[#111827] rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Sincronizar
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
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-[#111827]">Estado de Sincronización</h3>
            <p className="text-xs text-[#6B7280] mt-1">Última sincronización: hace 5 minutos</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs text-[#6B7280]">Pendientes</div>
              <div className="text-lg font-semibold text-[#111827]">3</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-[#6B7280]">Conflictos</div>
              <div className="text-lg font-semibold text-[#DC2626]">1</div>
            </div>
            <button className="px-4 py-2 bg-[#16A34A] text-white rounded-md hover:bg-[#15803D] transition-colors text-sm">
              Todo sincronizado
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg border border-[#E5E7EB] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#6B7280]">{stat.label}</p>
                <p className="text-3xl font-semibold text-[#111827] mt-2">{stat.value}</p>
              </div>
              <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Tramites */}
      <div className="bg-white rounded-lg border border-[#E5E7EB]">
        <div className="p-6 border-b border-[#E5E7EB]">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#111827]">Trámites Recientes</h2>
            <button
              onClick={() => navigate("/tramites")}
              className="text-sm text-[#2563EB] hover:underline"
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
                <th className="px-6 py-3 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[#E5E7EB]">
              {recentTramites.map((tramite) => (
                <tr
                  key={tramite.id}
                  className="hover:bg-[#F9FAFB] cursor-pointer transition-colors"
                  onClick={() => navigate(`/tramites/${tramite.id}`)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#111827]">
                    {tramite.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#111827]">
                    {tramite.cliente}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#2563EB]">
                    <button className="hover:underline">Ver detalles</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
