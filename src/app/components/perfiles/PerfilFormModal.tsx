import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { PerfilGestor } from "../../logic/perfiles/usePerfilesLogic";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<PerfilGestor>) => void;
  editingPerfil: PerfilGestor | null;
}

export function PerfilFormModal({
  isOpen,
  onClose,
  onSave,
  editingPerfil,
}: Props) {
  const [formData, setFormData] = useState<Partial<PerfilGestor>>({
    calidad: "",
    nombre: "",
    concesionario: "",
    importador: "",
  });

  useEffect(() => {
    if (editingPerfil) {
      setFormData(editingPerfil);
    } else {
      setFormData({
        calidad: "GESTOR",
        nombre: "",
        concesionario: "",
        importador: "",
      });
    }
  }, [editingPerfil, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-lg font-bold text-gray-800">
            {editingPerfil ? "Editar Perfil" : "Nuevo Perfil de Gestor"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Calidad <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.calidad || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  calidad: e.target.value.toUpperCase(),
                })
              }
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
              placeholder="Ej. GESTOR"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Nombre (Razón Social) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.nombre || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  nombre: e.target.value.toUpperCase(),
                })
              }
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              placeholder="Razón Social del Perfil"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Concesionario
            </label>
            <input
              type="text"
              value={formData.concesionario || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  concesionario: e.target.value.toUpperCase(),
                })
              }
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              placeholder="Opcional"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Importador
            </label>
            <input
              type="text"
              value={formData.importador || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  importador: e.target.value.toUpperCase(),
                })
              }
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              placeholder="Opcional"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => onSave(formData)}
            disabled={!formData.calidad || !formData.nombre}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm shadow-blue-600/20 transition-all"
          >
            Guardar Perfil
          </button>
        </div>
      </div>
    </div>
  );
}
