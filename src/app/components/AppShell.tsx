import { Outlet } from "react-router";
import { Topbar } from "./Topbar";
import { Sidebar } from "./Sidebar";
import { useState, useEffect } from "react";
import { useAuthLogic } from "../logic/auth/useAuthLogic";
import { Loader2 } from "lucide-react";

export function AppShell() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const { checkInitialSetup, isLoading } = useAuthLogic();

  useEffect(() => {
    checkInitialSetup();
  }, []);

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#F6F7FB] text-[#6B7280]">
        <Loader2 className="w-8 h-8 animate-spin text-[#2563EB] mb-4" />
        <p className="font-medium text-sm">
          Verificando seguridad del sistema...
        </p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#F6F7FB]">
      <Topbar onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar collapsed={sidebarCollapsed} />
        <main className="flex-1 overflow-auto p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
