import React, { useState, useEffect } from "react";
import { Search, Plus, Edit3 } from "lucide-react";
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

export const parseRepresentante = (val: string) => {
  if (!val) return { dni: "", nombre: "" };
  const match = val.match(
    /^(.*?)(?:,?\s*IDENTIFICAD[OA]S?\s+CON\s+(?:D\.?N\.?I\.?|C\.?E\.?)\s*(?:N[°º]?)?\s*)(\d{8,9})$/i,
  );
  if (match) return { nombre: match[1].trim(), dni: match[2] };
  return { nombre: val.trim(), dni: "" };
};

export const stringifyRepresentante = (dni: string, nombre: string) => {
  let cleanName = nombre
    .replace(/,?\s*IDENTIFICAD[OA]S?\s+CON.*/gi, "")
    .trim()
    .toUpperCase();
  if (!dni) return cleanName;
  if (!cleanName) return dni;
  const tipo = dni.length === 9 ? "C.E." : "D.N.I.";
  return `${cleanName}, IDENTIFICADO CON ${tipo} N° ${dni.trim()}`;
};

export const ModernDynamicRepresentantes = ({
  label,
  name,
  value,
  onChange,
  readOnly = false,
}: any) => {
  const [rep, setRep] = useState<{ dni: string; nombre: string }>({
    dni: "",
    nombre: "",
  });

  useEffect(() => {
    const parsed = parseRepresentante(value);
    if (parsed.dni !== rep.dni || parsed.nombre !== rep.nombre) {
      setRep(parsed);
    }
  }, [value]);

  const updateRep = async (field: "dni" | "nombre", val: string) => {
    const newRep = { ...rep, [field]: val };
    setRep(newRep);

    onChange({
      target: {
        name,
        value: stringifyRepresentante(newRep.dni, newRep.nombre),
        type: "text",
      },
    });

    if (field === "dni" && (val.length === 8 || val.length === 9)) {
      try {
        const sqlite = await Database.load("sqlite:valeska.db");
        const res: any[] = await sqlite.select(
          `SELECT primer_apellido, segundo_apellido, nombres FROM presentantes WHERE dni = $1 LIMIT 1`,
          [val],
        );

        if (res.length > 0) {
          const fullName = `${res[0].primer_apellido} ${res[0].segundo_apellido} ${res[0].nombres}`.trim();
          setRep({ dni: val, nombre: fullName });

          onChange({
            target: {
              name,
              value: stringifyRepresentante(val, fullName),
              type: "text",
            },
          });
        }
      } catch (e) {
        console.error("Error buscando el presentante por DNI:", e);
      }
    }
  };

  return (
    <div className="flex flex-col col-span-1 md:col-span-2 bg-slate-50 border border-slate-200 p-4 rounded-xl shadow-inner">
      <div className="flex justify-between items-center mb-3">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          {label}
        </label>
      </div>
      <div className="flex gap-3 items-start animate-in fade-in duration-200">
        <input
          type="text"
          placeholder="DNI / C.E."
          maxLength={9}
          value={rep.dni}
          onChange={(e) => updateRep("dni", e.target.value.replace(/\D/g, ""))}
          readOnly={readOnly}
          className="w-[120px] font-mono border border-slate-300 rounded-lg h-10 px-3 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none font-bold text-blue-900"
        />
        <input
          type="text"
          placeholder="Nombres Completos..."
          value={rep.nombre}
          onChange={(e) => updateRep("nombre", e.target.value.toUpperCase())}
          readOnly={readOnly}
          className="flex-1 font-bold border border-slate-300 rounded-lg h-10 px-3 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none uppercase text-gray-800"
        />
      </div>
    </div>
  );
};
