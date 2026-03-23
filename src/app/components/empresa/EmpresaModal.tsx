import React, { useState, useEffect } from "react";
import { X, Building2, Loader2, CheckCircle2, Plus } from "lucide-react";
import Database from "@tauri-apps/plugin-sql";
import {
  parseRepresentantes,
  stringifyRepresentantes,
} from "../tramites/ModernFormSections";

interface EmpresaModalProps {
  initialRuc?: string;
  onClose: () => void;
  onSuccess: (empresaName: string, representantes: string) => void;
}

export function EmpresaModal({
  initialRuc = "",
  onClose,
  onSuccess,
}: EmpresaModalProps) {
  const [empresaId, setEmpresaId] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const [ruc, setRuc] = useState(initialRuc);
  const [razonSocial, setRazonSocial] = useState("");
  const [direccion, setDireccion] = useState("");
  const [reps, setReps] = useState<{ dni: string; nombre: string }[]>([
    { dni: "", nombre: "" },
  ]);

  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Auto-cargar datos si el RUC tiene 11 dígitos
  useEffect(() => {
    const fetchEmpresa = async () => {
      if (ruc.length === 11) {
        try {
          const sqlite = await Database.load("sqlite:valeska.db");
          const res: any[] = await sqlite.select(
            "SELECT * FROM empresas_gestoras WHERE ruc = $1",
            [ruc],
          );
          if (res.length > 0) {
            setEmpresaId(res[0].id);
            setRazonSocial(res[0].razon_social);
            setDireccion(res[0].direccion || "");
            setReps(parseRepresentantes(res[0].representantes || ""));
            setIsEditing(true);
          } else {
            setIsEditing(false);
          }
        } catch (error) {}
      } else {
        setIsEditing(false);
      }
    };
    fetchEmpresa();
  }, [ruc]);

  const updateRep = async (
    index: number,
    field: "dni" | "nombre",
    val: string,
  ) => {
    const newReps = [...reps];
    newReps[index][field] = val;
    setReps(newReps);

    // Autocompletar DNI
    if (field === "dni" && (val.length === 8 || val.length === 9)) {
      try {
        const sqlite = await Database.load("sqlite:valeska.db");
        let foundStr = "";
        const resEmp: any[] = await sqlite.select(
          `SELECT representantes FROM empresas_gestoras WHERE representantes LIKE '%${val}%' LIMIT 1`,
        );
        if (resEmp.length > 0 && resEmp[0].representantes)
          foundStr = resEmp[0].representantes;
        else {
          const resTram: any[] = await sqlite.select(
            `SELECT presentante_persona FROM tramite_detalles WHERE presentante_persona LIKE '%${val}%' LIMIT 1`,
          );
          if (resTram.length > 0 && resTram[0].presentante_persona)
            foundStr = resTram[0].presentante_persona;
        }
        if (foundStr) {
          const foundReps = parseRepresentantes(foundStr);
          const matchingRep = foundReps.find((r) => r.dni === val);
          if (matchingRep && matchingRep.nombre) {
            newReps[index].nombre = matchingRep.nombre;
            setReps([...newReps]);
          }
        }
      } catch (e) {}
    }
  };

  const addRep = () => setReps([...reps, { dni: "", nombre: "" }]);
  const removeRep = (index: number) => {
    const newReps = reps.filter((_, i) => i !== index);
    if (newReps.length === 0) newReps.push({ dni: "", nombre: "" });
    setReps(newReps);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (ruc.length !== 11) {
      alert("El RUC debe tener exactamente 11 dígitos.");
      return;
    }

    setIsSaving(true);
    try {
      const sqlite = await Database.load("sqlite:valeska.db");
      const now = new Date().toISOString();
      const razonLimpia = razonSocial.trim().toUpperCase();
      const representantesFinal = stringifyRepresentantes(reps);

      if (isEditing && empresaId) {
        await sqlite.execute(
          `UPDATE empresas_gestoras SET razon_social = $1, direccion = $2, representantes = $3, updated_at = $4 WHERE id = $5`,
          [
            razonLimpia,
            direccion.toUpperCase(),
            representantesFinal,
            now,
            empresaId,
          ],
        );
      } else {
        const newId = crypto.randomUUID();
        await sqlite.execute(
          `INSERT INTO empresas_gestoras (id, ruc, razon_social, direccion, representantes, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            newId,
            ruc,
            razonLimpia,
            direccion.toUpperCase(),
            representantesFinal,
            now,
            now,
          ],
        );
      }

      window.dispatchEvent(
        new CustomEvent("valeska_request_sync", {
          detail: {
            title: "Empresa Gestora",
            details: `Se ${isEditing ? "actualizó" : "agregó"}: ${razonLimpia}`,
          },
        }),
      );

      setShowSuccess(true);
      // Retornamos ambos valores para auto-llenar el formulario principal
      setTimeout(
        () => onSuccess(`${ruc} - ${razonLimpia}`, representantesFinal),
        1000,
      );
    } catch (error: any) {
      console.error(error);
      alert("Error al guardar la empresa.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-emerald-600 px-5 py-4 flex items-center justify-between">
          <h3 className="font-bold text-white flex items-center gap-2">
            <Building2 size={18} />{" "}
            {isEditing ? "Editar Empresa" : "Registrar Nueva Empresa"}
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
              ¡Empresa {isEditing ? "actualizada" : "registrada"} con éxito!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="p-6 space-y-5">
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
                  className={`w-full border-2 rounded-xl h-10 px-3 text-sm font-bold outline-none transition-all ${isEditing ? "border-amber-400 bg-amber-50" : "border-gray-200 focus:border-emerald-500"}`}
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
                  onChange={(e) => setRazonSocial(e.target.value.toUpperCase())}
                  className="w-full border-2 border-gray-200 rounded-xl h-10 px-3 text-sm font-bold uppercase outline-none focus:border-emerald-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Dirección Fiscal
              </label>
              <input
                type="text"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value.toUpperCase())}
                placeholder="Ej. JR. TACTA 335 DISTRITO..."
                className="w-full border-2 border-gray-200 rounded-xl h-10 px-3 text-sm uppercase outline-none focus:border-emerald-500 transition-all"
              />
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                Apoderados / Representantes Legales
              </label>
              <div className="space-y-3">
                {reps.map((rep, idx) => (
                  <div key={idx} className="flex gap-2 items-start">
                    <input
                      type="text"
                      placeholder="DNI/CE"
                      maxLength={9}
                      value={rep.dni}
                      onChange={(e) =>
                        updateRep(idx, "dni", e.target.value.replace(/\D/g, ""))
                      }
                      className="w-[110px] font-mono font-bold text-emerald-900 border border-slate-300 rounded-lg h-10 px-3 text-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Nombres Completos..."
                      value={rep.nombre}
                      onChange={(e) =>
                        updateRep(idx, "nombre", e.target.value.toUpperCase())
                      }
                      className="flex-1 font-bold border border-slate-300 rounded-lg h-10 px-3 text-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none uppercase"
                    />
                    <button
                      type="button"
                      onClick={() => removeRep(idx)}
                      className="h-10 w-10 flex shrink-0 items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg border border-transparent transition-colors"
                    >
                      <X size={18} strokeWidth={3} />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addRep}
                className="mt-4 w-max text-xs font-bold text-emerald-700 flex items-center gap-1.5 bg-emerald-100/50 border border-emerald-200 px-4 py-2 rounded-lg hover:bg-emerald-100 transition-colors"
              >
                <Plus size={14} strokeWidth={3} /> Agregar Apoderado
              </button>
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
                className={`flex-1 py-3 text-white text-sm font-bold rounded-xl transition-colors flex justify-center items-center gap-2 shadow-md disabled:opacity-50 ${isEditing ? "bg-amber-600 hover:bg-amber-700" : "bg-emerald-600 hover:bg-emerald-700"}`}
              >
                {isSaving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : isEditing ? (
                  "Actualizar Empresa"
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
