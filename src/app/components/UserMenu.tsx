import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { User, LogOut, Settings } from "lucide-react";
import { useNavigate } from "react-router";

export function UserMenu() {
  const navigate = useNavigate();

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors">
          <div className="w-8 h-8 bg-[#2563EB] rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div className="text-left hidden lg:block">
            <div className="text-sm font-medium text-[#111827]">Admin Usuario</div>
            <div className="text-xs text-[#6B7280]">Sucursal Principal</div>
          </div>
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="bg-white rounded-lg shadow-lg border border-[#E5E7EB] p-1 min-w-[200px] z-50"
          sideOffset={5}
          align="end"
        >
          <DropdownMenu.Item
            className="flex items-center gap-2 px-3 py-2 text-sm text-[#111827] rounded-md hover:bg-gray-100 cursor-pointer outline-none"
            onSelect={() => navigate("/config")}
          >
            <Settings className="w-4 h-4" />
            Configuración
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="h-px bg-[#E5E7EB] my-1" />
          <DropdownMenu.Item
            className="flex items-center gap-2 px-3 py-2 text-sm text-[#DC2626] rounded-md hover:bg-red-50 cursor-pointer outline-none"
            onSelect={() => navigate("/auth/login")}
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
