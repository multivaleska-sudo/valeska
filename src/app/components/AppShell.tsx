import { Outlet } from "react-router";
import { Topbar } from "./Topbar";
import { Sidebar } from "./Sidebar";
import { useState } from "react";

export function AppShell() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
