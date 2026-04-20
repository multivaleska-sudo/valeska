import React, { useState, useEffect } from "react";
import {
  X,
  Building2,
  Loader2,
  CheckCircle2,
  UserCircle,
  Save,
} from "lucide-react";
import Database from "@tauri-apps/plugin-sql";

interface EmpresaModalProps {
  initialRuc?: string;
  onClose: () => void;
  onSuccess: (empresaName: string) => void;
}

export function EmpresaModal({
  initialRuc = "",
  onClose,
  onSuccess,
}: EmpresaModalProps) {
  const [empresaId, setEmpresaId] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // Estados de la Empresa
  const [ruc, setRuc] = useState(initialRuc);
  const [razonSocial, setRazonSocial] = useState("");
  const [direccion, setDireccion] = useState("");

  // Estados del Representante Legal (Opcional)
  const [repId, setRepId] = useState("");
  const [repDni, setRepDni] = useState("");
  const [repNombres, setRepNombres] = useState("");
  const [repPrimerApellido, setRepPrimerApellido] = useState("");
  const [repSegundoApellido, setRepSegundoApellido] = useState("");
  const [repPartida, setRepPartida] = useState("");
  const [repOficina, setRepOficina] = useState("");
  const [repDomicilio, setRepDomicilio] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const fetchEmpresaYRepresentante = async () => {
      if (ruc.length === 11) {
        try {
          const sqlite = await Database.load("sqlite:valeska.db");
          // Buscamos la empresa
          const res: any[] = await sqlite.select(
            "SELECT * FROM empresas_gestoras WHERE ruc = $1",
            [ruc],
          );

          if (res.length > 0) {
            const empId = res[0].id;
            setEmpresaId(empId);
            setRazonSocial(res[0].razon_social);
            setDireccion(res[0].direccion || "");
            setIsEditing(true);

            // Buscamos su representante principal (si tiene)
            const repRes: any[] = await sqlite.select(
              "SELECT * FROM representantes_legales WHERE empresa_gestora_id = $1 AND deleted_at IS NULL LIMIT 1",
              [empId],
            );

            if (repRes.length > 0) {
              const r = repRes[0];
              setRepId(r.id);
              setRepDni(r.dni);
              setRepNombres(r.nombres);
              setRepPrimerApellido(r.primer_apellido);
              setRepSegundoApellido(r.segundo_apellido || "");
              setRepPartida(r.partida_registral || "");
              setRepOficina(r.oficina_registral || "");
              setRepDomicilio(r.domicilio || "");
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
    fetchEmpresaYRepresentante();
  }, [ruc]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (ruc.length !== 11) {
      alert("El RUC debe tener exactamente 11 dígitos.");
      return;
    }

    setIsSaving(true);
    try {
      const sqlite = await Database.load("sqlite:valeska.db");
      const now = Date.now();
      const razonLimpia = razonSocial.trim().toUpperCase();

      let targetEmpresaId = empresaId;

      // 1. GUARDAR EMPRESA
      if (isEditing && empresaId) {
        await sqlite.execute(
          `UPDATE empresas_gestoras SET razon_social = $1, direccion = $2, updated_at = $3, sync_status = 'LOCAL_UPDATE' WHERE id = $4`,
          [razonLimpia, direccion.toUpperCase(), now, empresaId],
        );
      } else {
        targetEmpresaId = crypto.randomUUID();
        await sqlite.execute(
          `INSERT INTO empresas_gestoras (id, ruc, razon_social, direccion, created_at, updated_at, sync_status) VALUES ($1, $2, $3, $4, $5, $6, 'LOCAL_INSERT')`,
          [
            targetEmpresaId,
            ruc,
            razonLimpia,
            direccion.toUpperCase(),
            now,
            now,
          ],
        );
      }

      // 2. GUARDAR REPRESENTANTE LEGAL (Si se llenó la información principal)
      if (repDni && repNombres && repPrimerApellido) {
        if (repId) {
          await sqlite.execute(
            `UPDATE representantes_legales SET dni = $1, nombres = $2, primer_apellido = $3, segundo_apellido = $4, partida_registral = $5, oficina_registral = $6, domicilio = $7, updated_at = $8, sync_status = 'LOCAL_UPDATE' WHERE id = $9`,
            [
              repDni,
              repNombres.toUpperCase(),
              repPrimerApellido.toUpperCase(),
              repSegundoApellido.toUpperCase(),
              repPartida.toUpperCase(),
              repOficina.toUpperCase(),
              repDomicilio.toUpperCase(),
              now,
              repId,
            ],
          );
        } else {
          const newRepId = crypto.randomUUID();
          await sqlite.execute(
            `INSERT INTO representantes_legales (id, empresa_gestora_id, dni, nombres, primer_apellido, segundo_apellido, partida_registral, oficina_registral, domicilio, created_at, updated_at, sync_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'LOCAL_INSERT')`,
            [
              newRepId,
              targetEmpresaId,
              repDni,
              repNombres.toUpperCase(),
              repPrimerApellido.toUpperCase(),
              repSegundoApellido.toUpperCase(),
              repPartida.toUpperCase(),
              repOficina.toUpperCase(),
              repDomicilio.toUpperCase(),
              now,
              now,
            ],
          );
        }
      }

      // Disparar sincronización
      window.dispatchEvent(
        new CustomEvent("valeska_request_sync", {
          detail: {
            title: "Directorio",
            details: `Se ${isEditing ? "actualizó" : "agregó"}: ${razonLimpia}`,
          },
        }),
      );

      setShowSuccess(true);
      // Retornar solo el nombre de la empresa como se configuró en useTramiteLogic
      setTimeout(() => onSuccess(`${razonLimpia} - ${ruc}`), 1000);
    } catch (error: any) {
      console.error(error);
      alert("Error al guardar los datos.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-blue-600 px-6 py-4 flex items-center justify-between">
          <h3 className="font-bold text-white flex items-center gap-2">
            <Building2 size={18} />{" "}
            {isEditing
              ? "Editar Registro Completo"
              : "Registrar Empresa y Representante"}
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
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {/* COLUMNA 1: EMPRESA */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-blue-100 pb-2">
                  <Building2 size={16} className="text-blue-600" />
                  <h4 className="text-xs font-black text-blue-800 uppercase tracking-widest">
                    1. Datos de la Empresa
                  </h4>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                    R.U.C. (*)
                  </label>
                  <input
                    type="text"
                    required
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
                    className="w-full border-2 border-gray-200 rounded-xl h-11 px-3 text-sm font-bold uppercase outline-none focus:border-blue-500 transition-all"
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
                    className="w-full border-2 border-gray-200 rounded-xl p-3 text-sm uppercase outline-none focus:border-blue-500 transition-all resize-none"
                  />
                </div>
              </div>

              {/* COLUMNA 2: REPRESENTANTE LEGAL */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-emerald-100 pb-2">
                  <UserCircle size={16} className="text-emerald-600" />
                  <h4 className="text-xs font-black text-emerald-800 uppercase tracking-widest">
                    2. Representante Legal (Opcional)
                  </h4>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                      D.N.I.
                    </label>
                    <input
                      type="text"
                      maxLength={8}
                      value={repDni}
                      onChange={(e) =>
                        setRepDni(e.target.value.replace(/\D/g, ""))
                      }
                      className="w-full border-2 border-gray-200 rounded-xl h-11 px-3 text-sm font-mono font-bold outline-none focus:border-emerald-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                      Primer Apellido
                    </label>
                    <input
                      type="text"
                      value={repPrimerApellido}
                      onChange={(e) =>
                        setRepPrimerApellido(e.target.value.toUpperCase())
                      }
                      className="w-full border-2 border-gray-200 rounded-xl h-11 px-3 text-sm uppercase outline-none focus:border-emerald-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                      Segundo Apellido
                    </label>
                    <input
                      type="text"
                      value={repSegundoApellido}
                      onChange={(e) =>
                        setRepSegundoApellido(e.target.value.toUpperCase())
                      }
                      className="w-full border-2 border-gray-200 rounded-xl h-11 px-3 text-sm uppercase outline-none focus:border-emerald-500 transition-all"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                      Nombres
                    </label>
                    <input
                      type="text"
                      value={repNombres}
                      onChange={(e) =>
                        setRepNombres(e.target.value.toUpperCase())
                      }
                      className="w-full border-2 border-gray-200 rounded-xl h-11 px-3 text-sm uppercase outline-none focus:border-emerald-500 transition-all"
                    />
                  </div>

                  <div className="col-span-2 h-px bg-gray-100 my-1"></div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                      Partida Registral
                    </label>
                    <input
                      type="text"
                      value={repPartida}
                      onChange={(e) =>
                        setRepPartida(e.target.value.toUpperCase())
                      }
                      className="w-full border-2 border-gray-200 rounded-xl h-11 px-3 text-sm uppercase outline-none focus:border-emerald-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                      Oficina Registral
                    </label>
                    <input
                      type="text"
                      value={repOficina}
                      onChange={(e) =>
                        setRepOficina(e.target.value.toUpperCase())
                      }
                      className="w-full border-2 border-gray-200 rounded-xl h-11 px-3 text-sm uppercase outline-none focus:border-emerald-500 transition-all"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                      Domicilio (Representante)
                    </label>
                    <input
                      type="text"
                      value={repDomicilio}
                      onChange={(e) =>
                        setRepDomicilio(e.target.value.toUpperCase())
                      }
                      className="w-full border-2 border-gray-200 rounded-xl h-11 px-3 text-sm uppercase outline-none focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-sm font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-100 rounded-xl transition-all shadow-sm"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving || ruc.length !== 11 || !razonSocial}
                className={`px-8 py-3 text-white text-sm font-bold uppercase tracking-widest rounded-xl transition-all flex justify-center items-center gap-2 shadow-md disabled:opacity-50 ${isEditing ? "bg-amber-600 hover:bg-amber-700" : "bg-[#2E7D32] hover:bg-[#166534]"}`}
              >
                {isSaving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    <Save size={18} />
                    {isEditing ? "Actualizar" : "Guardar Todo"}
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
