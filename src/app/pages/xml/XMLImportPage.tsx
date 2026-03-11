import { useState } from "react";
import { useNavigate } from "react-router";
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
  RefreshCw,
  AlertCircle,
  Fingerprint,
} from "lucide-react";
import { CopiableField } from "../../components/shared/CopiableField";

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

  const handleOpenXML = async () => {
    if (loading) return;
    setError(null);
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: "Factura XML SUNAT", extensions: ["xml"] }],
      });
      if (!selected) return;
      setLoading(true);
      const rawData: any = await invoke("extract_full_invoice_data", {
        path: selected,
      });
      const mappedData = mapXmlToInvoiceData(rawData);
      if (mappedData) setData(mappedData);
      else throw new Error("Datos incompatibles.");
    } catch (err: any) {
      setError(
        typeof err === "string"
          ? err
          : err.message || "Error al procesar archivo",
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
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <FileSearch className="text-blue-600 w-5 h-5" /> Auditoría XML
            </h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">
              Smart Extraction Engine
            </p>
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
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-md hover:bg-blue-700 active:scale-95 transition-all text-sm"
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

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl flex items-center gap-3">
          <AlertCircle className="text-red-500 w-6 h-6" />
          <p className="text-xs text-red-600 font-mono font-bold">{error}</p>
        </div>
      )}

      {!data ? (
        <div className="h-[65vh] flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-[2.5rem] bg-white/60 text-gray-400 space-y-4">
          <div className="bg-gray-50 p-10 rounded-full shadow-inner">
            <FileSearch size={80} strokeWidth={0.5} />
          </div>
          <p className="font-bold text-gray-500">
            Listo para la extracción masiva de datos UBL 2.1
          </p>
        </div>
      ) : (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* SECCIÓN PROVEEDOR (Emisor) */}
            <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-5">
              <div className="flex items-center gap-2 text-blue-800 font-bold text-[10px] uppercase tracking-widest border-b border-gray-50 pb-3">
                <Building2 size={14} /> Información del Proveedor
              </div>
              <CopiableField
                label="Razón Social del Emisor"
                value={data.emisor_razon}
                readOnly
                icon={<Building2 className="w-4 h-4" />}
              />
              <div className="grid grid-cols-2 gap-4">
                <CopiableField
                  label="R.U.C. Emisor"
                  value={data.emisor_ruc}
                  readOnly
                  mono
                  icon={<Fingerprint className="w-4 h-4" />}
                />
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">
                    Moneda del Documento
                  </label>
                  <div className="h-11 flex items-center justify-center bg-blue-50 border border-blue-100 rounded-lg text-blue-700 font-black text-xs uppercase">
                    {data.moneda === "S/" ? "Soles (PEN)" : "Dólares (USD)"}
                  </div>
                </div>
              </div>
            </section>

            {/* SECCIÓN CLIENTE (Receptor) */}
            <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-5">
              <div className="flex items-center gap-2 text-gray-600 font-bold text-[10px] uppercase tracking-widest border-b border-gray-50 pb-3">
                <User size={14} /> Datos del Adquiriente / Receptor
              </div>
              <CopiableField
                label="Razón Social / Nombre Completo"
                value={data.receptor_razon}
                readOnly
                icon={<User className="w-4 h-4" />}
              />
              <div className="grid grid-cols-2 gap-4">
                <CopiableField
                  label="Identificación (DNI/RUC)"
                  value={data.receptor_ruc}
                  readOnly
                  mono
                  icon={<Hash className="w-4 h-4" />}
                />
                <CopiableField
                  label="Fecha de Emisión"
                  value={data.fecha_emision}
                  readOnly
                  icon={<Calendar className="w-4 h-4" />}
                />
              </div>
            </section>
          </div>

          {/* TABLA DE DETALLES */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4 text-center">Cant.</th>
                  <th className="px-4 py-4 w-20">Uni.</th>
                  <th className="px-4 py-4 w-1/2">Descripción del Item</th>
                  <th className="px-6 py-4 text-right">Total Item</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.items.map((item: any) => (
                  <tr
                    key={item.id}
                    className="hover:bg-blue-50/40 transition-colors group"
                  >
                    <td className="px-6 py-4 text-center font-black text-blue-600">
                      {item.cantidad}
                    </td>
                    <td className="px-4 py-4 font-bold text-gray-400 text-[10px]">
                      {item.unidad}
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-gray-800 font-bold text-[11px] uppercase leading-tight">
                        {item.descripcion}
                      </p>
                      {item.codigo !== "-" && (
                        <span className="text-[9px] text-gray-400 font-mono">
                          CÓD: {item.codigo}
                        </span>
                      )}
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

          {/* TOTAL FINAL */}
          <div className="flex justify-end pr-2 pb-12">
            <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-xl flex items-center gap-8 border-r-4 border-r-green-500">
              <div className="text-right">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">
                  Importe Total Facturado
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold text-green-600">
                    {data.moneda}
                  </span>
                  <span className="text-5xl font-black text-green-600 tracking-tighter leading-none">
                    {data.importe_total}
                  </span>
                </div>
              </div>
              <div className="bg-green-600 p-5 rounded-[2rem] shadow-lg shadow-green-100 text-white">
                <BadgeDollarSign size={36} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
