import React, { useState } from "react";
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
  X,
  AlertTriangle,
} from "lucide-react";
import { DocumentPreviewPanel } from "../../components/documents/DocumentPreviewPanel";
import { useDocumentCenterLogic } from "../../logic/documents/useDocumentCenterLogic";

export function DocumentCenterPage() {
  const {
    id,
    navigate,
    filteredTemplates,
    searchTerm,
    setSearchTerm,
    selectedTemplate,
    setSelectedTemplate,
    handleGenerateAndPrint,
    isGenerating,
    isLoading,
    handleCreateNewTemplate,
    handleDeleteTemplate,
  } = useDocumentCenterLogic();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const defaultTemplateHtml = `
<div style="background: white; width: 21cm; min-height: 29.7cm; padding: 2cm; box-sizing: border-box; font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 1.5; color: #000; margin: 0 auto; border: 1px dashed #ccc; position: relative;" id="visual-form-container">

    <!-- HEADER -->
    <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="font-weight: bold; text-decoration: underline; position: absolute; top: 2.03cm; left: 2.03cm; width: 640.53px; font-size: 17px; height: auto; margin: 0px;">PLANTILLA BASE</h2>
    </div>
    
    <!-- CONTENIDO -->
    
        <div style="margin: 0px; position: absolute; top: 3.25cm; left: 2.03cm; width: 640.53px; font-size: 14px; font-weight: normal; height: auto;">
            Hola, para editar esta plantilla usa <strong>contenido simple (divs, texto, variables)</strong>.
        </div>
        
        <div style="margin: 0px; position: absolute; top: 4.2cm; left: 2.03cm; width: 640.53px; font-size: 14px; font-weight: normal; height: auto;">
            Luego podrás ajustar posiciones en el <strong>modo visual</strong>
        </div>
        
        <div style="margin: 0px; position: absolute; top: 5.15cm; left: 2.03cm; width: 640.53px; font-size: 14px; font-weight: normal; height: auto;">
            Variables disponibles:
            <br>
            
        </div>
<code style="position: absolute; top: 6.16cm; left: 2.03cm; width: 144px; font-size: 14px; font-weight: normal; height: auto; margin: 0px;">{{CLIENTE_NOMBRE}}</code>, <code style="position: absolute; top: 6.16cm; left: 6.05cm; width: 144px; font-size: 14px; font-weight: normal; height: auto; margin: 0px;">{{VEHICULO_PLACA}}</code>
        
        <div style="margin: 0px; color: rgb(102, 102, 102); position: absolute; top: 6.66cm; left: 2.03cm; width: 640.53px; font-size: 14px; font-weight: normal; height: auto;">
            Este contenido es solo guía. Puedes eliminarlo.
        </div>
    

    <!-- EJEMPLO IMÁGENES -->
    <div style="margin: 0px; position: absolute; top: 8.01cm; left: 2.03cm; width: 640.53px; font-size: 14px; font-weight: normal; height: auto;">
        Ejemplo de uso de imágenes:
    </div>

    <div style="display: flex; gap: 20px; margin-top: 10px;">
        <div style="width: 230px;">
            <img src="/image/logo_aap.jpg" style="width: 230px; position: absolute; top: 8.83cm; left: 2.03cm; height: 93.09px; margin: 0px;" onerror="this.style.display='none';">
        </div>
        
        <div style="width: 210px;">
            <img src="/image/logo_Notaria.jpg" style="width: 210px; position: absolute; top: 16cm; left: 11.8cm; height: 83.16px; margin: 0px;" onerror="this.style.display='none';">
        </div>
    </div>

</div>

`;

  const onCreateSubmit = async () => {
    if (!newTemplateName.trim()) return;
    setIsCreating(true);
    try {
      if (handleCreateNewTemplate) {
        await handleCreateNewTemplate(newTemplateName, defaultTemplateHtml);
      } else {
        console.warn(
          "Falta implementar handleCreateNewTemplate en useDocumentCenterLogic",
        );
      }
    } finally {
      setIsCreating(false);
      setIsModalOpen(false);
      setNewTemplateName("");
    }
  };

  const onConfirmDelete = async () => {
    if (!selectedTemplate) return;
    setIsDeleting(true);
    try {
      if (handleDeleteTemplate) {
        await handleDeleteTemplate(selectedTemplate.id);
      }
      setIsDeleteModalOpen(false);
    } catch (error) {
      alert("Hubo un error intentando eliminar la plantilla.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans relative">
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* ENCABEZADO */}
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
                ? "Seleccione la plantilla para generar el documento del trámite actual."
                : "Administración central de documentos HTML y variables dinámicas."}
            </p>
          </div>
        </div>

        {/* BARRA DE HERRAMIENTAS Y BÚSQUEDA */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex-1 relative min-w-[250px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
                  onClick={() => setIsModalOpen(true)}
                  className="px-5 py-2.5 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-all flex items-center gap-2 shadow-sm"
                >
                  <Plus size={18} /> Crear Nueva Plantilla
                </button>
              )}
            </div>
          </div>
        </div>

        {/* LISTA Y VISTA PREVIA */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* SIDEBAR DE PLANTILLAS */}
          <div className="lg:col-span-4 xl:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-[650px]">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="font-bold text-gray-800 uppercase tracking-wider text-sm flex items-center gap-2">
                <FileText size={16} className="text-blue-600" /> Archivos Base (
                {filteredTemplates?.length || 0})
              </h2>
            </div>

            <div className="divide-y divide-gray-100 overflow-y-auto flex-1 p-2 space-y-2">
              {isLoading ? (
                <div className="p-8 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
                </div>
              ) : filteredTemplates?.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm font-medium">
                  No se encontraron plantillas
                </div>
              ) : (
                filteredTemplates?.map((tpl) => (
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
                          Actualizado: {tpl.ultima_edicion || "Reciente"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* PANEL PRINCIPAL */}
          <div className="lg:col-span-8 xl:col-span-9 flex flex-col">
            <DocumentPreviewPanel document={selectedTemplate} />

            {!id && selectedTemplate && (
              <div className="mt-4 bg-white border border-gray-100 rounded-2xl shadow-sm p-4 flex justify-between items-center">
                <div className="text-sm font-medium text-gray-600">
                  <span className="font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded">
                    {selectedTemplate.variables_mapeadas || 0}
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
                  <button
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                    title="Eliminar plantilla"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-all">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <FileText size={18} className="text-blue-600" /> Nombrar
                Plantilla
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                ¿Qué nombre tendrá este documento?
              </label>
              <input
                type="text"
                autoFocus
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onCreateSubmit()}
                placeholder="Ej. Formulario SUNARP..."
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
              />
              <p className="text-xs text-gray-500 mt-3 flex gap-2">
                <span className="text-blue-500 font-bold shrink-0">*</span>
                Se inyectará un texto de guía base con instrucciones para la IA
                automáticamente.
              </p>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                disabled={isCreating}
                className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={onCreateSubmit}
                disabled={!newTemplateName.trim() || isCreating}
                className="px-6 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm disabled:opacity-50 flex items-center gap-2"
              >
                {isCreating ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Plus size={16} />
                )}
                Crear y Editar
              </button>
            </div>
          </div>
        </div>
      )}

      {isDeleteModalOpen && selectedTemplate && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-all">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-red-100 flex justify-between items-center bg-red-50/50">
              <h3 className="text-lg font-bold text-red-600 flex items-center gap-2">
                <AlertTriangle size={18} /> Eliminar Plantilla
              </h3>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 text-center">
              <p className="text-sm text-gray-700">
                ¿Estás seguro de que deseas eliminar permanentemente la
                plantilla <br />
                <strong className="text-gray-900 text-base">
                  {selectedTemplate.nombre}
                </strong>
                ?
              </p>
              <p className="text-xs text-red-500 font-medium mt-3">
                Esta acción no se puede deshacer.
              </p>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={onConfirmDelete}
                disabled={isDeleting}
                className="px-6 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-sm disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Trash2 size={16} />
                )}
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
