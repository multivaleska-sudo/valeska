import React from "react";
import { useNavigate } from "react-router";
import {
  Filter,
  Plus,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileSpreadsheet,
  Loader2,
  Building2,
  Search,
  X,
} from "lucide-react";
import { useTramitesListLogic } from "../../logic/tramites/useTramitesListLogic";

export function TramitesListPage() {
  const navigate = useNavigate();
  const {
    filtros,
    paginacion,
    data,
    opcionesSituacion,
    handleExportExcel,
    isExporting,
    isLoading,
  } = useTramitesListLogic();

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans">
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* CABECERA CON ACCIONES */}
        <div className="flex justify-between items-center bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-2xl font-black text-gray-800">
              Directorio de Trámites
            </h1>
            <p className="text-sm text-gray-500 font-medium mt-1">
              Consulta, filtrado y gestión general de expedientes.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* BOTÓN EXCEL */}
            <button
              onClick={handleExportExcel}
              disabled={isExporting || data.length === 0}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm shadow-emerald-200 disabled:opacity-50"
            >
              {isExporting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <FileSpreadsheet size={18} />
              )}
              Exportar Excel
            </button>

            <button
              onClick={() => navigate("/tramites/new")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm shadow-blue-200"
            >
              <Plus size={18} /> Registrar Nuevo Trámite
            </button>
          </div>
        </div>

        {/* FILTROS ACTUALIZADOS */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4 text-gray-800">
            <Filter size={18} className="text-blue-600" />
            <h2 className="text-sm font-bold uppercase tracking-wider">
              Filtros de Búsqueda
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-gray-600 mb-1.5 uppercase">
                Fecha Inicial
              </label>
              <input
                type="date"
                value={filtros.fechaInicio}
                onChange={(e) => filtros.setFechaInicio(e.target.value)}
                className="h-10 px-3 rounded-lg border border-gray-200 text-sm focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-xs font-semibold text-gray-600 mb-1.5 uppercase">
                Fecha Final
              </label>
              <input
                type="date"
                value={filtros.fechaFin}
                onChange={(e) => filtros.setFechaFin(e.target.value)}
                className="h-10 px-3 rounded-lg border border-gray-200 text-sm focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
              />
            </div>

            <div className="flex flex-col lg:col-span-2">
              <label className="text-xs font-semibold text-gray-600 mb-1.5 uppercase">
                Nombre / Apellido Cliente
              </label>
              <input
                type="text"
                value={filtros.searchCliente}
                onChange={(e) => filtros.setSearchCliente(e.target.value)}
                placeholder="Ej. Juan Perez..."
                className="h-10 px-3 rounded-lg border border-gray-200 text-sm focus:ring-4 focus:ring-blue-500/10 outline-none uppercase font-bold"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-xs font-semibold text-gray-600 mb-1.5 uppercase">
                N° de Título
              </label>
              <input
                type="text"
                value={filtros.searchTitulo}
                onChange={(e) => filtros.setSearchTitulo(e.target.value)}
                placeholder="Ej. 2026..."
                className="h-10 px-3 rounded-lg border border-gray-200 text-sm focus:ring-4 focus:ring-blue-500/10 outline-none uppercase font-bold"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-xs font-semibold text-gray-600 mb-1.5 uppercase">
                DNI / RUC
              </label>
              <input
                type="text"
                value={filtros.searchDNI}
                onChange={(e) => filtros.setSearchDNI(e.target.value)}
                placeholder="Ej. 46654053"
                className="h-10 px-3 rounded-lg border border-gray-200 text-sm focus:ring-4 focus:ring-blue-500/10 outline-none"
              />
            </div>

            {/* FILTRO PLACA */}
            <div className="flex flex-col lg:col-span-2">
              <label className="text-xs font-semibold text-gray-600 mb-1.5 uppercase">
                N° Placa
              </label>
              <input
                type="text"
                value={filtros.searchPlaca}
                onChange={(e) => filtros.setSearchPlaca(e.target.value)}
                placeholder="Ej. ABC-123"
                className="h-10 px-3 rounded-lg border border-gray-200 text-sm focus:ring-4 focus:ring-blue-500/10 outline-none uppercase font-bold"
              />
            </div>

            <div
              ref={filtros.dropdownRef}
              className="flex flex-col lg:col-span-2 relative"
            >
              <label className="text-xs font-semibold text-gray-600 mb-1.5 uppercase flex justify-between">
                <span>Empresa Gestora</span>
                {filtros.filterEmpresa && (
                  <button
                    onClick={() => {
                      filtros.setFilterEmpresa("");
                      filtros.setInputEmpresa("");
                    }}
                    className="text-red-500"
                  >
                    <X size={12} />
                  </button>
                )}
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Escriba para buscar empresa..."
                  value={filtros.inputEmpresa}
                  onFocus={() => filtros.setShowEmpresaResults(true)}
                  onChange={(e) => {
                    filtros.setInputEmpresa(e.target.value);
                    filtros.setShowEmpresaResults(true);
                  }}
                  className={`h-10 w-full pl-9 pr-3 rounded-lg border text-sm outline-none transition-all uppercase font-bold ${filtros.filterEmpresa ? "border-emerald-500 bg-emerald-50" : "border-gray-200 focus:border-blue-500"}`}
                />
                <Building2
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                {filtros.showEmpresaResults &&
                  filtros.empresasSugeridas.length > 0 && (
                    <div className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto mt-1">
                      {filtros.empresasSugeridas.map((emp, i) => (
                        <div
                          key={i}
                          className="p-2 hover:bg-blue-50 cursor-pointer text-xs font-bold uppercase"
                          onClick={() => {
                            filtros.setFilterEmpresa(emp);
                            filtros.setInputEmpresa(emp);
                            filtros.setShowEmpresaResults(false);
                          }}
                        >
                          {emp}
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            </div>

            <div className="flex flex-col lg:col-span-2">
              <label className="text-xs font-semibold text-gray-600 mb-1.5 uppercase">
                Situación
              </label>
              <select
                value={filtros.filterSituacion}
                onChange={(e) => filtros.setFilterSituacion(e.target.value)}
                className="h-10 px-3 rounded-lg border border-gray-200 text-sm focus:ring-4 focus:ring-blue-500/10 outline-none uppercase cursor-pointer bg-white font-bold"
              >
                <option value="">TODOS LOS ESTADOS</option>
                {opcionesSituacion.map((s) => (
                  <option key={s} value={s}>
                    {s.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* TABLA: EXACTAMENTE COMO LA TENÍAS */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50/80 border-b border-gray-100">
                <tr className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <th className="p-4">ID</th>
                  <th className="p-4">N° Título</th>
                  <th className="p-4">Nombre del Cliente</th>
                  <th className="p-4">DNI</th>
                  <th className="p-4">Placa</th>
                  <th className="p-4">Trámite</th>
                  <th className="p-4">Situación</th>
                  <th className="p-4">Fecha Presentación</th>
                  <th className="p-4">Empresa que Gestiona</th>
                  <th className="p-4 text-center">Vista</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {isLoading ? (
                  <tr>
                    <td colSpan={10} className="p-10 text-center">
                      <Loader2 className="animate-spin mx-auto text-blue-600" />
                    </td>
                  </tr>
                ) : data.length > 0 ? (
                  data.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => navigate(`/tramites/${row.id}`)}
                      className="hover:bg-blue-50/50 cursor-pointer transition-colors group"
                    >
                      <td className="p-4 font-bold text-gray-500 text-xs">
                        #{row.id.substring(0, 8)}
                      </td>
                      <td className="p-4 font-bold text-blue-600 text-sm">
                        {row.n_titulo}
                      </td>
                      <td className="p-4 text-sm font-semibold text-gray-800">
                        {row.cliente}
                      </td>
                      <td className="p-4 text-sm text-gray-600">{row.dni}</td>
                      <td className="p-4 text-sm font-bold text-gray-700 bg-gray-50 uppercase tracking-widest">
                        {row.placa}
                      </td>
                      <td className="p-4 text-sm text-gray-600 uppercase">
                        {row.tramite}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold uppercase
                          ${row.situacion === "En calificación" ? "bg-amber-100 text-amber-700" : ""}
                          ${row.situacion === "Inscrito" || row.situacion === "Concluido" ? "bg-green-100 text-green-700" : ""}
                          ${row.situacion === "Observado" ? "bg-red-100 text-red-700" : ""}
                          ${row.situacion === "Reingresado" ? "bg-purple-100 text-purple-700" : ""}
                          ${!["En calificación", "Inscrito", "Concluido", "Observado", "Reingresado"].includes(row.situacion) ? "bg-gray-100 text-gray-700" : ""}
                        `}
                        >
                          {row.situacion}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        {row.fecha_presentacion}
                      </td>
                      <td className="p-4 text-sm text-gray-600 font-medium">
                        {row.empresa_gestiona}
                      </td>
                      <td className="p-4 text-center">
                        <button className="p-2 text-gray-400 group-hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-colors">
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={10}
                      className="p-8 text-center text-gray-500 font-bold uppercase"
                    >
                      No se encontraron trámites.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINACIÓN */}
          {paginacion.totalPages > 0 && (
            <div className="bg-gray-50 border-t border-gray-100 p-4 flex items-center justify-between">
              <span className="text-sm text-gray-500 font-medium">
                Registros:{" "}
                <span className="font-bold text-gray-800">
                  {paginacion.totalItems}
                </span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    paginacion.setCurrentPage((prev: number) =>
                      Math.max(prev - 1, 1),
                    );
                  }}
                  disabled={paginacion.currentPage === 1}
                  className="p-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition-all"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="text-sm font-bold text-gray-700 px-4">
                  Página {paginacion.currentPage} de {paginacion.totalPages}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    paginacion.setCurrentPage((prev: number) =>
                      Math.min(prev + 1, paginacion.totalPages),
                    );
                  }}
                  disabled={paginacion.currentPage === paginacion.totalPages}
                  className="p-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition-all"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
