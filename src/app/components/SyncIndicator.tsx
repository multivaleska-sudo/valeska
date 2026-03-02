import { Cloud, CloudOff, Loader2 } from "lucide-react";
import { cn } from "../lib/utils";

interface SyncIndicatorProps {
  isSyncing: boolean;
}

export function SyncIndicator({ isSyncing }: SyncIndicatorProps) {
  if (!isSyncing) return null;

  return (
    <div className="flex items-center gap-2 text-[#6B7280] text-sm">
      <Loader2 className="w-4 h-4 animate-spin" />
      <span>Sincronizando...</span>
    </div>
  );
}
