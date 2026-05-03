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
  Loader2,
  Send,
  Smartphone,
} from "lucide-react";
import { open } from "@tauri-apps/plugin-shell";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

import {
  useWasapLogic,
  MessageTemplate,
} from "../../logic/wasap/useWasaplogic";

export function WasapPage() {
  const { templates, isLoading, saveTemplate, deleteTemplate } =
    useWasapLogic();

  const [searchTerm, setSearchTerm] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // --- ESTADOS DE FORMULARIO ---
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", content: "" });

  // --- ESTADOS DE ELIMINACIÓN ---
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingTemplate, setDeletingTemplate] =
    useState<MessageTemplate | null>(null);

  // --- ESTADOS WHATSAPP ---
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [targetPhone, setTargetPhone] = useState("");

  const filteredTemplates = (templates || []).filter((tpl) =>
    tpl.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // --- HANDLERS ---
  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
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
    const success = await saveTemplate(formData, editingId);
    if (success) setIsFormOpen(false);
  };

  const openDeleteModal = (template: MessageTemplate) => {
    setDeletingTemplate(template);
    setIsDeleteOpen(true);
  };

  const handleOpenWhatsApp = async () => {
    if (!targetPhone || targetPhone.length < 5) return;
    const cleanPhone = targetPhone.replace(/\D/g, "");
    const url = `https://wa.me/${cleanPhone}`;

    try {
      await open(url);
    } catch (error) {
      window.open(url, "_blank", "noopener,noreferrer");
    }

    setIsWhatsAppModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] p-6 sm:p-10 font-sans animate-in fade-in duration-500">
      {/* Ajustes de CSS para el PhoneInput escalado */}
      <style>{`
        .valeska-phone-input .form-control {
          width: 100% !important;
          height: 60px !important;
          border-radius: 16px !important;
          border: 1px solid #e5e7eb !important;
          font-size: 1.25rem !important;
          font-weight: 700 !important;
          padding-left: 65px !important;
        }
        .valeska-phone-input .flag-dropdown {
          border-radius: 16px 0 0 16px !important;
          border: 1px solid #e5e7eb !important;
          border-right: none !important;
          width: 55px !important;
        }
        .valeska-phone-input .selected-flag {
          width: 55px !important;
          padding-left: 12px !important;
        }
      `}</style>

      <div className="max-w-[1200px] mx-auto space-y-8">
        {/* HEADER ESCALADO */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2rem] shadow-sm border border-gray-200">
          <div className="flex items-center gap-5">
            <div className="bg-emerald-500/10 p-4 rounded-2xl text-emerald-600">
              <MessageCircle size={36} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
                WhatsApp Valeska
              </h1>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-[0.2em] mt-1">
                Central de Mensajería Notarial
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setTargetPhone("51");
                setIsWhatsAppModalOpen(true);
              }}
              className="bg-[#25D366] hover:bg-[#1fae53] text-white px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-wider flex items-center gap-3 transition-all shadow-lg shadow-green-100 active:scale-95"
            >
              <Smartphone size={18} strokeWidth={2.5} />
              Enviar Mensaje
            </button>

            <button
              onClick={openCreateModal}
              className="bg-gray-800 hover:bg-gray-900 text-white px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-wider flex items-center gap-3 transition-all active:scale-95"
            >
              <Plus size={18} strokeWidth={3} />
              Nueva Plantilla
            </button>
          </div>
        </div>

        {/* BUSCADOR MÁS GRANDE */}
        <div className="flex items-center gap-4 bg-white px-6 py-4 rounded-2xl border border-gray-200 shadow-sm w-full max-w-lg focus-within:ring-4 focus-within:ring-emerald-500/5 transition-all">
          <Search className="text-gray-300" size={24} />
          <input
            type="text"
            placeholder="BUSCAR PLANTILLA..."
            className="w-full bg-transparent border-none outline-none text-base font-bold text-gray-600 placeholder:text-gray-200 uppercase tracking-tight"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* GRID DE TARJETAS MÁS ROBUSTO */}
        {isLoading ? (
          <div className="flex flex-col justify-center items-center py-32 space-y-4">
            <Loader2
              className="w-12 h-12 animate-spin text-emerald-500"
              strokeWidth={3}
            />
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
              Cargando base...
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="bg-white rounded-[2rem] p-8 border border-gray-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group"
              >
                <div className="flex justify-between items-start mb-5">
                  <h3 className="font-black text-gray-800 text-lg uppercase tracking-tight leading-tight pr-10">
                    {template.name}
                  </h3>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                    <button
                      onClick={() => openEditModal(template)}
                      className="p-2 text-gray-300 hover:text-blue-500 transition-colors"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button
                      onClick={() => openDeleteModal(template)}
                      className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="flex-1 bg-gray-50 text-gray-600 p-6 rounded-2xl text-sm font-semibold leading-relaxed mb-6 whitespace-pre-wrap border border-gray-100 italic">
                  {template.content}
                </div>

                <div className="flex items-center justify-between pt-5 border-t border-gray-100 mt-auto">
                  <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
                    {template.createdAt
                      ? new Date(template.createdAt).toLocaleDateString()
                      : "REC"}
                  </span>

                  <button
                    onClick={() => handleCopy(template.content, template.id)}
                    className={`flex items-center gap-3 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all
                      ${
                        copiedId === template.id
                          ? "bg-emerald-500 text-white shadow-lg shadow-emerald-100 scale-105"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }
                    `}
                  >
                    {copiedId === template.id ? (
                      <CheckCircle2 size={14} strokeWidth={3} />
                    ) : (
                      <Copy size={14} strokeWidth={2.5} />
                    )}
                    {copiedId === template.id ? "Copiado" : "Copiar"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 📱 MODAL WHATSAPP - MÁS GRANDE Y ANCHO */}
      {isWhatsAppModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div
            className="absolute inset-0 bg-gray-900/50 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => setIsWhatsAppModalOpen(false)}
          ></div>

          <div className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden relative z-10 animate-in zoom-in-95 duration-200 border border-gray-100">
            <div className="bg-[#25D366] p-8 text-white flex justify-between items-center shadow-lg">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-2xl">
                  <Send size={28} strokeWidth={2.5} />
                </div>
                <h2 className="text-2xl font-black uppercase tracking-tight">
                  Chat de WhatsApp
                </h2>
              </div>
              <button
                onClick={() => setIsWhatsAppModalOpen(false)}
                className="hover:bg-white/20 rounded-full p-2 transition-all active:scale-90"
              >
                <X size={32} strokeWidth={2.5} />
              </button>
            </div>

            <div className="p-10 space-y-10">
              <div className="space-y-4">
                <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] ml-2">
                  Número del Cliente
                </label>

                <div className="valeska-phone-input shadow-sm">
                  <PhoneInput
                    country={"pe"}
                    value={targetPhone}
                    onChange={(phone) => setTargetPhone(phone)}
                    placeholder="999 888 777"
                    enableSearch={true}
                    containerClass="!w-full"
                    inputClass="!w-full !h-[70px] !rounded-2xl !border-gray-200 !text-2xl !font-black !text-gray-800"
                    buttonClass="!rounded-l-2xl !border-gray-200 !bg-gray-50 !px-4"
                  />
                </div>
              </div>

              <div className="bg-blue-50 p-6 rounded-2xl flex gap-5 items-start border border-blue-100">
                <AlertTriangle
                  size={24}
                  className="text-blue-500 shrink-0 mt-0.5"
                />
                <p className="text-xs text-blue-800 font-bold uppercase leading-relaxed tracking-tight">
                  Recuerda pegar el mensaje copiado al abrir el chat. El sistema
                  abrirá la aplicación de WhatsApp directamente.
                </p>
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  onClick={() => setIsWhatsAppModalOpen(false)}
                  className="flex-1 py-5 rounded-2xl font-bold text-gray-400 bg-gray-50 hover:bg-gray-100 transition-all uppercase text-xs tracking-widest"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleOpenWhatsApp}
                  disabled={!targetPhone || targetPhone.length < 5}
                  className="flex-[1.5] py-5 rounded-2xl font-black text-white bg-[#25D366] hover:bg-[#1fae53] transition-all flex justify-center items-center gap-4 shadow-xl shadow-green-100 disabled:opacity-30 disabled:grayscale uppercase text-xs tracking-widest"
                >
                  Abrir WhatsApp
                  <Send size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🧾 MODAL FORMULARIO CRUD - MÁS AMPLIO */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div
            className="absolute inset-0 bg-gray-900/50 backdrop-blur-md"
            onClick={() => setIsFormOpen(false)}
          ></div>
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden relative z-10 animate-in zoom-in-95 duration-200">
            <div className="bg-gray-800 p-8 text-white flex justify-between items-center">
              <div className="flex items-center gap-4">
                <Edit3 size={24} />
                <h2 className="text-2xl font-black uppercase tracking-tight">
                  {editingId ? "Editar Plantilla" : "Nueva Plantilla"}
                </h2>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="hover:bg-white/10 rounded-full p-2"
              >
                <X size={28} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-10 space-y-8">
              <div className="space-y-3">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-2">
                  Título Identificador
                </label>
                <input
                  type="text"
                  required
                  placeholder="NOMBRE..."
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-6 py-5 bg-gray-50 border border-gray-200 rounded-2xl text-base font-bold uppercase focus:ring-4 focus:ring-gray-100 outline-none transition-all"
                />
              </div>

              <div className="space-y-3">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-2">
                  Cuerpo del Mensaje
                </label>
                <textarea
                  required
                  rows={10}
                  placeholder="ESCRIBE EL TEXTO AQUÍ..."
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  className="w-full px-6 py-6 bg-gray-50 border border-gray-200 rounded-2xl text-base font-medium focus:ring-4 focus:ring-gray-100 outline-none resize-none transition-all"
                />
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="flex-1 py-5 rounded-2xl font-bold text-gray-400 bg-gray-50 hover:bg-gray-100 transition-all uppercase text-xs tracking-widest"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-5 rounded-2xl font-black text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 uppercase text-xs tracking-widest"
                >
                  Guardar Plantilla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ❌ MODAL ELIMINAR */}
      {isDeleteOpen && deletingTemplate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div
            className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
            onClick={() => setIsDeleteOpen(false)}
          ></div>
          <div className="bg-white rounded-[2.5rem] w-full max-w-[380px] shadow-2xl relative z-10 animate-in zoom-in-95 duration-200 p-10 text-center">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-red-100 shadow-inner">
              <Trash2 size={40} strokeWidth={2.5} />
            </div>
            <h2 className="text-xl font-black text-gray-800 uppercase mb-3">
              ¿Eliminar?
            </h2>
            <p className="text-xs text-gray-400 font-bold uppercase leading-tight mb-10">
              Borrarás permanentemente:
              <br />
              <span className="text-red-500 block mt-3 italic font-black text-sm">
                "{deletingTemplate.name}"
              </span>
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setIsDeleteOpen(false)}
                className="flex-1 py-4 rounded-2xl font-bold text-gray-400 bg-gray-50 uppercase text-xs tracking-widest"
              >
                No
              </button>
              <button
                onClick={async () => {
                  await deleteTemplate(deletingTemplate.id);
                  setIsDeleteOpen(false);
                }}
                className="flex-1 py-4 rounded-2xl font-black text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-100 uppercase text-xs tracking-widest"
              >
                Sí, Borrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
