import React from "react";
import {
  ArrowLeft,
  Plus,
  Search,
  FileText,
  Edit3,
  Printer,
  Trash2,
  FileOutput,
  Loader2,
} from "lucide-react";
import { DocumentPreviewPanel } from "../../components/documents/DocumentPreviewPanel";
import { useDocumentCenterLogic } from "../../logic/documents/useDocumentCenterLogic";

export function DocumentCenterPage() {
  const {
    id,
    navigate,
    templates,
    selectedTemplate,
    setSelectedTemplate,
    handleGenerateAndPrint,
    isGenerating,
    isLoading,
  } = useDocumentCenterLogic();

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans">
      <div className="max-w-[1400px] mx-auto space-y-6">
        <div className="flex items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <button
            onClick={() => navigate(id ? `/tramites/${id}` : "/tramites")}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-black text-gray-800 flex items-center gap-3">
              Gestor de Plantillas
              {id && (
                <span className="bg-indigo-100 text-indigo-700 text-sm py-1 px-3 rounded-full font-bold">
                  Procesando Trámite #{id}
                </span>
              )}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {id
                ? `Seleccione la plantilla para generar el documento del trámite actual.`
                : `Administración central de documentos HTML y variables dinámicas.`}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex-1 relative min-w-[250px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar plantilla..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
              />
            </div>

            <div className="flex gap-3">
              {id ? (
                <button
                  onClick={handleGenerateAndPrint}
                  disabled={!selectedTemplate || isGenerating}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {isGenerating ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Printer size={18} />
                  )}
                  {isGenerating ? "Generando PDF..." : "Rellenar e Imprimir"}
                </button>
              ) : (
                <button
                  onClick={() => navigate("/plantillas/new")}
                  className="px-5 py-2.5 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-all flex items-center gap-2 shadow-sm"
                >
                  <Plus size={18} /> Crear Nueva Plantilla
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 xl:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-[650px]">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="font-bold text-gray-800 uppercase tracking-wider text-sm flex items-center gap-2">
                <FileText size={16} className="text-blue-600" /> Archivos Base (
                {templates.length})
              </h2>
            </div>

            <div className="divide-y divide-gray-100 overflow-y-auto flex-1 p-2 space-y-2">
              {isLoading ? (
                <div className="p-8 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
                </div>
              ) : (
                templates.map((tpl) => (
                  <div
                    key={tpl.id}
                    onClick={() => setSelectedTemplate(tpl)}
                    className={`p-3 cursor-pointer rounded-xl transition-all border-2 ${
                      selectedTemplate?.id === tpl.id
                        ? "bg-blue-50 border-blue-500 shadow-sm"
                        : "border-transparent hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded-lg ${selectedTemplate?.id === tpl.id ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500"}`}
                      >
                        <FileOutput size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3
                          className={`text-sm font-bold truncate ${selectedTemplate?.id === tpl.id ? "text-blue-900" : "text-gray-800"}`}
                        >
                          {tpl.nombre}
                        </h3>
                        <p className="text-[10px] text-gray-500 font-medium mt-1">
                          Actualizado: {tpl.ultima_edicion}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="lg:col-span-8 xl:col-span-9 flex flex-col">
            <DocumentPreviewPanel document={selectedTemplate} />

            {!id && selectedTemplate && (
              <div className="mt-4 bg-white border border-gray-100 rounded-2xl shadow-sm p-4 flex justify-between items-center">
                <div className="text-sm font-medium text-gray-600">
                  <span className="font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded">
                    {selectedTemplate.variables_mapeadas}
                  </span>{" "}
                  variables detectadas en el diseño.
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      navigate(`/plantillas/${selectedTemplate.id}/edit`)
                    }
                    className="px-4 py-2 text-sm font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center gap-2 transition-colors border border-blue-100"
                  >
                    <Edit3 size={16} /> Editar Diseño (Visual)
                  </button>
                  <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
