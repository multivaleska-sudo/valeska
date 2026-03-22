import React, { useState } from "react";
import { X, Building2, Loader2, CheckCircle2 } from "lucide-react";
import Database from "@tauri-apps/plugin-sql";

interface EmpresaModalProps {
  onClose: () => void;
  onSuccess: (empresaName: string) => void;
}

export function EmpresaModal({ onClose, onSuccess }: EmpresaModalProps) {
  const [ruc, setRuc] = useState("");
  const [razonSocial, setRazonSocial] = useState("");
  const [direccion, setDireccion] = useState("");
  const [representantes, setRepresentantes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (ruc.length !== 11) {
      alert("El RUC debe tener exactamente 11 dígitos.");
      return;
    }

    setIsSaving(true);
    try {
      const sqlite = await Database.load("sqlite:valeska.db");
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const razonLimpia = razonSocial.trim().toUpperCase();

      await sqlite.execute(
        `INSERT INTO empresas_gestoras (id, ruc, razon_social, direccion, representantes, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          id,
          ruc,
          razonLimpia,
          direccion.toUpperCase(),
          representantes.toUpperCase(),
          now,
          now,
        ],
      );

      window.dispatchEvent(
        new CustomEvent("valeska_request_sync", {
          detail: {
            title: "Nueva Empresa Gestora",
            details: `Se agregó: ${razonLimpia}`,
          },
        }),
      );

      setShowSuccess(true);
      setTimeout(() => onSuccess(`${ruc} - ${razonLimpia}`), 1000);
    } catch (error: any) {
      console.error(error);
      alert("Error al guardar. Es posible que este RUC ya esté registrado.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-emerald-600 px-5 py-4 flex items-center justify-between">
          <h3 className="font-bold text-white flex items-center gap-2">
            <Building2 size={18} /> Registrar Nueva Empresa
          </h3>
          <button
            onClick={onClose}
            className="text-emerald-100 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {showSuccess ? (
          <div className="p-8 flex flex-col items-center justify-center text-center">
            <CheckCircle2
              size={48}
              className="text-emerald-500 mb-3 animate-bounce"
            />
            <p className="text-lg font-bold text-gray-800">
              ¡Empresa registrada con éxito!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="p-5 space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  RUC
                </label>
                <input
                  type="text"
                  required
                  maxLength={11}
                  autoFocus
                  value={ruc}
                  onChange={(e) => setRuc(e.target.value.replace(/\D/g, ""))}
                  className="w-full border-2 border-gray-200 rounded-xl h-10 px-3 text-sm font-bold outline-none focus:border-emerald-500 transition-all"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Razón Social
                </label>
                <input
                  type="text"
                  required
                  value={razonSocial}
                  onChange={(e) => setRazonSocial(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl h-10 px-3 text-sm font-bold uppercase outline-none focus:border-emerald-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Dirección de la Empresa
              </label>
              <input
                type="text"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                placeholder="Ej. JR. TACTA 335 DISTRITO..."
                className="w-full border-2 border-gray-200 rounded-xl h-10 px-3 text-sm uppercase outline-none focus:border-emerald-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Apoderados / Representantes Legales
              </label>
              <textarea
                value={representantes}
                onChange={(e) => setRepresentantes(e.target.value)}
                placeholder="Ej. JUAN PEREZ, identificado con D.N.I. N° 12345678 y MARIA GOMEZ..."
                className="w-full border-2 border-gray-200 rounded-xl p-3 text-sm uppercase outline-none focus:border-emerald-500 transition-all h-20 resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving || ruc.length !== 11 || !razonSocial}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-colors flex justify-center items-center gap-2 shadow-md"
              >
                {isSaving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  "Guardar Empresa"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
