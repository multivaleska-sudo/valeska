import React, { useState, useEffect } from "react";
import {
  X,
  Building2,
  Loader2,
  CheckCircle2,
  UserCircle,
  Save,
  Plus,
  Trash2,
} from "lucide-react";
import Database from "@tauri-apps/plugin-sql";

interface EmpresaModalProps {
  initialRuc?: string;
  onClose: () => void;
  onSuccess: (empresaName: string, repString?: string) => void;
}

interface RepData {
  id: string;
  dni: string;
  nombres: string;
  primer_apellido: string;
  segundo_apellido: string;
  partida_registral: string;
  oficina_registral: string;
  domicilio: string;
}

const emptyRep: RepData = {
  id: "",
  dni: "",
  nombres: "",
  primer_apellido: "",
  segundo_apellido: "",
  partida_registral: "",
  oficina_registral: "",
  domicilio: "",
};

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

  const [reps, setReps] = useState<RepData[]>([{ ...emptyRep }]);
  const [deletedReps, setDeletedReps] = useState<string[]>([]);

  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const fetchEmpresaYRepresentantes = async () => {
      if (ruc.length === 11 || (initialRuc && initialRuc.length > 0)) {
        try {
          const sqlite = await Database.load("sqlite:valeska.db");

          let res: any[] = [];
          if (ruc.length === 11) {
            res = await sqlite.select(
              "SELECT * FROM empresas_gestoras WHERE ruc = $1 AND deleted_at IS NULL",
              [ruc],
            );
          } else {
            res = await sqlite.select(
              "SELECT * FROM empresas_gestoras WHERE razon_social = $1 AND deleted_at IS NULL",
              [initialRuc],
            );
          }

          if (res.length > 0) {
            const empId = res[0].id;
            setEmpresaId(empId);
            setRuc(res[0].ruc || "");
            setRazonSocial(res[0].razon_social);
            setDireccion(res[0].direccion || "");
            setIsEditing(true);

            const repRes: any[] = await sqlite.select(
              "SELECT * FROM representantes_legales WHERE empresa_gestora_id = $1 AND deleted_at IS NULL",
              [empId],
            );

            if (repRes.length > 0) {
              setReps(
                repRes.map((r) => ({
                  id: r.id,
                  dni: r.dni || "",
                  nombres: r.nombres || "",
                  primer_apellido: r.primer_apellido || "",
                  segundo_apellido: r.segundo_apellido || "",
                  partida_registral: r.partida_registral || "",
                  oficina_registral: r.oficina_registral || "",
                  domicilio: r.domicilio || "",
                })),
              );
            } else {
              setReps([{ ...emptyRep }]);
            }
          } else {
            setIsEditing(false);
          }
        } catch (error) {
          console.error("Error al cargar la empresa:", error);
        }
      } else {
        setIsEditing(false);
      }
    };
    fetchEmpresaYRepresentantes();
  }, [ruc, initialRuc]);

  const addRep = () => setReps([...reps, { ...emptyRep }]);

  const removeRep = (idx: number) => {
    const repToRemove = reps[idx];
    if (repToRemove.id) setDeletedReps([...deletedReps, repToRemove.id]);

    const newReps = reps.filter((_, i) => i !== idx);
    if (newReps.length === 0) newReps.push({ ...emptyRep });
    setReps(newReps);
  };

  const updateRep = (idx: number, field: keyof RepData, value: string) => {
    const newReps = [...reps];
    newReps[idx][field] = value;
    setReps(newReps);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (ruc && ruc.length !== 11) {
      alert("Si ingresa un RUC, debe tener exactamente 11 dígitos.");
      return;
    }

    setIsSaving(true);
    try {
      const sqlite = await Database.load("sqlite:valeska.db");
      const now = Date.now();
      const razonLimpia = razonSocial.trim().toUpperCase();

      let targetEmpresaId = empresaId;
      const finalRuc = ruc.trim() === "" ? null : ruc.trim();

      if (isEditing && empresaId) {
        await sqlite.execute(
          `UPDATE empresas_gestoras SET ruc = $1, razon_social = $2, direccion = $3, updated_at = $4, sync_status = 'LOCAL_UPDATE' WHERE id = $5`,
          [finalRuc, razonLimpia, direccion.toUpperCase(), now, empresaId],
        );
      } else {
        targetEmpresaId = crypto.randomUUID();
        await sqlite.execute(
          `INSERT INTO empresas_gestoras (id, ruc, razon_social, direccion, created_at, updated_at, sync_status) VALUES ($1, $2, $3, $4, $5, $6, 'LOCAL_INSERT')`,
          [
            targetEmpresaId,
            finalRuc,
            razonLimpia,
            direccion.toUpperCase(),
            now,
            now,
          ],
        );
      }

      for (const delId of deletedReps) {
        await sqlite.execute(
          `UPDATE representantes_legales SET deleted_at = $1, sync_status = 'LOCAL_UPDATE' WHERE id = $2`,
          [now, delId],
        );
      }

      for (const r of reps) {
        if (r.dni || r.nombres || r.primer_apellido) {
          if (r.id) {
            await sqlite.execute(
              `UPDATE representantes_legales SET dni = $1, nombres = $2, primer_apellido = $3, segundo_apellido = $4, partida_registral = $5, oficina_registral = $6, domicilio = $7, updated_at = $8, sync_status = 'LOCAL_UPDATE' WHERE id = $9`,
              [
                r.dni,
                r.nombres.toUpperCase(),
                r.primer_apellido.toUpperCase(),
                r.segundo_apellido.toUpperCase(),
                r.partida_registral.toUpperCase(),
                r.oficina_registral.toUpperCase(),
                r.domicilio.toUpperCase(),
                now,
                r.id,
              ],
            );
          } else {
            await sqlite.execute(
              `INSERT INTO representantes_legales (id, empresa_gestora_id, dni, nombres, primer_apellido, segundo_apellido, partida_registral, oficina_registral, domicilio, created_at, updated_at, sync_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'LOCAL_INSERT')`,
              [
                crypto.randomUUID(),
                targetEmpresaId,
                r.dni,
                r.nombres.toUpperCase(),
                r.primer_apellido.toUpperCase(),
                r.segundo_apellido.toUpperCase(),
                r.partida_registral.toUpperCase(),
                r.oficina_registral.toUpperCase(),
                r.domicilio.toUpperCase(),
                now,
                now,
              ],
            );
          }
        }
      }

      window.dispatchEvent(
        new CustomEvent("valeska_request_sync", {
          detail: {
            title: "Directorio",
            details: `Se ${isEditing ? "actualizó" : "agregó"}: ${razonLimpia}`,
          },
        }),
      );

      setShowSuccess(true);
      const returnValue = finalRuc
        ? `${razonLimpia} - ${finalRuc}`
        : razonLimpia;

      const firstRepName =
        reps.length > 0 && reps[0].nombres
          ? `${reps[0].primer_apellido} ${reps[0].segundo_apellido} ${reps[0].nombres}`
              .replace(/\s+/g, " ")
              .trim()
          : "";

      setTimeout(() => onSuccess(returnValue, firstRepName), 1000);
    } catch (error: any) {
      console.error(error);
      alert("Error al guardar los datos.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-blue-600 px-6 py-4 flex items-center justify-between">
          <h3 className="font-bold text-white flex items-center gap-2">
            <Building2 size={18} />{" "}
            {isEditing
              ? "Editar Empresa Múltiple"
              : "Registrar Empresa y Representantes"}
          </h3>
          <button
            onClick={onClose}
            className="text-blue-100 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {showSuccess ? (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <CheckCircle2
              size={56}
              className="text-emerald-500 mb-4 animate-bounce"
            />
            <p className="text-xl font-bold text-gray-800">
              ¡Registro {isEditing ? "actualizado" : "completado"} con éxito!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="flex flex-col">
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 max-h-[70vh] overflow-y-auto custom-scrollbar bg-slate-50">
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-blue-200 pb-2">
                  <Building2 size={16} className="text-blue-600" />
                  <h4 className="text-xs font-black text-blue-800 uppercase tracking-widest">
                    1. Datos de la Empresa
                  </h4>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                    R.U.C. (Opcional)
                  </label>
                  <input
                    type="text"
                    maxLength={11}
                    autoFocus
                    value={ruc}
                    onChange={(e) => setRuc(e.target.value.replace(/\D/g, ""))}
                    className={`w-full border-2 rounded-xl h-11 px-3 text-sm font-bold font-mono outline-none transition-all ${isEditing ? "border-amber-400 bg-amber-50 text-amber-900" : "border-gray-200 focus:border-blue-500"}`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Razón Social (*)
                  </label>
                  <input
                    type="text"
                    required
                    value={razonSocial}
                    onChange={(e) =>
                      setRazonSocial(e.target.value.toUpperCase())
                    }
                    className="w-full border-2 border-gray-200 rounded-xl h-11 px-3 text-sm font-bold uppercase outline-none focus:border-blue-500 transition-all bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Dirección Fiscal
                  </label>
                  <textarea
                    rows={2}
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value.toUpperCase())}
                    className="w-full border-2 border-gray-200 rounded-xl p-3 text-sm uppercase outline-none focus:border-blue-500 transition-all resize-none bg-white"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2 border-b border-emerald-200 pb-2">
                  <div className="flex items-center gap-2">
                    <UserCircle size={16} className="text-emerald-600" />
                    <h4 className="text-xs font-black text-emerald-800 uppercase tracking-widest">
                      2. Representantes Legales
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={addRep}
                    className="text-[10px] font-black bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded flex items-center gap-1 hover:bg-emerald-200 transition-colors uppercase tracking-wider"
                  >
                    <Plus size={14} /> Añadir Gerente
                  </button>
                </div>

                <div className="space-y-6">
                  {reps.map((rep, idx) => (
                    <div
                      key={idx}
                      className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative group"
                    >
                      <div className="absolute -top-3 left-4 bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                        Gerente {idx + 1}
                      </div>
                      {reps.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeRep(idx)}
                          className="absolute -top-3 right-4 bg-red-100 text-red-600 p-1 rounded hover:bg-red-200 transition-colors"
                        >
                          <Trash2 size={12} strokeWidth={3} />
                        </button>
                      )}

                      <div className="grid grid-cols-2 gap-3 mt-2">
                        <div className="col-span-2">
                          <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                            D.N.I.
                          </label>
                          <input
                            type="text"
                            maxLength={8}
                            value={rep.dni}
                            onChange={(e) =>
                              updateRep(
                                idx,
                                "dni",
                                e.target.value.replace(/\D/g, ""),
                              )
                            }
                            className="w-full border border-gray-200 rounded h-9 px-3 text-xs font-mono font-bold outline-none focus:border-emerald-500 transition-all bg-gray-50"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                            Primer Apellido
                          </label>
                          <input
                            type="text"
                            value={rep.primer_apellido}
                            onChange={(e) =>
                              updateRep(
                                idx,
                                "primer_apellido",
                                e.target.value.toUpperCase(),
                              )
                            }
                            className="w-full border border-gray-200 rounded h-9 px-3 text-xs uppercase outline-none focus:border-emerald-500 transition-all bg-gray-50"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                            Segundo Apellido
                          </label>
                          <input
                            type="text"
                            value={rep.segundo_apellido}
                            onChange={(e) =>
                              updateRep(
                                idx,
                                "segundo_apellido",
                                e.target.value.toUpperCase(),
                              )
                            }
                            className="w-full border border-gray-200 rounded h-9 px-3 text-xs uppercase outline-none focus:border-emerald-500 transition-all bg-gray-50"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                            Nombres
                          </label>
                          <input
                            type="text"
                            value={rep.nombres}
                            onChange={(e) =>
                              updateRep(
                                idx,
                                "nombres",
                                e.target.value.toUpperCase(),
                              )
                            }
                            className="w-full border border-gray-200 rounded h-9 px-3 text-xs uppercase outline-none focus:border-emerald-500 transition-all bg-gray-50"
                          />
                        </div>

                        <div className="col-span-2 h-px bg-gray-100 my-1"></div>

                        <div>
                          <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                            Partida Registral
                          </label>
                          <input
                            type="text"
                            value={rep.partida_registral}
                            onChange={(e) =>
                              updateRep(
                                idx,
                                "partida_registral",
                                e.target.value.toUpperCase(),
                              )
                            }
                            className="w-full border border-gray-200 rounded h-9 px-3 text-xs uppercase outline-none focus:border-emerald-500 transition-all bg-gray-50"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                            Oficina Registral
                          </label>
                          <input
                            type="text"
                            value={rep.oficina_registral}
                            onChange={(e) =>
                              updateRep(
                                idx,
                                "oficina_registral",
                                e.target.value.toUpperCase(),
                              )
                            }
                            className="w-full border border-gray-200 rounded h-9 px-3 text-xs uppercase outline-none focus:border-emerald-500 transition-all bg-gray-50"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                            Domicilio
                          </label>
                          <input
                            type="text"
                            value={rep.domicilio}
                            onChange={(e) =>
                              updateRep(
                                idx,
                                "domicilio",
                                e.target.value.toUpperCase(),
                              )
                            }
                            className="w-full border border-gray-200 rounded h-9 px-3 text-xs uppercase outline-none focus:border-emerald-500 transition-all bg-gray-50"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-5 bg-white border-t border-gray-200 flex justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-sm font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-100 rounded-xl transition-all shadow-sm"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={
                  isSaving ||
                  !razonSocial ||
                  (ruc.length > 0 && ruc.length !== 11)
                }
                className={`px-8 py-3 text-white text-sm font-bold uppercase tracking-widest rounded-xl transition-all flex justify-center items-center gap-2 shadow-md disabled:opacity-50 ${isEditing ? "bg-amber-600 hover:bg-amber-700" : "bg-[#2E7D32] hover:bg-[#166534]"}`}
              >
                {isSaving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={18} />
                )}
                {isEditing ? "Actualizar Todo" : "Guardar Todo"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
