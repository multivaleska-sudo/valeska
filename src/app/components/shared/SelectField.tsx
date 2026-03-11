import { SelectFieldProps } from "../../types/tramites/tramite.types";
import { ChevronDown } from "lucide-react";

export function SelectField({
  label,
  value,
  onChange,
  options,
}: SelectFieldProps) {
  return (
    <div className="space-y-1 relative group">
      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block ml-1 transition-colors group-focus-within:text-blue-600">
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-10 pl-3 pr-10 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 outline-none bg-white shadow-sm cursor-pointer appearance-none hover:border-gray-300 focus:ring-2 focus:ring-blue-500 transition-all"
        >
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none w-4 h-4" />
      </div>
    </div>
  );
}
