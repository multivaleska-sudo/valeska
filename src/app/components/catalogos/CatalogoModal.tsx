import React, { useState } from "react";
import { X, Layers, Loader2, CheckCircle2 } from "lucide-react";
import Database from "@tauri-apps/plugin-sql";

interface CatalogoModalProps {
  tipo: "tipo_tramite" | "situacion";
  onClose: () => void;
  onSuccess: (nuevoNombre: string) => void;
}

export function CatalogoModal({
  tipo,
  onClose,
  onSuccess,
}: CatalogoModalProps) {
  const [nombre, setNombre] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const titulo =
    tipo === "tipo_tramite"
      ? "Nuevo Tipo de Trámite"
      : "Nueva Situación / Estado";
  const tabla =
    tipo === "tipo_tramite" ? "catalogo_tipos_tramite" : "catalogo_situaciones";

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    setIsSaving(true);
    try {
      const sqlite = await Database.load("sqlite:valeska.db");
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const nombreLimpio = nombre.trim().toUpperCase();

      await sqlite.execute(
        `INSERT INTO ${tabla} (id, nombre, activo, created_at, updated_at) VALUES ($1, $2, 1, $3, $4)`,
        [id, nombreLimpio, now, now],
      );

      window.dispatchEvent(
        new CustomEvent("valeska_request_sync", {
          detail: {
            title: "Nuevo Catálogo Agregado",
            details: `Se agregó: ${nombreLimpio}`,
          },
        }),
      );

      setShowSuccess(true);
      setTimeout(() => onSuccess(nombreLimpio), 1000);
    } catch (error: any) {
      console.error(error);
      alert("Error al guardar. Es posible que este nombre ya exista.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-blue-600 px-5 py-4 flex items-center justify-between">
          <h3 className="font-bold text-white flex items-center gap-2">
            <Layers size={18} /> {titulo}
          </h3>
          <button
            onClick={onClose}
            className="text-blue-100 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {showSuccess ? (
          <div className="p-8 flex flex-col items-center justify-center text-center">
            <CheckCircle2
              size={48}
              className="text-green-500 mb-3 animate-bounce"
            />
            <p className="text-lg font-bold text-gray-800">
              ¡Registrado con éxito!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="p-5">
            <div className="mb-5">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Descripción / Nombre
              </label>
              <input
                type="text"
                required
                autoFocus
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. LEVANTAMIENTO DE GARANTÍA"
                className="w-full border-2 border-gray-200 rounded-xl h-12 px-4 text-sm font-bold text-gray-700 uppercase outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors flex justify-center items-center gap-2 disabled:opacity-50 shadow-md shadow-blue-200"
              >
                {isSaving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  "Guardar Catálogo"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
