import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  Search,
  Filter,
  Plus,
  MoreVertical,
  Eye,
  Edit3,
  Trash2,
  Calendar,
  Inbox,
  X,
} from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

// --- DATOS MOCK EXTENDIDOS PARA PRUEBAS ---
const MOCK_TRAMITES = [
  {
    id: "1",
    codigo: "TRM-2025-001",
    cliente: "Juan Pérez García",
    documento: "45789632",
    tipo: "INMATRICULACION",
    situacion: "PENDIENTE",
    fecha: "2024-05-20",
    empresa: "Valeska Central",
  },
  {
    id: "2",
    codigo: "TRM-2025-002",
    cliente: "Inversiones SAC",
    documento: "20601234567",
    tipo: "TRANSFERENCIA",
    situacion: "EN_PROCESO",
    fecha: "2024-05-21",
    empresa: "Sucursal Norte",
  },
  {
    id: "3",
    codigo: "TRM-2025-003",
    cliente: "Andrés Silva",
    documento: "70554433",
    tipo: "DUPLICADO",
    situacion: "FINALIZADO",
    fecha: "2024-05-22",
    empresa: "Valeska Central",
  },
  {
    id: "4",
    codigo: "TRM-2025-004",
    cliente: "María López Ruiz",
    documento: "12345678",
    tipo: "INMATRICULACION",
    situacion: "OBSERVADO",
    fecha: "2024-05-23",
    empresa: "Sucursal Sur",
  },
];

export function TramitesListPage() {
  const navigate = useNavigate();

  // ESTADOS DE FILTRADO
  const [search, setSearch] = useState("");
  const [filterSituacion, setFilterSituacion] = useState("");
  const [filterTipo, setFilterTipo] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // LÓGICA DE FILTRADO REACTIVO
  const filteredTramites = useMemo(() => {
    return MOCK_TRAMITES.filter((t) => {
      const matchesSearch =
        t.codigo.toLowerCase().includes(search.toLowerCase()) ||
        t.cliente.toLowerCase().includes(search.toLowerCase()) ||
        t.documento.toLowerCase().includes(search.toLowerCase());

      const matchesSituacion =
        filterSituacion === "" || t.situacion === filterSituacion;
      const matchesTipo = filterTipo === "" || t.tipo === filterTipo;

      // Filtrado por fecha (Y-m-d)
      const matchesDate =
        (!fromDate || t.fecha >= fromDate) && (!toDate || t.fecha <= toDate);

      return matchesSearch && matchesSituacion && matchesTipo && matchesDate;
    });
  }, [search, filterSituacion, filterTipo, fromDate, toDate]);

  const clearFilters = () => {
    setSearch("");
    setFilterSituacion("");
    setFilterTipo("");
    setFromDate("");
    setToDate("");
  };

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Listado de Trámites
          </h1>
          <p className="text-sm text-gray-500">
            Gestión de expedientes y estados vehiculares
          </p>
        </div>
        <button
          onClick={() => navigate("/tramites/new")}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-bold hover:bg-blue-700 transition-all shadow-md active:scale-95"
        >
          <Plus className="w-5 h-5" /> Nuevo Trámite
        </button>
      </div>

      {/* BARRA DE HERRAMIENTAS (FILTROS) */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 space-y-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-gray-50/30"
              placeholder="Buscar por N° Título, Cliente o DNI/RUC..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {(search || filterSituacion || filterTipo || fromDate || toDate) && (
            <button
              onClick={clearFilters}
              className="px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-50 rounded-lg flex items-center gap-1 transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Limpiar
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2 text-gray-400">
            <Filter className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">
              Filtros:
            </span>
          </div>

          <select
            value={filterSituacion}
            onChange={(e) => setFilterSituacion(e.target.value)}
            className="bg-white border border-gray-200 text-gray-700 text-xs rounded-lg focus:ring-2 focus:ring-blue-500 block p-2.5 outline-none cursor-pointer hover:border-gray-300 transition-colors"
          >
            <option value="">Todas las Situaciones</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="EN_PROCESO">En Proceso</option>
            <option value="OBSERVADO">Observado</option>
            <option value="FINALIZADO">Finalizado</option>
          </select>

          <select
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value)}
            className="bg-white border border-gray-200 text-gray-700 text-xs rounded-lg focus:ring-2 focus:ring-blue-500 block p-2.5 outline-none cursor-pointer hover:border-gray-300 transition-colors"
          >
            <option value="">Todos los Trámites</option>
            <option value="INMATRICULACION">Inmatriculación</option>
            <option value="TRANSFERENCIA">Transferencia</option>
            <option value="DUPLICADO">Duplicado de Placa</option>
          </select>

          {/* FILTRO DE FECHAS */}
          <div className="flex items-center gap-2 bg-gray-50/50 p-1 rounded-lg border border-gray-100">
            <div className="relative">
              <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="pl-8 pr-2 py-1.5 border-none bg-transparent text-gray-600 text-[11px] rounded-lg outline-none focus:ring-0"
              />
            </div>
            <span className="text-gray-300 font-bold text-xs uppercase">
              al
            </span>
            <div className="relative">
              <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="pl-8 pr-2 py-1.5 border-none bg-transparent text-gray-600 text-[11px] rounded-lg outline-none focus:ring-0"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <span className="text-[11px] font-medium text-gray-400 uppercase tracking-tighter">
              Resultados: {filteredTramites.length}
            </span>
          </div>
        </div>
      </div>

      {/* TABLA O ESTADO VACÍO */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {filteredTramites.length > 0 ? (
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold text-[11px] uppercase tracking-widest">
              <tr>
                <th className="px-5 py-4">N° Título</th>
                <th className="px-5 py-4">Nombre Cliente</th>
                <th className="px-5 py-4">DNI / N° Doc</th>
                <th className="px-5 py-4">Trámite</th>
                <th className="px-5 py-4">Situación</th>
                <th className="px-5 py-4">Presentación</th>
                <th className="px-5 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTramites.map((t) => (
                <tr
                  key={t.id}
                  className="hover:bg-blue-50/40 cursor-pointer transition-colors group"
                  onDoubleClick={() => navigate(`/tramites/${t.id}`)}
                >
                  <td className="px-5 py-4 font-bold text-blue-600">
                    {t.codigo}
                  </td>
                  <td className="px-5 py-4 text-gray-800 font-medium">
                    {t.cliente}
                  </td>
                  <td className="px-5 py-4 font-mono text-gray-500 text-xs">
                    {t.documento}
                  </td>
                  <td className="px-5 py-4 text-gray-600 text-xs font-semibold">
                    {t.tipo}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-tighter ${
                        t.situacion === "PENDIENTE"
                          ? "bg-amber-100 text-amber-700"
                          : t.situacion === "FINALIZADO"
                            ? "bg-green-100 text-green-700"
                            : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {t.situacion.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-gray-500 text-xs font-medium">
                    {t.fecha}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <DropdownMenu.Root>
                      <DropdownMenu.Trigger className="p-2 hover:bg-gray-100 rounded-lg outline-none transition-colors">
                        <MoreVertical className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Portal>
                        <DropdownMenu.Content className="bg-white p-1.5 rounded-xl shadow-2xl border border-gray-100 min-w-[170px] z-50 animate-in fade-in zoom-in duration-150">
                          <DropdownMenu.Item
                            onSelect={() => navigate(`/tramites/${t.id}`)}
                            className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50 outline-none cursor-pointer rounded-lg text-gray-700 font-medium"
                          >
                            <Eye className="w-4 h-4 text-blue-500" /> Ver
                            Detalle
                          </DropdownMenu.Item>
                          <DropdownMenu.Item
                            onSelect={() => navigate(`/tramites/${t.id}/edit`)}
                            className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50 outline-none cursor-pointer rounded-lg text-gray-700 font-medium"
                          >
                            <Edit3 className="w-4 h-4 text-amber-500" /> Editar
                            Registro
                          </DropdownMenu.Item>
                          <DropdownMenu.Separator className="h-px bg-gray-100 my-1.5" />
                          <DropdownMenu.Item className="flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 outline-none cursor-pointer font-bold rounded-lg">
                            <Trash2 className="w-4 h-4" /> Eliminar
                          </DropdownMenu.Item>
                        </DropdownMenu.Content>
                      </DropdownMenu.Portal>
                    </DropdownMenu.Root>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="py-20 flex flex-col items-center justify-center text-gray-400 space-y-3">
            <Inbox className="w-12 h-12 stroke-[1.5px]" />
            <div className="text-center">
              <p className="text-sm font-bold text-gray-500">
                No se encontraron trámites
              </p>
              <p className="text-xs">
                Intenta ajustar los filtros o el término de búsqueda
              </p>
            </div>
            <button
              onClick={clearFilters}
              className="text-blue-600 text-xs font-bold hover:underline pt-2"
            >
              Limpiar todos los filtros
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
