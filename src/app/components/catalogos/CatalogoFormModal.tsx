import React, { useState, useEffect } from "react";
import { sileo } from "sileo";

interface CatalogoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  type: "tramites" | "situaciones";
  initialData: any | null;
}

export const CatalogoFormModal: React.FC<CatalogoFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  type,
  initialData,
}) => {
  const [formData, setFormData] = useState({
    id: "",
    nombre: "",
    colorHex: "#cccccc",
    activo: true,
  });

  useEffect(() => {
    if (isOpen) {
      setFormData(
        initialData || {
          id: "",
          nombre: "",
          colorHex: "#cccccc",
          activo: true,
        },
      );
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre.trim()) {
      sileo.error({ title: "El nombre es obligatorio" });
      return;
    }
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {initialData ? "Editar" : "Nuevo"}{" "}
            {type === "tramites" ? "Tipo de Trámite" : "Estado de Situación"}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Nombre
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) =>
                setFormData({ ...formData, nombre: e.target.value })
              }
              placeholder="Ej. Transferencia Vehicular"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-transparent text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>

          {type === "situaciones" && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Color (Hexadecimal)
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  value={formData.colorHex}
                  onChange={(e) =>
                    setFormData({ ...formData, colorHex: e.target.value })
                  }
                  className="h-10 w-14 rounded cursor-pointer border-0 p-0"
                />
                <input
                  type="text"
                  value={formData.colorHex}
                  onChange={(e) =>
                    setFormData({ ...formData, colorHex: e.target.value })
                  }
                  className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-transparent text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono uppercase"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Estado Activo
            </label>
            <button
              type="button"
              role="switch"
              aria-checked={formData.activo}
              onClick={() =>
                setFormData({ ...formData, activo: !formData.activo })
              }
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${formData.activo ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-700"}`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${formData.activo ? "translate-x-5" : "translate-x-0"}`}
              />
            </button>
          </div>

          <div className="pt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors shadow-sm"
            >
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
