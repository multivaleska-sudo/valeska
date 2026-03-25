import React from "react";
import {
  ArrowLeft,
  Save,
  Loader2,
  Bold,
  Italic,
  Underline,
  Heading1,
  AlignLeft,
  CornerDownLeft,
  Settings,
  Code,
  Eye,
  Smartphone,
  Monitor,
  Printer, // <-- Añadido el icono Printer
} from "lucide-react";
import { useTemplateEditorLogic } from "../../logic/documents/useTemplateEditorLogic";

export function TemplateEditorPage() {
  const {
    isLoading,
    isSaving,
    navigate,
    templateName,
    setTemplateName,
    htmlContent,
    setHtmlContent,
    orientation,
    setOrientation,
    textareaRef,
    insertAtCursor,
    insertHtmlTag,
    handleSave,
    handleSaveAndPrint, // <-- Extraemos la nueva función
    TEMPLATE_VARIABLES,
  } = useTemplateEditorLogic();

  if (isLoading)
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-50 z-50">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );

  return (
    // Se usa fixed inset-0 para bloquear cualquier scroll en el body principal
    <div className="fixed inset-0 flex flex-col bg-slate-50 font-sans overflow-hidden text-gray-800">
      {/* 1. BARRA SUPERIOR DE CONTROLES */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shrink-0 shadow-sm z-20">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="h-8 w-px bg-gray-200 mx-2"></div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Nombre de la Plantilla..."
              className="font-black text-lg text-gray-800 border-b-2 border-transparent hover:border-gray-200 focus:border-blue-500 outline-none bg-transparent py-1 px-2 w-[300px] transition-all"
            />
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-100 px-2 py-1 rounded">
              .HTML DINÁMICO
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center bg-gray-100 rounded-lg p-1 border border-gray-200">
            <button
              onClick={() => setOrientation("PORTRAIT")}
              className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-2 transition-all ${orientation === "PORTRAIT" ? "bg-white shadow-sm text-blue-700" : "text-gray-500 hover:text-gray-700"}`}
            >
              <Smartphone size={14} /> Vertical A4
            </button>
            <button
              onClick={() => setOrientation("LANDSCAPE")}
              className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-2 transition-all ${orientation === "LANDSCAPE" ? "bg-white shadow-sm text-blue-700" : "text-gray-500 hover:text-gray-700"}`}
            >
              <Monitor size={14} /> Horizontal A4
            </button>
          </div>

          {/* NUEVOS BOTONES DE GUARDADO */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-md transition-colors disabled:opacity-50"
              title="Guardar y volver a Documentos"
            >
              {isSaving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              Guardar
            </button>

            <button
              onClick={handleSaveAndPrint}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-md shadow-blue-200 transition-colors disabled:opacity-50"
              title="Guardar e ir a Trámites"
            >
              {isSaving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Printer size={16} />
              )}
              Guardar e Imprimir
            </button>
          </div>
        </div>
      </div>

      {/* 2. ÁREA DE TRABAJO (Tres columnas bloqueadas en el alto disponible) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* COLUMNA 1: Variables Dinámicas */}
        <div className="w-72 bg-slate-900 text-slate-300 flex flex-col shrink-0 overflow-hidden shadow-2xl z-10 h-full">
          <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center gap-2 text-white">
            <Settings size={18} className="text-blue-400" />
            <h2 className="font-bold text-sm tracking-wide">
              Variables Disponibles
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
            {TEMPLATE_VARIABLES.map((group, idx) => (
              <div key={idx} className="space-y-2">
                <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                  {group.category}
                </h3>
                <div className="space-y-1.5">
                  {group.items.map((item, i) => (
                    <button
                      key={i}
                      onClick={() => insertAtCursor(item.tag)}
                      className="w-full text-left bg-slate-800 hover:bg-blue-600 hover:text-white p-2.5 rounded-lg border border-slate-700 transition-all group flex flex-col"
                      title="Haz clic para insertar en el editor"
                    >
                      <span className="text-[10px] font-medium opacity-70 group-hover:opacity-100">
                        {item.label}
                      </span>
                      <span className="font-mono text-xs text-blue-300 group-hover:text-blue-100 font-bold mt-0.5">
                        {item.tag}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* COLUMNA 2: Editor de Código HTML */}
        <div className="flex-1 flex flex-col border-r border-gray-200 bg-white h-full relative">
          <div className="bg-gray-50 border-b border-gray-200 p-2 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1 ml-2 mr-4">
                <Code size={14} /> Editor (Estructura)
              </span>
              <div className="h-4 w-px bg-gray-300 mx-1"></div>
              <button
                onClick={() => insertHtmlTag("bold")}
                className="p-1.5 text-gray-600 hover:bg-gray-200 rounded"
              >
                <Bold size={14} />
              </button>
              <button
                onClick={() => insertHtmlTag("italic")}
                className="p-1.5 text-gray-600 hover:bg-gray-200 rounded"
              >
                <Italic size={14} />
              </button>
              <button
                onClick={() => insertHtmlTag("underline")}
                className="p-1.5 text-gray-600 hover:bg-gray-200 rounded"
              >
                <Underline size={14} />
              </button>
              <div className="h-4 w-px bg-gray-300 mx-1"></div>
              <button
                onClick={() => insertHtmlTag("h1")}
                className="p-1.5 text-gray-600 hover:bg-gray-200 rounded"
              >
                <Heading1 size={14} />
              </button>
              <button
                onClick={() => insertHtmlTag("p")}
                className="p-1.5 text-gray-600 hover:bg-gray-200 rounded"
              >
                <AlignLeft size={14} />
              </button>
              <button
                onClick={() => insertHtmlTag("br")}
                className="p-1.5 text-gray-600 hover:bg-gray-200 rounded text-xs font-bold flex items-center gap-1"
              >
                <CornerDownLeft size={12} /> Br
              </button>
            </div>
          </div>

          <textarea
            ref={textareaRef}
            value={htmlContent}
            onChange={(e) => setHtmlContent(e.target.value)}
            spellCheck={false}
            className="absolute inset-0 top-[40px] w-full p-4 font-mono text-sm text-indigo-900 bg-slate-50/50 outline-none resize-none focus:ring-inset focus:ring-2 focus:ring-blue-100"
            placeholder="<!-- Escribe tu HTML aquí -->"
          />
        </div>

        {/* COLUMNA 3: Vista Previa en Vivo (SCROLL A PRUEBA DE BALAS) */}
        <div className="w-[45%] bg-gray-200 flex flex-col relative h-full">
          <div className="absolute top-0 w-full bg-slate-700/90 backdrop-blur-sm text-white px-4 py-2 flex items-center justify-between shadow-md z-10 shrink-0">
            <span className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
              <Eye size={14} className="text-emerald-400" /> Vista Previa A4
            </span>
          </div>

          {/* El scroll ocurre ESTRICTAMENTE dentro de este contenedor */}
          <div className="absolute inset-0 top-[36px] overflow-y-auto p-8 flex flex-col items-center">
            {/* HOJA A4 VIRTUAL (Crece dinámicamente) */}
            <div
              className={`bg-white shadow-2xl relative origin-top shrink-0 mb-10 transition-all
                ${orientation === "PORTRAIT" ? "w-[794px] min-h-[1123px]" : "w-[1123px] min-h-[794px]"}
              `}
              style={{
                transform: "scale(0.70)",
                transformOrigin: "top center",
                marginBottom: "-30%", // Compensar el escalado
              }}
            >
              {/* Le quitamos el absolute inset-0 para que el HTML expanda la hoja naturalmente */}
              <div
                className="w-full text-gray-900 pb-12"
                dangerouslySetInnerHTML={{ __html: htmlContent }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
