import { AlertTriangle } from "lucide-react";

export function ConflictChip() {
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 bg-[#FEE2E2] text-[#DC2626] rounded text-xs font-medium">
      <AlertTriangle className="w-3.5 h-3.5" />
      <span>Conflicto</span>
    </div>
  );
}
