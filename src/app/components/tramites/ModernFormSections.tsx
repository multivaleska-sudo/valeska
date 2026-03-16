import React from "react";
import { Search } from "lucide-react";

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

export const ModernSelect = ({
  label,
  name,
  value,
  onChange,
  options,
  className = "",
}: any) => (
  <div className={`flex flex-col ${className}`}>
    <label className="text-xs font-semibold text-gray-600 mb-1.5">
      {label}
    </label>
    <select
      name={name}
      value={value || ""}
      onChange={onChange}
      className="border border-gray-200 rounded-lg h-10 px-3 text-sm transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none bg-white hover:border-gray-300 cursor-pointer"
    >
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
  placeholder = "",
  className = "",
}: any) => (
  <div className={`flex flex-col ${className}`}>
    <label className="text-xs font-semibold text-gray-600 mb-1.5">
      {label}
    </label>
    <div className="flex h-10 rounded-lg overflow-hidden border border-gray-200 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all bg-white hover:border-gray-300">
      <input
        type="text"
        name={name}
        value={value || ""}
        onChange={onChange}
        placeholder={placeholder}
        className="flex-1 px-3 text-sm outline-none bg-transparent"
      />
      <button
        type="button"
        onClick={onSearch}
        className="bg-gray-50 border-l border-gray-200 px-4 flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-600"
      >
        <Search size={16} />
      </button>
    </div>
  </div>
);
