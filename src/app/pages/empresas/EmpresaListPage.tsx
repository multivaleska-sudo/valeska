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
    empresas,
    presentantes,
    isLoading,
    formPresentante,
    setFormPresentante,
    initialPresentante,
    savePresentante,
    formEmpresa,
    setFormEmpresa,
    initialEmpresa,
    saveEmpresa,
    deleteRecord,
  } = useDirectorioLogic();

  const [activeTab, setActiveTab] = useState<"presentantes" | "empresas">(
    "presentantes",
  );
  const [search, setSearch] = useState("");

  const filteredPresentantes = useMemo(() => {
    return presentantes.filter((p) => {
      const term = search.toLowerCase();
      const nombreCompleto =
        `${p.primer_apellido} ${p.segundo_apellido || ""} ${p.nombres}`.toLowerCase();
      return nombreCompleto.includes(term) || p.dni.includes(term);
    });
  }, [presentantes, search]);

  const filteredEmpresas = useMemo(() => {
    return empresas.filter((e) => {
      const term = search.toLowerCase();
      return (
        e.razon_social.toLowerCase().includes(term) || e.ruc.includes(term)
      );
    });
  }, [empresas, search]);

  const copyPresentante = () => {
    const txt =
      `PRESENTANTE:\nPARTIDA: ${formPresentante.partida_registral || "-"}\nOFICINA: ${formPresentante.oficina_registral || "-"}\nDOMICILIO: ${formPresentante.domicilio || "-"}\nDNI: ${formPresentante.dni}\nAPELLIDOS Y NOMBRES: ${formPresentante.primer_apellido} ${formPresentante.segundo_apellido || ""} ${formPresentante.nombres}`.trim();
    navigator.clipboard.writeText(txt);
  };

  const TRACTOSUCESIVO =
    "TRACTO SUCESIVO: SE ADJUNTA AL CORREO INSTITUCIONAL COMPROBANTESDEPAGO_CUSCO@SUNARP.GOB.PE, Y/O EN EL NUMERAL 5 DE ESTE FORMATO DE INMATRICULACIÓN EL COMPROBANTE DE ADQUISICIÓN CON SU RESPECTIVO XML CON EL FIN DE ACREDITAR EL TRACTO SUCESIVO.";

  const copyEmpresa = () => {
    const txt =
      `EMPRESA:\nRUC: ${formEmpresa.ruc}\nRAZÓN SOCIAL: ${formEmpresa.razon_social}\nDIRECCIÓN: ${formEmpresa.direccion || "-"}`.trim();
    navigator.clipboard.writeText(txt);
  };

  return (
    <div className="p-6 h-screen bg-slate-50 font-sans flex flex-col overflow-hidden animate-in fade-in duration-300">
      <div className="flex justify-between items-end mb-4 shrink-0">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight flex items-center gap-3 uppercase">
            <Building2 className="text-blue-600 w-7 h-7" /> Directorio Central
          </h1>
          <p className="text-sm text-gray-500 font-bold mt-1">
            Gestión de Trabajadores (Presentantes) y Entidades
          </p>
        </div>

        <div className="flex bg-gray-200/80 p-1 rounded-xl shadow-inner border border-gray-200">
          <button
            className="bg-green-500 text-white text-sm px-3 py-1.5 rounded-md hover:bg-green-600 transition"
            onClick={() => {
              navigator.clipboard.writeText(TRACTOSUCESIVO);
              alert("TRACTO SUCESIVO COPIADO");
            }}
          >
            ENVIAR XML SOLO PARA ACREDITAR ACTO SUCESIVO
          </button>
        </div>
        <div className="flex bg-gray-200/80 p-1 rounded-xl shadow-inner border border-gray-200">
          <button
            onClick={() => {
              setActiveTab("presentantes");
              setSearch("");
            }}
            className={`px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === "presentantes" ? "bg-white text-blue-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            <UserCheck size={18} /> Trabajadores / Presentantes
          </button>
          <button
            onClick={() => {
              setActiveTab("empresas");
              setSearch("");
            }}
            className={`px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === "empresas" ? "bg-white text-blue-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            <Building2 size={18} /> Empresas Gestoras
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
        <div className="lg:col-span-7 flex flex-col bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-3 shrink-0">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold uppercase text-gray-700"
                placeholder={`BUSCAR ${activeTab === "presentantes" ? "PRESENTANTE (NOMBRE O DNI)" : "EMPRESA (RUC O RAZÓN)"}...`}
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
              onClick={() =>
                activeTab === "presentantes"
                  ? setFormPresentante(initialPresentante)
                  : setFormEmpresa(initialEmpresa)
              }
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold hover:bg-blue-700 transition-all text-sm shrink-0 shadow-md shadow-blue-200"
            >
              <Plus size={16} /> NUEVO
            </button>
          </div>

          <div className="flex-1 overflow-auto custom-scrollbar">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-800 text-slate-200 font-bold text-[10px] uppercase tracking-widest sticky top-0 z-10 shadow-sm">
                {activeTab === "presentantes" ? (
                  <tr>
                    <th className="px-4 py-3 text-center w-12">NRO</th>
                    <th className="px-4 py-3">NOMBRE COMPLETO</th>
                    <th className="px-4 py-3">L.E. / D.N.I.</th>
                  </tr>
                ) : (
                  <tr>
                    <th className="px-4 py-3 text-center w-12">NRO</th>
                    <th className="px-4 py-3">RAZÓN SOCIAL / NOMBRE</th>
                    <th className="px-4 py-3">RUC</th>
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs font-bold text-gray-700 uppercase">
                {activeTab === "presentantes"
                  ? filteredPresentantes.map((p, idx) => (
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
                    ))
                  : filteredEmpresas.map((e, idx) => (
                      <tr
                        key={e.id}
                        onClick={() => setFormEmpresa(e)}
                        className={`cursor-pointer transition-colors ${formEmpresa.id === e.id ? "bg-blue-50 border-l-4 border-blue-600" : "hover:bg-gray-50 border-l-4 border-transparent"}`}
                      >
                        <td className="px-4 py-3 text-center text-gray-400">
                          {idx + 1}
                        </td>
                        <td className="px-4 py-3">{e.razon_social}</td>
                        <td className="px-4 py-3 font-mono text-blue-600">
                          {e.ruc}
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
          <div className="bg-gray-50 p-2 border-t border-gray-100 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest shrink-0">
            REGISTROS:{" "}
            {activeTab === "presentantes"
              ? filteredPresentantes.length
              : filteredEmpresas.length}
          </div>
        </div>

        <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="bg-blue-600 px-5 py-4 flex justify-between items-center shrink-0">
            <h2 className="text-white font-black text-sm uppercase flex items-center gap-2">
              <FileText size={18} className="text-blue-200" />
              {activeTab === "presentantes"
                ? "INGRESO DE PRESENTANTE"
                : "INGRESO DE EMPRESA"}
            </h2>
            <button
              onClick={
                activeTab === "presentantes" ? copyPresentante : copyEmpresa
              }
              className="text-blue-100 hover:text-white transition-colors"
              title="Copiar TODOS los datos al portapapeles"
            >
              <ClipboardCopy size={18} />
            </button>
          </div>

          <div className="p-6 flex-1 overflow-y-auto custom-scrollbar bg-[#f8fafc]">
            {activeTab === "presentantes" ? (
              <div className="space-y-4">
                <CopiableField
                  label="PARTIDA REGISTRAL"
                  value={formPresentante.partida_registral || ""}
                  onChange={(val) =>
                    setFormPresentante({
                      ...formPresentante,
                      partida_registral: val.toUpperCase(),
                    })
                  }
                />

                <CopiableField
                  label="OFICINA REGISTRAL"
                  value={formPresentante.oficina_registral || ""}
                  onChange={(val) =>
                    setFormPresentante({
                      ...formPresentante,
                      oficina_registral: val.toUpperCase(),
                    })
                  }
                />

                <CopiableField
                  label="DOMICILIO"
                  value={formPresentante.domicilio || ""}
                  onChange={(val) =>
                    setFormPresentante({
                      ...formPresentante,
                      domicilio: val.toUpperCase(),
                    })
                  }
                />

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
            ) : (
              <div className="space-y-4">
                <CopiableField
                  label="R.U.C. (*)"
                  value={formEmpresa.ruc || ""}
                  mono={true}
                  onChange={(val) =>
                    setFormEmpresa({
                      ...formEmpresa,
                      ruc: val.replace(/\D/g, "").slice(0, 11),
                    })
                  }
                />

                <CopiableField
                  label="RAZÓN SOCIAL (*)"
                  value={formEmpresa.razon_social || ""}
                  onChange={(val) =>
                    setFormEmpresa({
                      ...formEmpresa,
                      razon_social: val.toUpperCase(),
                    })
                  }
                />

                {/* Se reemplaza el Textarea por CopiableField para mantener coherencia de copiado */}
                <CopiableField
                  label="DIRECCIÓN FISCAL"
                  value={formEmpresa.direccion || ""}
                  onChange={(val) =>
                    setFormEmpresa({
                      ...formEmpresa,
                      direccion: val.toUpperCase(),
                    })
                  }
                />
              </div>
            )}
          </div>

          <div className="p-4 bg-white border-t border-gray-200 flex justify-center gap-4 shrink-0">
            {activeTab === "presentantes" && formPresentante.id && (
              <button
                onClick={() =>
                  deleteRecord("presentantes", formPresentante.id!)
                }
                className="bg-red-50 text-red-600 border border-red-200 px-6 py-2.5 rounded-lg font-black text-xs uppercase tracking-widest hover:bg-red-100 transition-colors shadow-sm flex items-center gap-2"
              >
                <Trash2 size={16} /> Eliminar
              </button>
            )}
            {activeTab === "empresas" && formEmpresa.id && (
              <button
                onClick={() =>
                  deleteRecord("empresas_gestoras", formEmpresa.id!)
                }
                className="bg-red-50 text-red-600 border border-red-200 px-6 py-2.5 rounded-lg font-black text-xs uppercase tracking-widest hover:bg-red-100 transition-colors shadow-sm flex items-center gap-2"
              >
                <Trash2 size={16} /> Eliminar
              </button>
            )}

            <button
              onClick={() =>
                activeTab === "presentantes" ? savePresentante() : saveEmpresa()
              }
              className="bg-[#2E7D32] hover:bg-[#166534] text-white px-8 py-2.5 rounded-lg font-black text-xs uppercase tracking-widest transition-colors shadow-md flex items-center gap-2"
            >
              <Save size={16} /> GRABAR{" "}
              {activeTab === "presentantes" ? "PRESENTANTE" : "EMPRESA"}
            </button>

            <button
              onClick={() =>
                activeTab === "presentantes"
                  ? setFormPresentante(initialPresentante)
                  : setFormEmpresa(initialEmpresa)
              }
              className="bg-gray-100 border border-gray-300 text-gray-600 hover:bg-gray-200 px-6 py-2.5 rounded-lg font-black text-xs uppercase tracking-widest transition-colors shadow-sm flex items-center gap-2"
            >
              <X size={16} /> CANCELAR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
