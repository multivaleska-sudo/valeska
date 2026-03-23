import React from "react";
import { useNavigate } from "react-router";
import {
  FileSearch,
  Building2,
  User,
  Calendar,
  Hash,
  BadgeDollarSign,
  Loader2,
  FileText,
  ChevronLeft,
  RefreshCw,
  AlertCircle,
  Fingerprint,
  Save,
  AlertTriangle,
  CheckCircle2,
  Search,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { useXmlEditorLogic } from "../../logic/xml/useXmlEditorLogic";
import { CopiableField } from "../../components/shared/CopiableField";

export function XmlEditorPage() {
  const navigate = useNavigate();
  const {
    filePath,
    xmlContent,
    setXmlContent,
    invoiceData,
    liveDescriptions,
    isLoading,
    isSaving,
    hasChanges,
    setHasChanges,
    saveSuccess,
    setSaveSuccess,
    error,
    textareaRef,
    backdropRef,
    highlightedHtml,
    handleTextareaScroll,
    searchTerm,
    setSearchTerm,
    searchResult,
    handleNextMatch,
    handlePrevMatch,
    handleOpenFile,
    handleSaveFile,
    handleReset,
  } = useXmlEditorLogic();

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6 animate-in fade-in duration-500 bg-gray-50 min-h-screen">
      {/* ================= TOOLBAR SUPERIOR ================= */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <FileSearch className="text-blue-600 w-5 h-5" /> Editor &
              Auditoría XML
            </h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mt-1">
              Smart Extraction Engine
              {hasChanges && (
                <span className="text-amber-500 ml-2 normal-case">
                  * Modificado
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {saveSuccess && (
            <span className="text-emerald-500 text-xs font-bold flex items-center gap-1.5 bg-emerald-50 px-3 py-2 rounded-lg animate-in fade-in border border-emerald-100">
              <CheckCircle2 size={16} /> Guardado con éxito
            </span>
          )}

          {(invoiceData || error) && (
            <button
              onClick={handleReset}
              className="px-4 py-2 text-gray-400 font-bold text-xs hover:text-gray-600 transition-colors flex items-center gap-2"
            >
              <RefreshCw size={14} /> Cerrar Archivo
            </button>
          )}

          {!invoiceData ? (
            <button
              onClick={handleOpenFile}
              disabled={isLoading}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-md hover:bg-blue-700 active:scale-95 transition-all text-sm disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              {isLoading ? "Auditando..." : "Abrir Factura XML"}
            </button>
          ) : (
            <button
              onClick={handleSaveFile}
              disabled={!hasChanges || isSaving}
              className="bg-emerald-600 text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-md hover:bg-emerald-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:shadow-none active:scale-95 transition-all text-sm"
            >
              {isSaving ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              {isSaving ? "Guardando..." : "Guardar Cambios"}
            </button>
          )}
        </div>
      </div>

      {/* ================= ERRORES ================= */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl flex items-center gap-3">
          <AlertCircle className="text-red-500 w-6 h-6" />
          <p className="text-xs text-red-600 font-mono font-bold">{error}</p>
        </div>
      )}

      {/* ================= ESTADO VACÍO ================= */}
      {!invoiceData ? (
        <div className="h-[65vh] flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-[2.5rem] bg-white/60 text-gray-400 space-y-4">
          <div className="bg-gray-50 p-10 rounded-full shadow-inner">
            <FileSearch
              size={80}
              strokeWidth={0.5}
              className="text-blue-500/50"
            />
          </div>
          <h3 className="text-xl font-black text-gray-700">
            Editor Seguro de XML UBL 2.1
          </h3>
          <p className="font-medium text-gray-500 max-w-md text-center text-sm">
            Abra una factura para extraer sus datos automáticamente y corregir
            manualmente las descripciones de los productos en caso de error.
          </p>
        </div>
      ) : (
        /* ================= VISTA DIVIDIDA ================= */
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-[calc(100vh-140px)] min-h-[600px] animate-in slide-in-from-bottom-4 duration-500">
          {/* ====== LADO IZQUIERDO: EDITOR MÁGICO CON BACKDROP ====== */}
          <div className="xl:col-span-6 flex flex-col bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden relative">
            <div className="bg-amber-50 border-b border-amber-100 px-5 py-3 flex items-center gap-3 shrink-0">
              <AlertTriangle size={18} className="text-amber-600 shrink-0" />
              <p className="text-[11px] font-medium text-amber-800">
                <strong className="font-bold">Aviso:</strong> Edite solo las
                etiquetas{" "}
                <code className="bg-white px-1.5 py-0.5 rounded border border-amber-200 text-amber-900 font-bold">
                  &lt;cbc:Description&gt;
                </code>
                .
              </p>
            </div>

            {/* BARRA DE BÚSQUEDA */}
            <div className="bg-[#1A1A1A] border-b border-gray-800 px-4 py-2.5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 bg-[#2D2D2D] px-3 py-1.5 rounded-lg border border-gray-700 focus-within:border-blue-500 transition-colors w-64">
                <Search size={14} className="text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar en el código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleNextMatch();
                    }
                  }}
                  className="bg-transparent border-none outline-none text-xs text-gray-200 w-full placeholder-gray-500"
                />
              </div>

              {searchTerm && (
                <div className="flex items-center gap-4">
                  <span className="text-[11px] text-gray-400 font-mono">
                    {searchResult.indices.length > 0
                      ? searchResult.current + 1
                      : 0}{" "}
                    de {searchResult.indices.length}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handlePrevMatch}
                      disabled={searchResult.indices.length === 0}
                      className="p-1.5 hover:bg-gray-700 text-gray-300 rounded-md transition-colors disabled:opacity-50"
                    >
                      <ChevronUp size={16} />
                    </button>
                    <button
                      onClick={handleNextMatch}
                      disabled={searchResult.indices.length === 0}
                      className="p-1.5 hover:bg-gray-700 text-gray-300 rounded-md transition-colors disabled:opacity-50"
                    >
                      <ChevronDown size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* CONTENEDOR DEL TEXTAREA Y EL FONDO DE COLORES */}
            <div className="flex-1 relative w-full bg-[#0D1117] overflow-hidden group">
              {/* 1. CAPA DE FONDO (Con scroll idéntico y word-wrap exacto) */}
              <div
                ref={backdropRef}
                className="absolute inset-0 w-full h-full p-5 font-mono text-[13px] leading-[21px] text-[#569CD6] whitespace-pre-wrap break-words overflow-y-auto overflow-x-hidden pointer-events-none z-0"
                style={{ tabSize: 4 }}
                dangerouslySetInnerHTML={{ __html: highlightedHtml }}
              />

              {/* 2. TEXTAREA REAL (Oculto pero con cursor blanco) */}
              <textarea
                ref={textareaRef}
                value={xmlContent}
                onScroll={handleTextareaScroll}
                onChange={(e) => {
                  // También normalizamos al escribir/pegar
                  setXmlContent(e.target.value.replace(/\r\n/g, "\n"));
                  setHasChanges(true);
                  setSaveSuccess(false);
                }}
                spellCheck={false}
                style={{ tabSize: 4 }}
                className="absolute inset-0 w-full h-full p-5 font-mono text-[13px] leading-[21px] text-transparent caret-white bg-transparent outline-none resize-none z-10 whitespace-pre-wrap break-words overflow-y-auto overflow-x-hidden custom-scrollbar-dark selection:bg-blue-500/40 selection:text-transparent"
              />
            </div>
          </div>

          {/* ====== LADO DERECHO: VISTA DE AUDITORÍA ====== */}
          <div className="xl:col-span-6 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 shrink-0">
              <section className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-blue-800 font-bold text-[10px] uppercase tracking-widest border-b border-gray-50 pb-2">
                  <Building2 size={14} /> Emisor
                </div>
                <CopiableField
                  label="Razón Social"
                  value={invoiceData.emisor_razon}
                  readOnly
                  icon={<Building2 className="w-4 h-4" />}
                />
                <CopiableField
                  label="R.U.C. Emisor"
                  value={invoiceData.emisor_ruc}
                  readOnly
                  mono
                  icon={<Fingerprint className="w-4 h-4" />}
                />
              </section>

              <section className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-gray-600 font-bold text-[10px] uppercase tracking-widest border-b border-gray-50 pb-2">
                  <User size={14} /> Receptor
                </div>
                <CopiableField
                  label="Nombre / Razón Social"
                  value={invoiceData.receptor_razon}
                  readOnly
                  icon={<User className="w-4 h-4" />}
                />
                <div className="grid grid-cols-2 gap-4">
                  <CopiableField
                    label="DNI / RUC"
                    value={invoiceData.receptor_ruc}
                    readOnly
                    mono
                    icon={<Hash className="w-4 h-4" />}
                  />
                  <CopiableField
                    label="Fecha Emisión"
                    value={invoiceData.fecha_emision}
                    readOnly
                    icon={<Calendar className="w-4 h-4" />}
                  />
                </div>
              </section>
            </div>

            {/* TABLA EN TIEMPO REAL */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm shrink-0">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold text-[10px] uppercase tracking-widest">
                  <tr>
                    <th className="px-5 py-3 text-center">Cant.</th>
                    <th className="px-4 py-3 w-1/2">
                      Descripción del Item (En Vivo)
                    </th>
                    <th className="px-5 py-3 text-right">Total Item</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {invoiceData.items.map((item: any, idx: number) => (
                    <tr
                      key={item.id}
                      className="hover:bg-blue-50/40 transition-colors group"
                    >
                      <td className="px-5 py-3 text-center font-black text-blue-600">
                        {item.cantidad}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-gray-800 font-bold text-[11px] uppercase leading-tight bg-yellow-100/50 p-1 rounded transition-colors group-hover:bg-transparent">
                          {liveDescriptions[idx] || item.descripcion}
                        </p>
                      </td>
                      <td className="px-5 py-3 text-right font-black text-gray-900">
                        <span className="text-[10px] text-gray-400 mr-1">
                          {invoiceData.moneda}
                        </span>
                        {item.precio_total}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* TOTAL FINAL */}
            <div className="flex justify-end pb-6 mt-auto">
              <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-lg flex items-center gap-6 border-r-4 border-r-green-500 shrink-0">
                <div className="text-right">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">
                    Importe Total
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold text-green-600">
                      {invoiceData.moneda}
                    </span>
                    <span className="text-4xl font-black text-green-600 tracking-tighter leading-none">
                      {invoiceData.importe_total}
                    </span>
                  </div>
                </div>
                <div className="bg-green-600 p-4 rounded-[1.5rem] shadow-md shadow-green-100 text-white">
                  <BadgeDollarSign size={28} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
