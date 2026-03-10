import React, { useState } from "react";
import {
  Book,
  Rocket,
  Mail,
  ChevronRight,
  Copy,
  Check,
  FileText,
  Star,
  ShieldCheck,
  Loader2,
  ExternalLink,
  Info,
} from "lucide-react";

export function HelpPage() {
  const [copied, setCopied] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // --- LÓGICA DE COPIADO ---
  const copyEmail = () => {
    navigator.clipboard.writeText("soporte@valeska.com");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // --- SIMULACIÓN DE ENLACE A DOCUSAURUS ---
  const handleHistoryRedirect = () => {
    setIsRedirecting(true);
    // Simulamos que el sistema prepara la apertura del navegador
    setTimeout(() => {
      setIsRedirecting(false);
      // Aquí iría el openExternalLink de Tauri a tu subdominio de documentación
    }, 2000);
  };

  const updates = [
    {
      version: "v2.4.0",
      date: "Hoy",
      change:
        "Implementación de motor de extracción XML UBL 2.1 con soporte para múltiples ítems.",
    },
    {
      version: "v2.3.5",
      date: "Ayer",
      change:
        "Optimización de precisión en coordenadas para el Formulario Legacy (Matriz SUNARP).",
    },
    {
      version: "v2.3.2",
      date: "05 Mar",
      change:
        "Mejora en la velocidad de carga de la base de datos local SQLite.",
    },
  ];

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 bg-[#F6F7FB] min-h-screen pb-20">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 pb-8">
        <div>
          <h1 className="text-3xl font-black text-[#111827] tracking-tighter flex items-center gap-3">
            <ShieldCheck className="text-[#2563EB] w-8 h-8" /> CENTRO DE AYUDA
          </h1>
          <p className="text-sm text-[#6B7280] mt-1 font-bold">
            Recursos técnicos, actualizaciones y soporte del ecosistema Valeska.
          </p>
        </div>
        <div className="bg-white px-4 py-2 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
            Estado del Sistema: Operativo
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* COLUMNA 1: NOVEDADES (Link a Docusaurus en progreso) */}
        <section className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="bg-indigo-600 p-8 text-white">
            <Rocket size={32} className="mb-4 opacity-50" />
            <h2 className="text-xl font-black uppercase tracking-tighter">
              Novedades
            </h2>
            <p className="text-xs text-indigo-100 font-bold opacity-80 mt-1">
              Últimas mejoras aplicadas
            </p>
          </div>
          <div className="p-8 flex-1 space-y-6">
            {updates.map((upd, i) => (
              <div
                key={i}
                className="relative pl-6 border-l-2 border-gray-100 space-y-2 group"
              >
                <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white border-2 border-indigo-500 group-hover:bg-indigo-500 transition-colors" />
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md">
                    {upd.version}
                  </span>
                  <span className="text-[10px] font-bold text-gray-400">
                    {upd.date}
                  </span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed font-medium">
                  {upd.change}
                </p>
              </div>
            ))}
            <button
              onClick={handleHistoryRedirect}
              disabled={isRedirecting}
              className="w-full mt-4 py-3 rounded-2xl border-2 border-dashed border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:border-indigo-200 hover:text-indigo-500 transition-all flex items-center justify-center gap-2"
            >
              {isRedirecting ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Conectando con
                  Servidor...
                </>
              ) : (
                <>
                  <ExternalLink size={14} /> Ver historial completo
                </>
              )}
            </button>
          </div>
        </section>

        {/* COLUMNA 2: DOCUMENTACIÓN (Resumen de contenido) */}
        <section className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="bg-blue-600 p-8 text-white">
            <Book size={32} className="mb-4 opacity-50" />
            <h2 className="text-xl font-black uppercase tracking-tighter">
              Documentación
            </h2>
            <p className="text-xs text-blue-100 font-bold opacity-80 mt-1">
              Manuales y guías del sistema
            </p>
          </div>
          <div className="p-8 flex-1 space-y-6">
            <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100 space-y-4">
              <div className="flex items-center gap-2 text-blue-800 font-black text-[10px] uppercase tracking-widest">
                <Info size={14} /> Contenido del Manual
              </div>
              <p className="text-xs text-gray-600 leading-relaxed font-medium italic">
                El manual integral abarca los procesos críticos para la
                operatividad de la agencia:
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="w-1 h-1 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                  <p className="text-[11px] text-gray-700 font-bold">
                    <span className="text-blue-600">Trámites:</span> Flujo paso
                    a paso de inmatriculación y gestión vehicular.
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1 h-1 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                  <p className="text-[11px] text-gray-700 font-bold">
                    <span className="text-blue-600">Auditoría XML:</span>{" "}
                    Protocolos de validación técnica de comprobantes SUNAT.
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1 h-1 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                  <p className="text-[11px] text-gray-700 font-bold">
                    <span className="text-blue-600">Directorio:</span>{" "}
                    Administración centralizada de empresas y apoderados.
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1 h-1 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                  <p className="text-[11px] text-gray-700 font-bold">
                    <span className="text-blue-600">Productividad:</span>{" "}
                    Optimización mediante atajos de teclado y Smart Copy.
                  </p>
                </li>
              </ul>
            </div>

            <div className="pt-2">
              <button className="w-full bg-blue-600 text-white py-4 rounded-3xl font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95">
                <FileText size={16} /> Descargar Manual PDF
              </button>
              <p className="text-[9px] text-gray-400 font-bold text-center mt-3 uppercase tracking-tighter">
                Versión actual de documentación: MAR-2026
              </p>
            </div>
          </div>
        </section>

        {/* COLUMNA 3: SOPORTE EMAIL */}
        <section className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="bg-amber-500 p-8 text-white">
            <Mail size={32} className="mb-4 opacity-50" />
            <h2 className="text-xl font-black uppercase tracking-tighter">
              Soporte Email
            </h2>
            <p className="text-xs text-amber-100 font-bold opacity-80 mt-1">
              Contacto directo con ingeniería
            </p>
          </div>
          <div className="p-8 flex-1 flex flex-col justify-center items-center text-center space-y-6">
            <div className="bg-amber-50 p-6 rounded-full">
              <Star size={40} className="text-amber-500" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-black text-gray-800">
                ¿Necesitas asistencia?
              </p>
              <p className="text-xs text-gray-500 font-medium leading-relaxed max-w-[220px]">
                Reporta incidencias técnicas o solicita nuevas funcionalidades
                aquí.
              </p>
            </div>

            <div className="w-full bg-gray-50 border border-gray-100 p-4 rounded-3xl flex items-center justify-between group">
              <div className="flex flex-col items-start px-2">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">
                  Email Oficial:
                </span>
                <span className="text-xs font-bold text-gray-700">
                  soporte@valeska.com
                </span>
              </div>
              <button
                onClick={copyEmail}
                className={`p-3 rounded-2xl transition-all active:scale-90 ${copied ? "bg-green-500 text-white" : "bg-white text-amber-500 shadow-sm hover:shadow-md"}`}
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>

            <p className="text-[10px] text-gray-400 font-bold italic">
              * Respuesta garantizada en menos de 24 horas.
            </p>
          </div>
        </section>
      </div>

      {/* FOOTER */}
      <div className="flex flex-col items-center justify-center pt-10 opacity-20">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-10 h-[1px] bg-gray-400" />
          <span className="text-[10px] font-black uppercase tracking-[0.5em]"></span>
          <div className="w-10 h-[1px] bg-gray-400" />
        </div>
        <p className="text-[9px] font-bold text-gray-500 tracking-tighter uppercase">
          Software de Gestión Registral y Auditoría Documentaria
        </p>
      </div>
    </div>
  );
}
