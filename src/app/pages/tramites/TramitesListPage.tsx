import React, { useCallback, useState } from "react";
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
  Trash2,
  ScanBarcode,
  RefreshCw,
  User,
  Calendar,
  CalendarDays,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useTramitesListLogic } from "../../logic/tramites/useTramitesListLogic";
import { useBarcodeScanner } from "../../logic/tramites/useBarcodeScanner";

export function TramitesListPage() {
  const navigate = useNavigate();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [scanNotice, setScanNotice] = useState<string | null>(null);
  const {
    filtros,
    paginacion,
    data,
    opcionesSituacion,
    handleExportExcel,
    isExporting,
    isLoading,
    deleteTramite,
    sortOrder,
    setSortOrder,
  } = useTramitesListLogic();

  const handlePlateScan = useCallback(
    (plate: string) => {
      filtros.setSearchPlaca(plate);
      setScanNotice(`Buscando placa escaneada: ${plate}`);
      window.setTimeout(() => setScanNotice(null), 2500);
    },
    [filtros.setSearchPlaca],
  );

  useBarcodeScanner({
    onScan: handlePlateScan,
  });

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans">
      {isExporting && (
        <div className="fixed inset-0 z-[100] bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in">
          <Loader2 size={64} className="animate-spin text-emerald-600 mb-4" />
          <h2 className="text-2xl font-black text-gray-800 tracking-tight">Exportando Base de Datos</h2>
          <p className="text-gray-500 font-medium mt-2">Por favor espere, esto puede tardar unos segundos...</p>
        </div>
      )}
      {scanNotice && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-6 py-3 rounded-full shadow-lg font-bold flex items-center gap-2 z-50 animate-in fade-in slide-in-from-top-2">
          <ScanBarcode size={20} /> {scanNotice}
        </div>
      )}
      <div className="max-w-[1400px] mx-auto space-y-6">
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

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          {/* AGENTE: Se rediseña la cabecera de filtros y botones de limpieza/búsqueda según el mock provisto */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-gray-800">
              <Filter size={18} className="text-blue-600" />
              <h2 className="text-sm font-bold uppercase tracking-wider">
                Filtros de Búsqueda
              </h2>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                className="text-slate-600 hover:bg-slate-100 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors border border-slate-200"
              >
                {sortOrder === 'desc' ? (
                  <>
                    <ChevronDown size={16} /> Más Recientes
                  </>
                ) : (
                  <>
                    <ChevronUp size={16} /> Más Antiguos
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  filtros.setSearchBusquedaRapida("");
                  filtros.setSearchCliente("");
                  filtros.setSearchTitulo("");
                  filtros.setSearchDNI("");
                  filtros.setSearchPlaca("");
                  filtros.setSearchMotor("");
                  filtros.setSearchChasis("");
                  filtros.setSearchVin("");
                  filtros.setFilterSituacion("");
                  filtros.setFilterEmpresa("");
                  filtros.setInputEmpresa("");
                  filtros.setFechaInicio("");
                  filtros.setFechaFin("");
                }}
                className="text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors border border-blue-100"
              >
                <RefreshCw size={16} /> Limpiar filtros
              </button>
            </div>
          </div>

          {/* AGENTE: Nueva sección superior con Búsqueda Rápida y Búsquedas Frecuentes */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
            <div className="lg:col-span-5 flex flex-col">
              <label className="text-xs font-semibold text-gray-600 mb-1.5 uppercase">
                Búsqueda Rápida
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={filtros.searchBusquedaRapida}
                  onChange={(e) => filtros.setSearchBusquedaRapida(e.target.value)}
                  placeholder="Buscar por nombre, apellido, placa, título, RUC, motor, chasis, VIN..."
                  className="h-10 w-full pl-9 pr-3 rounded-lg border border-gray-200 text-sm focus:ring-4 focus:ring-blue-500/10 outline-none"
                />
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
            <div className="lg:col-span-7 flex flex-col">
              <label className="text-xs font-semibold text-gray-600 mb-1.5 uppercase">
                Búsquedas Frecuentes
              </label>
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => {
                    const today = new Date().toISOString().split('T')[0];
                    filtros.setFechaInicio(today);
                    filtros.setFechaFin(today);
                  }}
                  className="h-10 px-4 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
                >
                  <User size={14} /> Hoy
                </button>
                <button 
                  onClick={() => {
                    const today = new Date();
                    const firstDay = new Date(today.setDate(today.getDate() - today.getDay()));
                    const lastDay = new Date(today.setDate(today.getDate() - today.getDay() + 6));
                    filtros.setFechaInicio(firstDay.toISOString().split('T')[0]);
                    filtros.setFechaFin(lastDay.toISOString().split('T')[0]);
                  }}
                  className="h-10 px-4 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
                >
                  <Calendar size={14} /> Esta semana
                </button>
                <button 
                  onClick={() => {
                    const date = new Date();
                    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
                    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
                    filtros.setFechaInicio(firstDay.toISOString().split('T')[0]);
                    filtros.setFechaFin(lastDay.toISOString().split('T')[0]);
                  }}
                  className="h-10 px-4 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
                >
                  <CalendarDays size={14} /> Este mes
                </button>
              </div>
            </div>
          </div>

          {/* AGENTE: Rejilla de filtros individuales, reordenada y expandida */}
          {showAdvanced && (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-x-4 gap-y-5 animate-in fade-in slide-in-from-top-4 duration-300 ease-out">
              {/* FILA 1 */}
            <div className="flex flex-col lg:col-span-2">
              <label className="text-xs font-semibold text-gray-600 mb-1.5 uppercase">
                Nombre / Apellido Cliente
              </label>
              <input
                type="text"
                value={filtros.searchCliente}
                onChange={(e) => filtros.setSearchCliente(e.target.value)}
                placeholder="Ej. JUAN PEREZ..."
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
                Motor (N°)
              </label>
              <input
                type="text"
                value={filtros.searchMotor}
                onChange={(e) => filtros.setSearchMotor(e.target.value)}
                placeholder="Ej. 2026..."
                className="h-10 px-3 rounded-lg border border-gray-200 text-sm focus:ring-4 focus:ring-blue-500/10 outline-none uppercase font-bold"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-gray-600 mb-1.5 uppercase">
                Chasis (N°)
              </label>
              <input
                type="text"
                value={filtros.searchChasis}
                onChange={(e) => filtros.setSearchChasis(e.target.value)}
                placeholder="Ej. 2026..."
                className="h-10 px-3 rounded-lg border border-gray-200 text-sm focus:ring-4 focus:ring-blue-500/10 outline-none uppercase font-bold"
              />
            </div>
            
            {/* FILA 2 */}
            <div className="flex flex-col lg:col-span-1">
              <label className="text-xs font-semibold text-gray-600 mb-1.5 uppercase">
                VIN
              </label>
              <input
                type="text"
                value={filtros.searchVin}
                onChange={(e) => filtros.setSearchVin(e.target.value)}
                placeholder="Ej. 2026..."
                className="h-10 px-3 rounded-lg border border-gray-200 text-sm focus:ring-4 focus:ring-blue-500/10 outline-none uppercase font-bold"
              />
            </div>
            <div className="flex flex-col lg:col-span-1">
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
            <div ref={filtros.dropdownRef} className="flex flex-col lg:col-span-2 relative">
              <label className="text-xs font-semibold text-gray-600 mb-1.5 uppercase flex justify-between">
                <span>Empresa Gestora</span>
                {filtros.filterEmpresa && (
                  <button
                    onClick={() => {
                      filtros.setFilterEmpresa("");
                      filtros.setInputEmpresa("");
                    }}
                    className="text-red-500 hover:bg-red-50 rounded"
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
                <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                {filtros.showEmpresaResults && filtros.empresasSugeridas.length > 0 && (
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

            {/* FILA 3 */}
            <div className="flex flex-col lg:col-span-1">
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
            <div className="flex flex-col lg:col-span-1">
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
          </div>
          )}

          {/* AGENTE: Botón expandible de Búsqueda avanzada visual */}
          <div 
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="mt-5 border-t border-gray-100 pt-4 flex items-center gap-2 cursor-pointer text-gray-600 hover:text-blue-600 transition-colors font-medium text-sm select-none"
          >
            {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />} Búsqueda avanzada
          </div>
        </div>

        {/* TABLA DE RESULTADOS */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50/80 border-b border-gray-100">
                <tr className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <th className="p-4">N° Título</th>
                  <th className="p-4">Cliente</th>
                  <th className="p-4">Placa</th>
                  <th className="p-4">Trámite</th>
                  <th className="p-4">Situación</th>
                  <th className="p-4">Empresa</th>
                  <th className="p-4">Creador</th>
                  <th className="p-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="p-10 text-center">
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
                      <td className="p-4 font-bold text-blue-600 text-sm">
                        {row.n_titulo}
                      </td>
                      <td className="p-4">
                        <div className="text-sm font-semibold text-gray-800">
                          {row.cliente}
                        </div>
                        <div className="text-xs text-gray-500">{row.dni}</div>
                      </td>
                      <td className="p-4 text-sm font-bold text-gray-700 bg-gray-50 uppercase tracking-widest text-center">
                        {row.placa}
                      </td>
                      <td className="p-4 text-xs text-gray-600 uppercase font-medium">
                        {row.tramite}
                        <br />
                        <span className="text-gray-400 text-[10px]">
                          {row.fecha_presentacion?.split('T')[0]}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase
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
                      <td className="p-4 text-[11px] text-gray-600 font-medium max-w-[150px] truncate">
                        {row.empresa_gestiona}
                      </td>
                      <td className="p-4 text-[11px] text-gray-600 font-bold uppercase">
                        {row.creador}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center gap-1">
                          <button
                            title="Ver expediente"
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            title="Eliminar trámite"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteTramite(row.id);
                            }}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={8}
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
