import { useState } from "react";
import { useNavigate } from "react-router";
import {
  FileSearch,
  Loader2,
  FileText,
  ChevronLeft,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ReceiptText,
  Save,
  AlertCircle,
  Code2,
} from "lucide-react";

import { useXmlEditorLogic } from "../../logic/xml/useXmlEditorLogic";
import { XmlCodeEditor } from "../../components/xml/XMLCodeEditor";
import { InvoicePreview } from "../../components/xml/InvoicePreview";

export function XmlEditorPage() {
  const navigate = useNavigate();
  const logic = useXmlEditorLogic();

  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");

  const {
    invoiceData,
    isLoading,
    isSaving,
    hasChanges,
    saveSuccess,
    error,
    handleOpenFile,
    handleSaveFile,
    handleReset,
  } = logic;

  return (
    <div className="bg-slate-100 min-h-screen font-sans text-slate-900 animate-in fade-in duration-500">
      <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-30 shadow-sm">
        <div className="max-w-[1600px] mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
            >
              <ChevronLeft size={24} />
            </button>
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <ReceiptText size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                Auditoría y Edición XML
              </h1>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Motor de Sincronización UBL 2.1
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {error && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-full text-red-700 text-[11px] font-bold">
                <AlertCircle size={14} /> {error}
              </div>
            )}

            {hasChanges && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full text-amber-700 text-[11px] font-bold">
                <AlertTriangle size={14} /> Cambios sin guardar
              </div>
            )}

            {saveSuccess && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-700 text-[11px] font-bold">
                <CheckCircle2 size={14} /> Guardado con éxito
              </div>
            )}

            {!invoiceData ? (
              <button
                onClick={handleOpenFile}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-blue-100"
              >
                {isLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <FileText size={18} />
                )}
                {isLoading ? "Cargando..." : "Abrir Factura XML"}
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
                >
                  <RefreshCw size={16} /> Cerrar Archivo
                </button>
                <button
                  onClick={handleSaveFile}
                  disabled={!hasChanges || isSaving}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white px-5 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-emerald-100"
                >
                  {isSaving ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Save size={18} />
                  )}
                  {isSaving ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-6">
        {!invoiceData ? (
          <div className="flex flex-col items-center justify-center h-[70vh] text-center animate-in slide-in-from-bottom-4">
            <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-xl mb-6 text-slate-200">
              <FileSearch size={64} strokeWidth={1} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">
              Editor Seguro de XML UBL 2.1
            </h2>
            <p className="text-slate-500 mt-2 max-w-sm">
              Abra una factura para extraer sus datos y editar libremente todos
              sus campos.
            </p>
          </div>
        ) : (
          <div className="flex flex-col h-[calc(100vh-160px)] animate-in slide-in-from-bottom-4">
            <div className="flex items-center gap-2 bg-slate-200/50 p-1.5 rounded-xl w-fit mb-6">
              <button
                onClick={() => setActiveTab("preview")}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${
                  activeTab === "preview"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                }`}
              >
                <ReceiptText size={18} />
                Vista de Boleta Completa
              </button>
              <button
                onClick={() => setActiveTab("code")}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${
                  activeTab === "code"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                }`}
              >
                <Code2 size={18} />
                Editor de Código XML
              </button>
            </div>

            <div className="flex-1 relative overflow-hidden">
              {activeTab === "preview" ? (
                <div className="h-full w-full animate-in fade-in duration-300">
                  <InvoicePreview
                    invoiceData={logic.invoiceData}
                    handleGlobalFieldChange={logic.handleGlobalFieldChange}
                  />
                </div>
              ) : (
                <div className="h-full w-full animate-in fade-in duration-300">
                  <XmlCodeEditor
                    xmlContent={logic.xmlContent}
                    setXmlContent={logic.setXmlContent}
                    setHasChanges={logic.setHasChanges}
                    setSaveSuccess={logic.setSaveSuccess}
                    searchTerm={logic.searchTerm}
                    setSearchTerm={logic.setSearchTerm}
                    searchResult={logic.searchResult}
                    handleNextMatch={logic.handleNextMatch}
                    handlePrevMatch={logic.handlePrevMatch}
                    highlightedHtml={logic.highlightedHtml}
                    textareaRef={logic.textareaRef}
                    backdropRef={logic.backdropRef}
                    handleTextareaScroll={logic.handleTextareaScroll}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
        .custom-scrollbar-dark::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar-dark::-webkit-scrollbar-track {
          background: #0d1117;
        }
        .custom-scrollbar-dark::-webkit-scrollbar-thumb {
          background: #30363d;
          border-radius: 4px;
        }
        .custom-scrollbar-dark::-webkit-scrollbar-thumb:hover {
          background: #484f58;
        }
      `}</style>
    </div>
  );
}
