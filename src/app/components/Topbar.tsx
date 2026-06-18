import { Menu, CloudDownload, RefreshCw } from "lucide-react";
import { ConnectionBadge } from "./ConnectionBadge";
import { SyncIndicator } from "./SyncIndicator";
import { UserMenu } from "./UserMenu";
import { useState, useEffect } from "react";

interface TopbarProps {
  onToggleSidebar: () => void;
}

export function Topbar({ onToggleSidebar }: TopbarProps) {
  const [isOnline] = useState(true);
  const [isSyncing] = useState(false);
  const [hasUpdates, setHasUpdates] = useState(false);
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);

  useEffect(() => {
    const onUpdatesAvailable = () => setHasUpdates(true);
    const onUpdatesCleared = () => setHasUpdates(false);
    
    // Al terminar de sincronizar, quitamos el badge
    const onSyncCompleted = () => setHasUpdates(false);

    const onCheckingStart = () => setIsCheckingUpdates(true);
    const onCheckingEnd = () => setIsCheckingUpdates(false);

    window.addEventListener("valeska_updates_available", onUpdatesAvailable);
    window.addEventListener("valeska_updates_cleared", onUpdatesCleared);
    window.addEventListener("valeska_sync_completed", onSyncCompleted);
    window.addEventListener("valeska_checking_updates_start", onCheckingStart);
    window.addEventListener("valeska_checking_updates_end", onCheckingEnd);

    return () => {
      window.removeEventListener("valeska_updates_available", onUpdatesAvailable);
      window.removeEventListener("valeska_updates_cleared", onUpdatesCleared);
      window.removeEventListener("valeska_sync_completed", onSyncCompleted);
      window.removeEventListener("valeska_checking_updates_start", onCheckingStart);
      window.removeEventListener("valeska_checking_updates_end", onCheckingEnd);
    };
  }, []);

  const handleManualSync = () => {
    setHasUpdates(false);
    window.dispatchEvent(
      new CustomEvent("valeska_request_sync", {
        detail: { title: "Sincronización Manual", source: "manual", silent: false }
      })
    );
  };

  const handleCheckUpdates = () => {
    if (isCheckingUpdates) return;
    window.dispatchEvent(new Event("valeska_force_check_updates"));
  };

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
        <button
          onClick={handleCheckUpdates}
          disabled={isCheckingUpdates || !isOnline}
          className={`ml-2 p-1.5 rounded-md transition-all ${
            isCheckingUpdates 
              ? 'text-blue-500 bg-blue-50' 
              : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
          }`}
          title="Verificar actualizaciones"
        >
          <RefreshCw className={`w-4 h-4 ${isCheckingUpdates ? 'animate-spin' : ''}`} />
        </button>
      </div>
      
      <div className="flex items-center gap-3">
        {hasUpdates && !isSyncing && (
          <button
            onClick={handleManualSync}
            className="flex items-center gap-2 bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#DC2626] px-3 py-1.5 rounded-full text-sm font-medium transition-colors border border-[#FCA5A5] shadow-sm animate-pulse"
            title="Hay nuevos datos en la nube"
          >
            <CloudDownload className="w-4 h-4" />
            Nuevos Datos
          </button>
        )}
        <SyncIndicator isSyncing={isSyncing} />
        <ConnectionBadge isOnline={isOnline} />
        <UserMenu />
      </div>
    </header>
  );
}
