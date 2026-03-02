import { Menu, Wifi, WifiOff, Cloud, CloudOff } from "lucide-react";
import { ConnectionBadge } from "./ConnectionBadge";
import { SyncIndicator } from "./SyncIndicator";
import { UserMenu } from "./UserMenu";
import { useState } from "react";

interface TopbarProps {
  onToggleSidebar: () => void;
}

export function Topbar({ onToggleSidebar }: TopbarProps) {
  const [isOnline] = useState(true);
  const [isSyncing] = useState(false);

  return (
    <header className="h-14 bg-white border-b border-[#E5E7EB] flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5 text-[#6B7280]" />
        </button>
        <h1 className="text-lg font-semibold text-[#111827]">Sistema Valeska</h1>
      </div>
      
      <div className="flex items-center gap-3">
        <SyncIndicator isSyncing={isSyncing} />
        <ConnectionBadge isOnline={isOnline} />
        <UserMenu />
      </div>
    </header>
  );
}
