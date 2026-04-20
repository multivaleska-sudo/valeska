import React, { useState } from "react";
import {
  MessageCircle,
  Plus,
  Search,
  Edit3,
  Trash2,
  Copy,
  CheckCircle2,
  X,
  AlertTriangle,
  Save,
  Loader2,
} from "lucide-react";
import {
  useWasapLogic,
  MessageTemplate,
} from "../../logic/wasap/useWasaplogic";

export function WasapPage() {
  // Conexión con la BD a través del hook lógico
  const { templates, isLoading, saveTemplate, deleteTemplate } =
    useWasapLogic();

  const [searchTerm, setSearchTerm] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Estados para el Modal de Formulario (Crear/Editar)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", content: "" });

  // Estados para el Modal de Eliminación
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingTemplate, setDeletingTemplate] =
    useState<MessageTemplate | null>(null);

  // Filtrado en memoria (Solo por nombre)
  const filteredTemplates = templates.filter((tpl) =>
    tpl.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // --- MANEJADORES DE ACCIONES ---

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({ name: "", content: "" });
    setIsFormOpen(true);
  };

  const openEditModal = (template: MessageTemplate) => {
    setEditingId(template.id);
    setFormData({ name: template.name, content: template.content });
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.content.trim()) return;

    const success = await saveTemplate(
      { name: formData.name, content: formData.content },
      editingId,
    );

    if (success) {
      setIsFormOpen(false);
    }
  };

  const openDeleteModal = (template: MessageTemplate) => {
    setDeletingTemplate(template);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (deletingTemplate) {
      await deleteTemplate(deletingTemplate.id);
    }
    setIsDeleteOpen(false);
    setDeletingTemplate(null);
  };

  return (
    <div className="min-h-screen bg-[#F6F7FB] p-6 sm:p-8 font-sans animate-in fade-in duration-500 relative">
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* ENCABEZADO */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-100 p-4 rounded-2xl text-emerald-600">
              <MessageCircle size={32} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-800 tracking-tight">
                Plantillas de WhatsApp
              </h1>
              <p className="text-sm text-gray-500 font-medium mt-1">
                Administra los mensajes predefinidos para enviar a clientes.
              </p>
            </div>
          </div>

          <button
            onClick={openCreateModal}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-200 active:scale-95"
          >
            <Plus size={18} strokeWidth={3} /> Nueva Plantilla
          </button>
        </div>

        {/* BARRA DE BÚSQUEDA */}
        <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-2xl border border-gray-200 shadow-sm w-full max-w-md">
          <Search className="text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por nombre..."
            className="w-full bg-transparent border-none outline-none text-sm font-medium text-gray-700 placeholder:text-gray-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* GRILLA DE TARJETAS */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pt-2">
            {filteredTemplates.length > 0 ? (
              filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full group"
                >
                  {/* Cabecera Tarjeta */}
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-black text-gray-800 text-lg leading-tight line-clamp-2 pr-4">
                      {template.name}
                    </h3>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 bg-gray-50 p-1 rounded-xl">
                      <button
                        onClick={() => openEditModal(template)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => openDeleteModal(template)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Contenido del Mensaje (Burbuja chat) */}
                  <div className="flex-1 bg-[#E8F8F5] text-[#115E59] p-4 rounded-2xl rounded-tl-sm text-sm font-medium leading-relaxed relative mb-6 whitespace-pre-wrap">
                    {template.content}
                  </div>

                  {/* Footer Tarjeta */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      {new Date(template.createdAt).toLocaleDateString()}
                    </span>

                    <button
                      onClick={() => handleCopy(template.content, template.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm
                        ${
                          copiedId === template.id
                            ? "bg-emerald-500 text-white shadow-emerald-200"
                            : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                        }
                      `}
                    >
                      {copiedId === template.id ? (
                        <>
                          <CheckCircle2 size={14} /> Copiado
                        </>
                      ) : (
                        <>
                          <Copy size={14} /> Copiar Mensaje
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-20 text-center">
                <div className="bg-gray-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle size={40} className="text-gray-300" />
                </div>
                <h3 className="text-lg font-bold text-gray-700">
                  Sin resultados
                </h3>
                <p className="text-gray-500 mt-1">
                  No se encontró ninguna plantilla.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL DE CREAR / EDITAR */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-emerald-600 p-6 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <MessageCircle size={24} />
                <h2 className="text-xl font-black uppercase tracking-tight">
                  {editingId ? "Editar Mensaje" : "Nuevo Mensaje"}
                </h2>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-emerald-100 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest">
                  Título de la Plantilla
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Saludo Inicial..."
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest flex justify-between">
                  <span>Contenido del Mensaje</span>
                  <span className="text-gray-400 font-normal normal-case tracking-normal">
                    Solo texto plano
                  </span>
                </label>
                <textarea
                  required
                  rows={6}
                  placeholder="Escribe el mensaje aquí..."
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all resize-none"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all flex justify-center items-center gap-2 shadow-lg shadow-emerald-200"
                >
                  <Save size={18} />
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE ELIMINAR */}
      {isDeleteOpen && deletingTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border-2 border-red-500">
            <div className="p-8 text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-2 animate-pulse">
                <AlertTriangle size={32} />
              </div>
              <h2 className="text-2xl font-black text-gray-800 tracking-tight">
                ¿Eliminar Plantilla?
              </h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                Estás a punto de borrar la plantilla{" "}
                <strong className="text-gray-800">
                  "{deletingTemplate.name}"
                </strong>
                . Esta acción no se puede deshacer.
              </p>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setIsDeleteOpen(false)}
                className="flex-1 py-3 rounded-xl font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-lg shadow-red-200 flex justify-center items-center gap-2"
              >
                <Trash2 size={18} />
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
