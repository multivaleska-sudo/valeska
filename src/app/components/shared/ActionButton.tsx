import React from "react";

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  variant?: "blue" | "gray";
}

export function ActionButton({
  icon,
  label,
  onClick,
  variant = "gray",
}: ActionButtonProps) {
  const styles = {
    blue: "bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white border-blue-100",
    gray: "bg-white text-gray-600 hover:bg-gray-50 hover:text-blue-600 border-gray-200",
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-2 h-10 px-3 border rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all shadow-sm active:scale-95 overflow-hidden ${styles[variant]}`}
    >
      <span className="shrink-0">{icon}</span>
      <span className="truncate">{label}</span>
    </button>
  );
}
