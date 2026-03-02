import { Cloud, CloudOff } from "lucide-react";
import { cn } from "../lib/utils";

interface SyncChipProps {
  synced: boolean;
}

export function SyncChip({ synced }: SyncChipProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium",
        synced
          ? "bg-[#DCFCE7] text-[#16A34A]"
          : "bg-[#FEF3C7] text-[#F59E0B]"
      )}
    >
      {synced ? (
        <Cloud className="w-3.5 h-3.5" />
      ) : (
        <CloudOff className="w-3.5 h-3.5" />
      )}
      <span>{synced ? "Sync" : "Pendiente"}</span>
    </div>
  );
}
