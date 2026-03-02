import { useState } from "react";
import { useNavigate } from "react-router";
import { Search, Filter, Plus, MoreVertical, Eye, FileText, Trash2 } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

export function TramitesListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const tramites = [
    { id: "T-2024-0345", codigo: "T-2024-0345", cliente: "Juan Pérez García", vehiculo: "ABC-123", situacion: "En proceso", fecha: "2024-03-01", sucursal: "Principal", conflicto: false },
    { id: "T-2024-0346", codigo: "T-2024-0346", cliente: "María López Ruiz", vehiculo: "DEF-456", situacion: "Documentación", fecha: "2024-03-01", sucursal: "Principal", conflicto: false },
    { id: "T-2024-0347", codigo: "T-2024-0347", cliente: "Carlos Mendoza", vehiculo: "GHI-789", situacion: "Entregado", fecha: "2024-02-28", sucursal: "Sucursal 2", conflicto: false },
    { id: "T-2024-0348", codigo: "T-2024-0348", cliente: "Ana Torres", vehiculo: "JKL-012", situacion: "Pendiente", fecha: "2024-02-28", sucursal: "Principal", conflicto: true },
    { id: "T-2024-0349", codigo: "T-2024-0349", cliente: "Luis Ramírez", vehiculo: "MNO-345", situacion: "En proceso", fecha: "2024-02-27", sucursal: "Principal", conflicto: false },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#111827]">Trámites</h1>
          <p className="text-sm text-[#6B7280] mt-1">Gestión de trámites vehiculares</p>
        </div>
        <button
          onClick={() => navigate("/tramites/new")}
          className="px-4 py-2 bg-[#2563EB] text-white rounded-md hover:bg-[#1D4ED8] transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nuevo Trámite
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-lg border border-[#E5E7EB] p-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por código, cliente, vehículo..."
              className="w-full pl-10 pr-4 py-2 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            />
          </div>
          <button className="px-4 py-2 bg-white border border-[#E5E7EB] text-[#111827] rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filtros
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-[#E5E7EB] overflow-hidden">
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
                  Vehículo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider">
                  Situación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider">
                  Sucursal
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-[#6B7280] uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[#E5E7EB]">
              {tramites.map((tramite) => (
                <tr
                  key={tramite.id}
                  className="hover:bg-[#F9FAFB] transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[#111827]">
                        {tramite.codigo}
                      </span>
                      {tramite.conflicto && (
                        <span className="px-2 py-0.5 bg-[#FEE2E2] text-[#DC2626] text-xs font-medium rounded">
                          Conflicto
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#111827]">
                    {tramite.cliente}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#111827] font-mono">
                    {tramite.vehiculo}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-[#DBEAFE] text-[#2563EB]">
                      {tramite.situacion}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#6B7280]">
                    {tramite.fecha}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#6B7280]">
                    {tramite.sucursal}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <DropdownMenu.Root>
                      <DropdownMenu.Trigger asChild>
                        <button className="p-1 hover:bg-gray-100 rounded">
                          <MoreVertical className="w-5 h-5 text-[#6B7280]" />
                        </button>
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Portal>
                        <DropdownMenu.Content
                          className="bg-white rounded-lg shadow-lg border border-[#E5E7EB] p-1 min-w-[180px] z-50"
                          align="end"
                        >
                          <DropdownMenu.Item
                            className="flex items-center gap-2 px-3 py-2 text-sm text-[#111827] rounded-md hover:bg-gray-100 cursor-pointer outline-none"
                            onSelect={() => navigate(`/tramites/${tramite.id}`)}
                          >
                            <Eye className="w-4 h-4" />
                            Ver detalle
                          </DropdownMenu.Item>
                          <DropdownMenu.Item
                            className="flex items-center gap-2 px-3 py-2 text-sm text-[#111827] rounded-md hover:bg-gray-100 cursor-pointer outline-none"
                            onSelect={() => navigate(`/tramites/${tramite.id}/documents`)}
                          >
                            <FileText className="w-4 h-4" />
                            Documentos
                          </DropdownMenu.Item>
                          <DropdownMenu.Separator className="h-px bg-[#E5E7EB] my-1" />
                          <DropdownMenu.Item
                            className="flex items-center gap-2 px-3 py-2 text-sm text-[#DC2626] rounded-md hover:bg-red-50 cursor-pointer outline-none"
                          >
                            <Trash2 className="w-4 h-4" />
                            Eliminar
                          </DropdownMenu.Item>
                        </DropdownMenu.Content>
                      </DropdownMenu.Portal>
                    </DropdownMenu.Root>
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
