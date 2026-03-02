import { Wifi, WifiOff } from "lucide-react";
import { cn } from "../lib/utils";

interface ConnectionBadgeProps {
  isOnline: boolean;
}

export function ConnectionBadge({ isOnline }: ConnectionBadgeProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium",
        isOnline
          ? "bg-[#DCFCE7] text-[#16A34A]"
          : "bg-[#FEE2E2] text-[#DC2626]"
      )}
    >
      {isOnline ? (
        <Wifi className="w-3.5 h-3.5" />
      ) : (
        <WifiOff className="w-3.5 h-3.5" />
      )}
      <span>{isOnline ? "En línea" : "Sin conexión"}</span>
    </div>
  );
}
