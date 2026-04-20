import React, { useState, useMemo } from "react";
import {
  Search,
  Plus,
  Save,
  Trash2,
  Building2,
  UserCheck,
  X,
  FileText,
  ClipboardCopy,
} from "lucide-react";
import { useDirectorioLogic } from "../../logic/empresas/useDirectorioLogic";
import { CopiableField } from "../../components/shared/CopiableField";

export function EmpresaListPage() {
  const {
    representantes,
    presentantes,
    isLoading,
    isSaving, // Recibimos el candado
    formPresentante,
    setFormPresentante,
    initialPresentante,
    savePresentante,
    formRepresentante,
    setFormRepresentante,
    initialRepresentante,
    saveRepresentante,
    buscarEmpresaPorRuc,
    deleteRecord,
  } = useDirectorioLogic();

  const [activeTab, setActiveTab] = useState<"representantes" | "presentantes">(
    "representantes",
  );
  const [search, setSearch] = useState("");

  const filteredRepresentantes = useMemo(() => {
    return representantes.filter((r) => {
      const term = search.toLowerCase();
      const nombreCompleto =
        `${r.primer_apellido} ${r.segundo_apellido || ""} ${r.nombres}`.toLowerCase();
      return (
        nombreCompleto.includes(term) ||
        r.dni.includes(term) ||
        r.razon_social.toLowerCase().includes(term) ||
        r.ruc.includes(term)
      );
    });
  }, [representantes, search]);

  const filteredPresentantes = useMemo(() => {
    return presentantes.filter((p) => {
      const term = search.toLowerCase();
      const nombreCompleto =
        `${p.primer_apellido} ${p.segundo_apellido || ""} ${p.nombres}`.toLowerCase();
      return nombreCompleto.includes(term) || p.dni.includes(term);
    });
  }, [presentantes, search]);

  const TRACTOSUCESIVO =
    "TRACTO SUCESIVO: SE ADJUNTA AL CORREO INSTITUCIONAL COMPROBANTESDEPAGO_CUSCO@SUNARP.GOB.PE, Y/O EN EL NUMERAL 5 DE ESTE FORMATO DE INMATRICULACIÓN EL COMPROBANTE DE ADQUISICIÓN CON SU RESPECTIVO XML CON EL FIN DE ACREDITAR EL TRACTO SUCESIVO.";

  const copyRepresentante = () => {
    const txt =
      `REPRESENTANTE DE EMPRESA:\nEMPRESA: ${formRepresentante.razon_social} (RUC: ${formRepresentante.ruc})\nPARTIDA: ${formRepresentante.partida_registral || "-"}\nOFICINA: ${formRepresentante.oficina_registral || "-"}\nDOMICILIO: ${formRepresentante.domicilio || "-"}\nDNI: ${formRepresentante.dni}\nAPELLIDOS Y NOMBRES: ${formRepresentante.primer_apellido} ${formRepresentante.segundo_apellido || ""} ${formRepresentante.nombres}`.trim();
    navigator.clipboard.writeText(txt);
  };

  const copyPresentante = () => {
    const txt =
      `PRESENTANTE:\nDNI: ${formPresentante.dni}\nAPELLIDOS Y NOMBRES: ${formPresentante.primer_apellido} ${formPresentante.segundo_apellido || ""} ${formPresentante.nombres}`.trim();
    navigator.clipboard.writeText(txt);
  };

  return (
    <div className="p-6 h-screen bg-slate-50 font-sans flex flex-col overflow-hidden animate-in fade-in duration-300">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end mb-4 shrink-0 gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight flex items-center gap-3 uppercase">
            <Building2 className="text-blue-600 w-7 h-7" /> Directorio Central
          </h1>
          <p className="text-sm text-gray-500 font-bold mt-1">
            Gestión de Empresas, Representantes y Presentantes
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full xl:w-auto">
          <div className="flex bg-gray-200/80 p-1 rounded-xl shadow-inner border border-gray-200">
            <button
              className="bg-green-500 text-white text-xs px-3 py-2 rounded-md hover:bg-green-600 transition w-full sm:w-auto font-bold"
              onClick={() => {
                navigator.clipboard.writeText(TRACTOSUCESIVO);
                alert("TRACTO SUCESIVO COPIADO");
              }}
            >
              ENVIAR XML (ACTO SUCESIVO)
            </button>
          </div>

          <div className="flex flex-wrap bg-gray-200/80 p-1 rounded-xl shadow-inner border border-gray-200 gap-1 w-full sm:w-auto">
            <button
              onClick={() => {
                setActiveTab("representantes");
                setSearch("");
              }}
              className={`px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all flex-1 sm:flex-none justify-center ${activeTab === "representantes" ? "bg-white text-blue-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              <Building2 size={16} /> Representantes de Empresa
            </button>
            <button
              onClick={() => {
                setActiveTab("presentantes");
                setSearch("");
              }}
              className={`px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all flex-1 sm:flex-none justify-center ${activeTab === "presentantes" ? "bg-white text-blue-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              <UserCheck size={16} /> Presentantes
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
        {/* PANEL IZQUIERDO: LISTA Y BÚSQUEDA */}
        <div className="lg:col-span-7 flex flex-col bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-3 shrink-0">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold uppercase text-gray-700"
                placeholder={`BUSCAR ${activeTab === "representantes" ? "EMPRESA O REPRESENTANTE" : "PRESENTANTE"}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <button
              onClick={() => {
                if (activeTab === "representantes")
                  setFormRepresentante(initialRepresentante);
                else setFormPresentante(initialPresentante);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold hover:bg-blue-700 transition-all text-sm shrink-0 shadow-md shadow-blue-200"
            >
              <Plus size={16} /> NUEVO
            </button>
          </div>

          <div className="flex-1 overflow-auto custom-scrollbar">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-800 text-slate-200 font-bold text-[10px] uppercase tracking-widest sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-4 py-3 text-center w-12">NRO</th>
                  {activeTab === "representantes" ? (
                    <>
                      <th className="px-4 py-3">EMPRESA GESTORA</th>
                      <th className="px-4 py-3">REPRESENTANTE LEGAL</th>
                      <th className="px-4 py-3">D.N.I.</th>
                    </>
                  ) : (
                    <>
                      <th className="px-4 py-3">NOMBRE COMPLETO</th>
                      <th className="px-4 py-3">L.E. / D.N.I.</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs font-bold text-gray-700 uppercase">
                {activeTab === "representantes" &&
                  filteredRepresentantes.map((r, idx) => (
                    <tr
                      key={r.id}
                      onClick={() => setFormRepresentante(r)}
                      className={`cursor-pointer transition-colors ${formRepresentante.id === r.id ? "bg-blue-50 border-l-4 border-blue-600" : "hover:bg-gray-50 border-l-4 border-transparent"}`}
                    >
                      <td className="px-4 py-3 text-center text-gray-400">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-3 text-blue-800 font-black">
                        {r.razon_social} <br />{" "}
                        <span className="text-[10px] text-gray-500 font-medium">
                          RUC: {r.ruc}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {r.primer_apellido} {r.segundo_apellido} {r.nombres}
                      </td>
                      <td className="px-4 py-3 font-mono text-blue-600">
                        {r.dni}
                      </td>
                    </tr>
                  ))}

                {activeTab === "presentantes" &&
                  filteredPresentantes.map((p, idx) => (
                    <tr
                      key={p.id}
                      onClick={() => setFormPresentante(p)}
                      className={`cursor-pointer transition-colors ${formPresentante.id === p.id ? "bg-blue-50 border-l-4 border-blue-600" : "hover:bg-gray-50 border-l-4 border-transparent"}`}
                    >
                      <td className="px-4 py-3 text-center text-gray-400">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-3">
                        {p.primer_apellido} {p.segundo_apellido} {p.nombres}
                      </td>
                      <td className="px-4 py-3 font-mono text-blue-600">
                        {p.dni}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <div className="bg-gray-50 p-2 border-t border-gray-100 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest shrink-0">
            REGISTROS:{" "}
            {activeTab === "representantes"
              ? filteredRepresentantes.length
              : filteredPresentantes.length}
          </div>
        </div>

        {/* PANEL DERECHO: FORMULARIO */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="bg-blue-600 px-5 py-4 flex justify-between items-center shrink-0">
            <h2 className="text-white font-black text-sm uppercase flex items-center gap-2">
              <FileText size={18} className="text-blue-200" />
              {activeTab === "representantes"
                ? "FICHA DE REPRESENTANTE"
                : "FICHA DE PRESENTANTE"}
            </h2>
            <button
              onClick={
                activeTab === "representantes"
                  ? copyRepresentante
                  : copyPresentante
              }
              className="text-blue-100 hover:text-white transition-colors"
              title="Copiar TODOS los datos al portapapeles"
            >
              <ClipboardCopy size={18} />
            </button>
          </div>

          <div className="p-6 flex-1 overflow-y-auto custom-scrollbar bg-[#f8fafc]">
            {/* FORMULARIO REPRESENTANTES LEGALES */}
            {activeTab === "representantes" && (
              <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                {/* Caja de Datos de Empresa */}
                <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100 space-y-4">
                  <h4 className="text-[10px] font-black text-blue-800 uppercase tracking-widest flex items-center gap-2 border-b border-blue-100 pb-2">
                    1. Datos de la Empresa Gestora
                  </h4>
                  <CopiableField
                    label="R.U.C. (*)"
                    value={formRepresentante.ruc}
                    mono={true}
                    onChange={(val) => {
                      const newRuc = val.replace(/\D/g, "").slice(0, 11);
                      setFormRepresentante({
                        ...formRepresentante,
                        ruc: newRuc,
                      });
                      if (newRuc.length === 11) buscarEmpresaPorRuc(newRuc);
                    }}
                    placeholder="Escriba 11 dígitos para auto-búsqueda"
                  />
                  <CopiableField
                    label="Razón Social (*)"
                    value={formRepresentante.razon_social}
                    onChange={(val) =>
                      setFormRepresentante({
                        ...formRepresentante,
                        razon_social: val.toUpperCase(),
                      })
                    }
                  />
                  <CopiableField
                    label="Dirección Fiscal"
                    value={formRepresentante.direccion}
                    onChange={(val) =>
                      setFormRepresentante({
                        ...formRepresentante,
                        direccion: val.toUpperCase(),
                      })
                    }
                  />
                </div>

                {/* Caja de Datos del Representante Legal */}
                <div className="bg-emerald-50/50 p-5 rounded-xl border border-emerald-100 space-y-4">
                  <h4 className="text-[10px] font-black text-emerald-800 uppercase tracking-widest flex items-center gap-2 border-b border-emerald-100 pb-2">
                    2. Datos del Representante Legal
                  </h4>
                  <CopiableField
                    label="D.N.I. (*)"
                    value={formRepresentante.dni}
                    mono={true}
                    onChange={(val) =>
                      setFormRepresentante({
                        ...formRepresentante,
                        dni: val.replace(/\D/g, "").slice(0, 8),
                      })
                    }
                  />

                  <CopiableField
                    label="Primer Apellido (*)"
                    value={formRepresentante.primer_apellido}
                    onChange={(val) =>
                      setFormRepresentante({
                        ...formRepresentante,
                        primer_apellido: val.toUpperCase(),
                      })
                    }
                  />
                  <CopiableField
                    label="Segundo Apellido"
                    value={formRepresentante.segundo_apellido}
                    onChange={(val) =>
                      setFormRepresentante({
                        ...formRepresentante,
                        segundo_apellido: val.toUpperCase(),
                      })
                    }
                  />
                  <CopiableField
                    label="Nombres (*)"
                    value={formRepresentante.nombres}
                    onChange={(val) =>
                      setFormRepresentante({
                        ...formRepresentante,
                        nombres: val.toUpperCase(),
                      })
                    }
                  />

                  <div className="h-px bg-emerald-200/50 my-4" />

                  <CopiableField
                    label="Partida Registral"
                    value={formRepresentante.partida_registral}
                    onChange={(val) =>
                      setFormRepresentante({
                        ...formRepresentante,
                        partida_registral: val.toUpperCase(),
                      })
                    }
                  />
                  <CopiableField
                    label="Oficina Registral"
                    value={formRepresentante.oficina_registral}
                    onChange={(val) =>
                      setFormRepresentante({
                        ...formRepresentante,
                        oficina_registral: val.toUpperCase(),
                      })
                    }
                  />
                  <CopiableField
                    label="Domicilio"
                    value={formRepresentante.domicilio}
                    onChange={(val) =>
                      setFormRepresentante({
                        ...formRepresentante,
                        domicilio: val.toUpperCase(),
                      })
                    }
                  />
                </div>
              </div>
            )}

            {/* FORMULARIO PRESENTANTES */}
            {activeTab === "presentantes" && (
              <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                <CopiableField
                  label="D.N.I. (*)"
                  value={formPresentante.dni || ""}
                  mono={true}
                  onChange={(val) =>
                    setFormPresentante({
                      ...formPresentante,
                      dni: val.replace(/\D/g, "").slice(0, 8),
                    })
                  }
                />
                <CopiableField
                  label="PRIMER APELLIDO (*)"
                  value={formPresentante.primer_apellido || ""}
                  onChange={(val) =>
                    setFormPresentante({
                      ...formPresentante,
                      primer_apellido: val.toUpperCase(),
                    })
                  }
                />
                <CopiableField
                  label="SEGUNDO APELLIDO"
                  value={formPresentante.segundo_apellido || ""}
                  onChange={(val) =>
                    setFormPresentante({
                      ...formPresentante,
                      segundo_apellido: val.toUpperCase(),
                    })
                  }
                />
                <CopiableField
                  label="NOMBRES (*)"
                  value={formPresentante.nombres || ""}
                  onChange={(val) =>
                    setFormPresentante({
                      ...formPresentante,
                      nombres: val.toUpperCase(),
                    })
                  }
                />
              </div>
            )}
          </div>

          {/* BOTONERA INFERIOR UNIFICADA CON BLOQUEO ANTI-DOBLE CLIC */}
          <div className="p-5 bg-white border-t border-gray-200 flex flex-wrap items-center justify-center sm:justify-end gap-3 shrink-0">
            {activeTab === "representantes" && formRepresentante.id && (
              <button
                onClick={() =>
                  deleteRecord("representantes_legales", formRepresentante.id)
                }
                disabled={isSaving}
                className="bg-red-50 text-red-600 border border-red-200 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-red-100 transition-colors shadow-sm flex items-center justify-center gap-2 flex-1 sm:flex-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 size={16} /> Eliminar
              </button>
            )}
            {activeTab === "presentantes" && formPresentante.id && (
              <button
                onClick={() => deleteRecord("presentantes", formPresentante.id)}
                disabled={isSaving}
                className="bg-red-50 text-red-600 border border-red-200 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-red-100 transition-colors shadow-sm flex items-center justify-center gap-2 flex-1 sm:flex-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 size={16} /> Eliminar
              </button>
            )}

            <button
              onClick={() => {
                if (activeTab === "representantes")
                  setFormRepresentante(initialRepresentante);
                else setFormPresentante(initialPresentante);
              }}
              disabled={isSaving}
              className="bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-colors shadow-sm flex items-center justify-center gap-2 flex-1 sm:flex-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X size={16} /> CANCELAR
            </button>

            <button
              onClick={() => {
                if (activeTab === "representantes") saveRepresentante();
                else savePresentante();
              }}
              disabled={isSaving}
              className="bg-[#2E7D32] hover:bg-[#166534] text-white px-8 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2 flex-1 sm:flex-none w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                "GUARDANDO..."
              ) : (
                <>
                  <Save size={16} /> GRABAR{" "}
                  {activeTab === "representantes" ? "REGISTRO" : "PRESENTANTE"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
