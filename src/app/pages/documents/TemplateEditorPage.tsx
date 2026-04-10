import React, { useState, useMemo } from "react";
import {
  ArrowLeft,
  Save,
  Loader2,
  Bold,
  Italic,
  Underline,
  Heading1,
  AlignLeft,
  Settings,
  Code,
  Eye,
  Smartphone,
  Monitor,
  Printer,
  Layout,
  AlertTriangle,
} from "lucide-react";
import { useTemplateEditorLogic } from "../../logic/documents/useTemplateEditorLogic";
import VisualLayoutEditor from "./VisualLayoutEditor";

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
    handleSaveAndPrint,
    TEMPLATE_VARIABLES,
  } = useTemplateEditorLogic();

  const [showVisualEditor, setShowVisualEditor] = useState(false);

  const isMultiPage = useMemo(() => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, "text/html");
    const pages = Array.from(doc.querySelectorAll("div")).filter(
      (d) => d.style.width === "21cm" || d.style.width === "210mm",
    );
    return pages.length > 1;
  }, [htmlContent]);

  const convertToAbsoluteMode = () => {
    if (isMultiPage) return;

    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, "text/html");

    const hasContainer =
      doc.querySelector("#visual-form-container") ||
      Array.from(doc.querySelectorAll("div")).find(
        (d) => d.style.width === "21cm",
      );

    if (!hasContainer) {
      const wrappedContent = `<div id="visual-form-container" style="background: white; width: 21cm; min-height: 29.7cm; padding: 2cm; box-sizing: border-box; font-family: Arial, sans-serif; font-size: 13px; position: relative; margin: 0 auto; border: 1px dashed #ccc;">\n${htmlContent}\n</div>`;
      setHtmlContent(wrappedContent);
    } else {
      const container = hasContainer as HTMLElement;
      if (!container.id) container.id = "visual-form-container";
      container.style.position = "relative";
      setHtmlContent(doc.body.innerHTML);
    }

    setShowVisualEditor(true);
  };

  if (isLoading)
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-50 z-50">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );

  return (
    <div className="fixed inset-0 flex flex-col bg-slate-50 font-sans overflow-hidden text-gray-800">
      {/* HEADER */}
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
          </div>
        </div>

        <div className="flex items-center gap-4">
          {!isMultiPage ? (
            <button
              onClick={convertToAbsoluteMode}
              className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-xl font-black text-xs hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95"
            >
              <Layout size={16} /> DESIGNER VISUAL
            </button>
          ) : (
            <div
              className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-200 cursor-help"
              title="El Diseñador Visual solo está disponible para documentos de una sola página."
            >
              <AlertTriangle size={14} />
              <span className="text-[10px] font-black uppercase tracking-tight">
                Modo Visual Deshabilitado (Multi-página)
              </span>
            </div>
          )}

          <div className="h-8 w-px bg-gray-200"></div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-md transition-colors disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}{" "}
              Guardar
            </button>
            <button
              onClick={handleSaveAndPrint}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-md shadow-blue-200 transition-colors disabled:opacity-50"
            >
              <Printer size={16} /> Guardar e Imprimir
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        <div className="w-72 bg-slate-900 text-slate-300 flex flex-col shrink-0 overflow-hidden shadow-2xl z-10 h-full">
          <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <Settings size={18} className="text-blue-400" />
              <h2 className="font-bold text-sm tracking-wide">
                Campos Dinámicos
              </h2>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
            {TEMPLATE_VARIABLES.map((group: any, idx: number) => (
              <div key={idx} className="space-y-2">
                <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                  {group.category}
                </h3>
                <div className="space-y-1.5">
                  {group.items.map((item: any, i: number) => (
                    <button
                      key={i}
                      onClick={() => insertAtCursor(item.tag)}
                      className="w-full text-left bg-slate-800 hover:bg-blue-600 hover:text-white p-2.5 rounded-lg border border-slate-700 transition-all group flex flex-col"
                    >
                      <span className="text-[10px] font-medium opacity-70">
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

        <div className="flex-1 flex flex-col border-r border-gray-200 bg-white h-full relative">
          <div className="bg-gray-50 border-b border-gray-200 p-2 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1 ml-2 mr-4">
                <Code size={14} /> Estructura HTML
              </span>
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
            </div>
          </div>
          <textarea
            ref={textareaRef}
            value={htmlContent}
            onChange={(e) => setHtmlContent(e.target.value)}
            spellCheck={false}
            className="absolute inset-0 top-[40px] w-full p-6 font-mono text-sm text-indigo-900 bg-slate-50/30 outline-none resize-none"
            placeholder="<!-- Escribe o arrastra variables aquí -->"
          />
        </div>

        <div className="w-[45%] bg-gray-200 flex flex-col relative h-full">
          <div className="absolute top-0 w-full bg-slate-700/90 backdrop-blur-sm text-white px-4 py-2 flex items-center justify-between shadow-md z-10">
            <span className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
              <Eye size={14} className="text-emerald-400" /> Previsualización
              Final
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setOrientation("PORTRAIT")}
                className={`p-1 rounded ${orientation === "PORTRAIT" ? "bg-blue-500" : "hover:bg-slate-600"}`}
              >
                <Smartphone size={12} />
              </button>
              <button
                onClick={() => setOrientation("LANDSCAPE")}
                className={`p-1 rounded ${orientation === "LANDSCAPE" ? "bg-blue-500" : "hover:bg-slate-600"}`}
              >
                <Monitor size={12} />
              </button>
            </div>
          </div>
          <div className="absolute inset-0 top-[36px] overflow-y-auto p-8 flex flex-col items-center">
            <div
              className={`bg-white shadow-2xl relative origin-top shrink-0 transition-all ${orientation === "PORTRAIT" ? "w-[794px] min-h-[1123px]" : "w-[1123px] min-h-[794px]"}`}
              style={{
                transform: "scale(0.65)",
                transformOrigin: "top center",
                marginBottom: "-35%",
              }}
            >
              <div
                className="w-full text-gray-900"
                dangerouslySetInnerHTML={{ __html: htmlContent }}
              />
            </div>
          </div>
        </div>
      </div>

      {showVisualEditor && (
        <VisualLayoutEditor
          htmlContent={htmlContent}
          onChange={(newHtml) => setHtmlContent(newHtml)}
          onClose={() => setShowVisualEditor(false)}
        />
      )}
    </div>
  );
}
