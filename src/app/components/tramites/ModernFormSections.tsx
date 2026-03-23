import React, { useState, useEffect } from "react";
import { Search, Plus, X, Edit3 } from "lucide-react";
import Database from "@tauri-apps/plugin-sql";

export const SectionCard = ({
  title,
  icon,
  children,
  className = "",
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden ${className}`}
  >
    <div className="bg-gray-50/80 px-5 py-3.5 border-b border-gray-100 flex items-center gap-2.5">
      {icon && <span className="text-blue-600">{icon}</span>}
      <h3 className="text-sm font-bold text-gray-800 tracking-wide">{title}</h3>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

export const ModernInput = ({
  label,
  name,
  value,
  onChange,
  type = "text",
  readOnly = false,
  className = "",
  placeholder = "",
}: any) => (
  <div className={`flex flex-col ${className}`}>
    <label className="text-xs font-semibold text-gray-600 mb-1.5">
      {label}
    </label>
    <input
      type={type}
      name={name}
      value={value || ""}
      onChange={onChange}
      readOnly={readOnly}
      placeholder={placeholder}
      className={`border border-gray-200 rounded-lg h-10 px-3 text-sm transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none ${readOnly ? "bg-gray-50 text-gray-500 cursor-not-allowed" : "bg-white hover:border-gray-300"}`}
    />
  </div>
);

export const ModernTextarea = ({
  label,
  name,
  value,
  onChange,
  readOnly = false,
  className = "",
  placeholder = "",
  rows = 2,
}: any) => (
  <div className={`flex flex-col ${className}`}>
    <label className="text-xs font-semibold text-gray-600 mb-1.5">
      {label}
    </label>
    <textarea
      name={name}
      value={value || ""}
      onChange={onChange}
      readOnly={readOnly}
      placeholder={placeholder}
      rows={rows}
      className={`border border-gray-200 rounded-lg p-3 text-sm transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none resize-none ${readOnly ? "bg-gray-50 text-gray-500 cursor-not-allowed" : "bg-white hover:border-gray-300"}`}
    />
  </div>
);

export const ModernSelect = ({
  label,
  name,
  value,
  onChange,
  options,
  onAddClick,
  className = "",
  disabled = false,
}: any) => (
  <div className={`flex flex-col ${className}`}>
    <div className="flex justify-between items-center mb-1.5">
      <label className="text-xs font-semibold text-gray-600">{label}</label>
      {onAddClick && !disabled && (
        <button
          type="button"
          onClick={onAddClick}
          className="text-blue-600 hover:text-blue-800 p-0.5 rounded hover:bg-blue-50 transition-colors"
          title={`Añadir nuevo ${label}`}
        >
          <Plus size={14} strokeWidth={3} />
        </button>
      )}
    </div>
    <select
      name={name}
      value={value || ""}
      onChange={onChange}
      disabled={disabled}
      className={`border border-gray-200 rounded-lg h-10 px-3 text-sm transition-all outline-none cursor-pointer ${disabled ? "bg-gray-50 text-gray-500 cursor-not-allowed" : "bg-white hover:border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"}`}
    >
      <option value="" disabled>
        Seleccione una opción...
      </option>
      {options.map((opt: string) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  </div>
);

export const ModernSearchInput = ({
  label,
  name,
  value,
  onChange,
  onSearch,
  onAddClick,
  onEditClick,
  placeholder = "",
  className = "",
  readOnly = false,
}: any) => (
  <div className={`flex flex-col ${className}`}>
    <div className="flex justify-between items-center mb-1.5">
      <label className="text-xs font-semibold text-gray-600">{label}</label>
      <div className="flex gap-2">
        {onEditClick && !readOnly && value && (
          <button
            type="button"
            onClick={onEditClick}
            className="text-amber-600 hover:text-amber-800 p-0.5 rounded hover:bg-amber-50 transition-colors"
            title="Editar Empresa Seleccionada"
          >
            <Edit3 size={14} strokeWidth={3} />
          </button>
        )}
        {onAddClick && !readOnly && (
          <button
            type="button"
            onClick={onAddClick}
            className="text-emerald-600 hover:text-emerald-800 p-0.5 rounded hover:bg-emerald-50 transition-colors"
            title={`Registrar nueva ${label}`}
          >
            <Plus size={14} strokeWidth={3} />
          </button>
        )}
      </div>
    </div>
    <div
      className={`flex h-10 rounded-lg overflow-hidden border transition-all ${readOnly ? "border-gray-200 bg-gray-50" : "border-gray-200 bg-white hover:border-gray-300 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10"}`}
    >
      <input
        type="text"
        name={name}
        value={value || ""}
        onChange={onChange}
        placeholder={placeholder}
        readOnly={readOnly}
        title={value || ""}
        className={`flex-1 px-3 text-xs sm:text-sm font-bold text-gray-800 outline-none bg-transparent truncate ${readOnly ? "text-gray-500 cursor-not-allowed" : ""}`}
      />
      <button
        type="button"
        onClick={onSearch}
        disabled={readOnly}
        className={`border-l border-gray-200 px-4 flex items-center justify-center transition-colors ${readOnly ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-gray-50 hover:bg-gray-100 text-gray-600"}`}
      >
        <Search size={16} />
      </button>
    </div>
  </div>
);

// ==============================================================================
// LÓGICA DE PARSEO Y FORMATEO (EXPORTADA PARA USARSE EN EL MODAL DE EMPRESA)
// ==============================================================================
export const parseRepresentantes = (val: string) => {
  if (!val) return [{ dni: "", nombre: "" }];
  const parts = val.split(/\s+Y\s+/i);
  const results = parts.map((part) => {
    const match = part.match(
      /^(.*?)(?:,?\s*IDENTIFICAD[OA]S?\s+CON\s+(?:D\.?N\.?I\.?|C\.?E\.?)\s*(?:N[°º]?)?\s*)(\d{8,9})$/i,
    );
    if (match) return { nombre: match[1].trim(), dni: match[2] };
    return { nombre: part.trim(), dni: "" };
  });
  return results.length > 0 ? results : [{ dni: "", nombre: "" }];
};

export const stringifyRepresentantes = (
  arr: { dni: string; nombre: string }[],
) => {
  const valid = arr.filter((r) => r.dni.trim() || r.nombre.trim());
  if (valid.length === 0) return "";
  return valid
    .map((r) => {
      let cleanName = r.nombre
        .replace(/,?\s*IDENTIFICAD[OA]S?\s+CON.*/gi, "")
        .trim()
        .toUpperCase();
      if (!r.dni) return cleanName;
      if (!cleanName) return r.dni;
      const tipo = r.dni.length === 9 ? "C.E." : "D.N.I.";
      return `${cleanName}, IDENTIFICADO CON ${tipo} N° ${r.dni.trim()}`;
    })
    .join(" Y ");
};

// ==============================================================================
// ✨ NUEVO: COMPONENTE DINÁMICO DE REPRESENTANTES (DNI | NOMBRE SEPARADOS)
// ==============================================================================
export const ModernDynamicRepresentantes = ({
  label,
  name,
  value,
  onChange,
  readOnly = false,
}: any) => {
  const [reps, setReps] = useState<{ dni: string; nombre: string }[]>([
    { dni: "", nombre: "" },
  ]);

  useEffect(() => {
    const parsed = parseRepresentantes(value);
    if (JSON.stringify(parsed) !== JSON.stringify(reps)) {
      setReps(parsed);
    }
  }, [value]);

  const updateRep = async (
    index: number,
    field: "dni" | "nombre",
    val: string,
  ) => {
    const newReps = [...reps];
    newReps[index][field] = val;
    setReps(newReps);
    onChange({
      target: { name, value: stringifyRepresentantes(newReps), type: "text" },
    });

    // Autocomplete de DNI (Busca en empresas y trámites)
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
            onChange({
              target: {
                name,
                value: stringifyRepresentantes(newReps),
                type: "text",
              },
            });
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
    onChange({
      target: { name, value: stringifyRepresentantes(newReps), type: "text" },
    });
  };

  return (
    <div className="flex flex-col col-span-2 bg-slate-50 border border-slate-200 p-4 rounded-xl shadow-inner">
      <div className="flex justify-between items-center mb-3">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          {label}
        </label>
      </div>
      <div className="space-y-3">
        {reps.map((rep, idx) => (
          <div
            key={idx}
            className="flex gap-3 items-start animate-in fade-in duration-200"
          >
            <input
              type="text"
              placeholder="DNI / C.E."
              maxLength={9}
              value={rep.dni}
              onChange={(e) =>
                updateRep(idx, "dni", e.target.value.replace(/\D/g, ""))
              }
              readOnly={readOnly}
              className="w-[120px] font-mono border border-slate-300 rounded-lg h-10 px-3 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none font-bold text-blue-900"
            />
            <input
              type="text"
              placeholder="Nombres Completos..."
              value={rep.nombre}
              onChange={(e) =>
                updateRep(idx, "nombre", e.target.value.toUpperCase())
              }
              readOnly={readOnly}
              className="flex-1 font-bold border border-slate-300 rounded-lg h-10 px-3 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none uppercase text-gray-800"
            />
            {!readOnly && (
              <button
                type="button"
                onClick={() => removeRep(idx)}
                className="h-10 w-10 flex shrink-0 items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-200 transition-colors"
              >
                <X size={18} strokeWidth={3} />
              </button>
            )}
          </div>
        ))}
      </div>
      {!readOnly && (
        <button
          type="button"
          onClick={addRep}
          className="mt-4 w-max text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 bg-indigo-100/50 border border-indigo-200 px-4 py-2 rounded-lg hover:bg-indigo-100 transition-colors"
        >
          <Plus size={14} strokeWidth={3} /> Agregar otro Representante
        </button>
      )}
    </div>
  );
};
