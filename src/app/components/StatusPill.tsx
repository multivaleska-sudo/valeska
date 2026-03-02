import { cn } from "../lib/utils";

interface StatusPillProps {
  status: string;
}

export function StatusPill({ status }: StatusPillProps) {
  const getStatusColor = (status: string) => {
    const normalized = status.toLowerCase();
    if (normalized.includes("entregado") || normalized.includes("completado")) {
      return "bg-[#DCFCE7] text-[#16A34A]";
    }
    if (normalized.includes("pendiente") || normalized.includes("conflicto")) {
      return "bg-[#FEE2E2] text-[#DC2626]";
    }
    if (normalized.includes("proceso")) {
      return "bg-[#DBEAFE] text-[#2563EB]";
    }
    return "bg-[#FEF3C7] text-[#F59E0B]";
  };

  return (
    <span
      className={cn(
        "px-3 py-1 text-xs font-medium rounded-full",
        getStatusColor(status)
      )}
    >
      {status}
    </span>
  );
}
