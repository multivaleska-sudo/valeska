import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { CopiableFieldProps } from "../../types/utils/CopiableFieldProps";

export function CopiableField({
  label,
  value,
  onChange,
  placeholder,
  icon,
  readOnly = false,
  mono = false,
}: CopiableFieldProps) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    if (!value || value === "---") return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-1 group">
      <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 tracking-tight">
        {label}
      </label>
      <div className="flex gap-1">
        <div className="relative flex-1">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
              {icon}
            </div>
          )}
          <input
            type="text"
            value={value}
            readOnly={readOnly}
            onChange={(e) => onChange && onChange(e.target.value)}
            placeholder={placeholder}
            className={`w-full h-11 ${icon ? "pl-10" : "pl-4"} pr-4 border border-gray-200 rounded-lg text-sm font-medium outline-none transition-all shadow-sm 
              ${readOnly ? "bg-gray-50/50 cursor-default" : "bg-white focus:ring-2 focus:ring-blue-500 group-hover:border-blue-300"}
              ${mono ? "font-mono tracking-wider" : ""}`}
          />
        </div>
        <button
          onClick={copy}
          type="button"
          disabled={!value || value === "---"}
          title="Copiar este dato"
          className={`w-11 h-11 flex items-center justify-center rounded-lg border transition-all active:scale-90 disabled:opacity-30 disabled:grayscale
            ${
              copied
                ? "bg-green-500 border-green-600 text-white shadow-inner"
                : "bg-white border-gray-200 text-gray-400 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-300 shadow-sm"
            }`}
        >
          {copied ? (
            <Check className="w-5 h-5 stroke-[3px]" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}
