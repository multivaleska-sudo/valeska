import React, { useState } from "react";
import { useNavigate } from "react-router";
// Importaciones nativas de Tauri v2
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
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
  X,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { generateSituacionesReport } from "../../logic/situaciones/reportGenerator";

// --- LÓGICA DE PROCESAMIENTO INTEGRADA ---

const mapXmlToInvoiceData = (raw: any) => {
  if (!raw) return null;
  return {
    emisor_ruc: raw.emisor_ruc || "---",
    emisor_razon: raw.emisor_razon || "---",
    receptor_ruc: raw.receptor_ruc || "---",
    receptor_razon: raw.receptor_razon || "---",
    fecha_emision: raw.fecha_emision || "---",
    moneda: raw.moneda || "S/",
    importe_total: raw.importe_total || "0.00",
    items: (raw.items || []).map((item: any) => ({
      id: item.id || "0",
      unidad: item.unidad || "NIU",
      cantidad: item.cantidad || "0",
      codigo: item.codigo || "-",
      descripcion: item.descripcion || "Sin descripción",
      precio_total: item.precio_total || "0.00",
    })),
  };
};

export function XMLImportPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // --- ACCIÓN PRINCIPAL DE CARGA ---
  const handleOpenXML = async () => {
    if (loading) return;

    setError(null);
    try {
      // 1. Abrir diálogo nativo
      const selected = await open({
        multiple: false,
        filters: [{ name: "Factura XML SUNAT", extensions: ["xml"] }],
      });

      if (!selected) return; // Usuario canceló la selección

      setLoading(true);

      // 2. Invocar comando de Rust
      // Importante: Asegúrate de que en lib.rs el comando se llame "extract_full_invoice_data"
      const rawData: any = await invoke("extract_full_invoice_data", {
        path: selected,
      });

      console.log("Datos crudos recibidos de Rust:", rawData);

      // 3. Mapear y actualizar estado
      const mappedData = mapXmlToInvoiceData(rawData);
      if (mappedData) {
        setData(mappedData);
      } else {
        throw new Error("El motor devolvió datos vacíos o incompatibles.");
      }
    } catch (err: any) {
      console.error("Error crítico en auditoría XML:", err);
      // Mostramos el mensaje de error real que viene desde Rust
      setError(
        typeof err === "string"
          ? err
          : err.message || "Error desconocido al procesar el archivo.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setData(null);
    setError(null);
  };

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-6 animate-in fade-in duration-500 bg-gray-50 min-h-screen">
      {/* TOOLBAR SUPERIOR */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <FileSearch className="text-blue-600 w-5 h-5" /> Visor XML -
              Auditoría
            </h2>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
              Protocolo UBL 2.1 SUNAT
            </span>
          </div>
        </div>
        <div className="flex gap-3">
          {(data || error) && (
            <button
              onClick={handleReset}
              className="px-4 py-2 text-gray-400 font-bold text-xs hover:text-gray-600 transition-colors flex items-center gap-2"
            >
              <RefreshCw size={14} /> Reestablecer
            </button>
          )}
          <button
            onClick={handleOpenXML}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-md hover:bg-blue-700 active:scale-95 transition-all text-sm disabled:bg-gray-400"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
            {loading ? "Auditando..." : "Abrir Factura XML"}
          </button>
        </div>
      </div>

      {/* GESTIÓN DE ERRORES VISIBLES */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-red-500 w-6 h-6" />
            <div>
              <p className="text-sm font-bold text-red-800">
                No se pudo procesar el XML
              </p>
              <p className="text-xs text-red-600 font-mono mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {!data ? (
        /* ESTADO VACÍO */
        <div className="h-[65vh] flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-[2.5rem] bg-white/60 text-gray-400 space-y-5">
          <div className="bg-gray-100 p-10 rounded-full">
            <FileSearch size={72} strokeWidth={1} className="text-gray-300" />
          </div>
          <div className="text-center space-y-2">
            <p className="font-bold text-xl text-gray-600">
              Listo para la auditoría de comprobantes
            </p>
            <p className="text-sm text-gray-400 max-w-sm mx-auto leading-relaxed">
              El motor extraerá automáticamente emisor, receptor y el desglose
              completo de ítems desde el archivo XML.
            </p>
          </div>
        </div>
      ) : (
        /* VISTA DE DATOS EXTRAÍDOS */
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-700 ease-out">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* PROVEEDOR */}
            <section className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="bg-blue-50/50 px-5 py-3 border-b border-blue-100 flex items-center gap-2 text-blue-800 font-bold text-[10px] uppercase tracking-widest">
                <Building2 size={14} /> Datos del Proveedor
              </div>
              <div className="p-6 space-y-5">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                    Razón Social
                  </label>
                  <p className="text-lg font-black text-blue-900 uppercase leading-tight">
                    {data.emisor_razon}
                  </p>
                </div>
                <div className="flex gap-10">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                      R.U.C.
                    </label>
                    <p className="text-sm font-mono font-black text-gray-700">
                      {data.emisor_ruc}
                    </p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                      Moneda
                    </label>
                    <p className="text-sm font-bold text-gray-700 uppercase">
                      {data.moneda === "S/" ? "Soles (PEN)" : "Dólares (USD)"}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* CLIENTE */}
            <section className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="bg-gray-50 px-5 py-3 border-b border-gray-200 flex items-center gap-2 text-gray-600 font-bold text-[10px] uppercase tracking-widest">
                <User size={14} /> Datos del Receptor
              </div>
              <div className="p-6 grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                    Adquiriente
                  </label>
                  <div className="bg-gray-50 border border-gray-100 rounded-lg px-4 py-2.5 text-sm font-bold text-gray-800 uppercase">
                    {data.receptor_razon}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                    Fecha Emisión
                  </label>
                  <div className="flex items-center gap-2 text-gray-700 font-bold text-sm bg-white p-2 rounded-lg border border-gray-100 shadow-sm">
                    <Calendar size={14} className="text-blue-500" />{" "}
                    {data.fecha_emision}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                    DNI / RUC Cliente
                  </label>
                  <div className="flex items-center gap-2 text-gray-700 font-bold text-sm bg-white p-2 rounded-lg border border-gray-100 shadow-sm">
                    <Hash size={14} className="text-blue-500" />{" "}
                    {data.receptor_ruc}
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* TABLA DE ÍTEMS */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-500 font-bold text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4 text-center">#</th>
                  <th className="px-4 py-4 text-center">Cant.</th>
                  <th className="px-4 py-4">Unidad</th>
                  <th className="px-6 py-4 w-1/2">
                    Descripción del Producto / Servicio
                  </th>
                  <th className="px-6 py-4 text-right">Monto Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.items.map((item: any) => (
                  <tr
                    key={item.id}
                    className="hover:bg-blue-50/40 transition-colors group"
                  >
                    <td className="px-6 py-4 text-center font-bold text-gray-400 group-hover:text-blue-600">
                      {item.id}
                    </td>
                    <td className="px-4 py-4 text-center font-black text-blue-600">
                      {item.cantidad}
                    </td>
                    <td className="px-4 py-4 font-bold text-gray-400 text-xs">
                      {item.unidad}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-800 font-bold text-[11px] uppercase whitespace-pre-wrap leading-relaxed tracking-tight">
                        {item.descripcion}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-black text-gray-900">
                      <span className="text-[10px] text-gray-400 mr-1">
                        {data.moneda}
                      </span>
                      {item.precio_total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* FOOTER TOTAL */}
          <div className="flex justify-end pb-10 pr-2">
            <div className="flex items-center gap-6 bg-white p-5 rounded-[2.5rem] border border-gray-200 shadow-xl shadow-gray-200/50">
              <div className="text-right">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] leading-none mb-2">
                  Importe Total Facturado
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold text-green-600">
                    {data.moneda}
                  </span>
                  <span className="text-4xl font-black text-green-600 tracking-tighter leading-none">
                    {data.importe_total}
                  </span>
                </div>
              </div>
              <div className="bg-green-600 p-4 rounded-3xl shadow-lg shadow-green-200">
                <BadgeDollarSign className="text-white w-8 h-8" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
