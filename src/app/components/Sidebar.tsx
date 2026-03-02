import { NavLink } from "react-router";
import {
  LayoutDashboard,
  FileText,
  Users,
  Tag,
  FileCode,
  FolderOpen,
  Receipt,
  RefreshCw,
  UserCog,
  Radio,
  HelpCircle,
  Settings,
} from "lucide-react";
import { cn } from "../lib/utils";
import * as Tooltip from "@radix-ui/react-tooltip";

interface SidebarProps {
  collapsed: boolean;
}

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { path: "/tramites", label: "Trámites", icon: FileText },
  { path: "/clientes", label: "Clientes", icon: Users },
  { path: "/situaciones", label: "Situaciones", icon: Tag },
  { path: "/xml", label: "XML SUNAT", icon: FileCode },
  { path: "/documentos", label: "Documentos", icon: FolderOpen },
  { path: "/recibos", label: "Recibos", icon: Receipt },
  { path: "/sync", label: "Sincronización", icon: RefreshCw },
  { path: "/usuarios", label: "Usuarios", icon: UserCog },
  { path: "/central", label: "Central", icon: Radio },
  { path: "/ayuda", label: "Ayuda", icon: HelpCircle },
  { path: "/config", label: "Configuración", icon: Settings },
];

export function Sidebar({ collapsed }: SidebarProps) {
  return (
    <Tooltip.Provider delayDuration={0}>
      <aside
        className={cn(
          "bg-white border-r border-[#E5E7EB] transition-all duration-300 shrink-0",
          collapsed ? "w-[72px]" : "w-[264px]"
        )}
      >
        <nav className="p-2 space-y-1">
          {navItems.map((item) => (
            <NavItem
              key={item.path}
              {...item}
              collapsed={collapsed}
            />
          ))}
        </nav>
      </aside>
    </Tooltip.Provider>
  );
}

interface NavItemProps {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  collapsed: boolean;
  end?: boolean;
}

function NavItem({ path, label, icon: Icon, collapsed, end }: NavItemProps) {
  const content = (
    <NavLink
      to={path}
      end={end}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 px-3 py-2 rounded-md transition-colors group",
          "hover:bg-[#EFF6FF] hover:text-[#2563EB]",
          isActive
            ? "bg-[#EFF6FF] text-[#2563EB]"
            : "text-[#6B7280]",
          collapsed && "justify-center"
        )
      }
    >
      <Icon className="w-5 h-5 shrink-0" />
      {!collapsed && <span className="text-sm font-medium">{label}</span>}
    </NavLink>
  );

  if (collapsed) {
    return (
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          {content}
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side="right"
            className="bg-gray-900 text-white px-3 py-2 rounded-md text-sm shadow-lg z-50"
            sideOffset={5}
          >
            {label}
            <Tooltip.Arrow className="fill-gray-900" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    );
  }

  return content;
}
