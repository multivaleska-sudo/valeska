import { FormFieldProps } from "../../types/tramites/tramite.types";

export function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  mono = false,
}: FormFieldProps) {
  return (
    <div className="space-y-1 group">
      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block ml-1 transition-colors group-focus-within:text-blue-600">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full h-10 px-3 border border-gray-200 rounded-lg text-sm outline-none transition-all bg-white shadow-sm
          focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-300
          ${mono ? "font-mono font-bold tracking-wider" : "font-medium text-gray-700"}`}
      />
    </div>
  );
}
