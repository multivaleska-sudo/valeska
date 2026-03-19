import { useEffect, useState } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { User, LogOut, Settings } from "lucide-react";
import { useNavigate } from "react-router";
import { useAuthLogic } from "../logic/auth/useAuthLogic";

export function UserMenu() {
  const navigate = useNavigate();
  const { logout } = useAuthLogic();

  const [userData, setUserData] = useState<{
    nombre: string;
    rol: string;
  } | null>(null);

  useEffect(() => {
    const sessionStr = localStorage.getItem("valeska_session_user");
    if (sessionStr) {
      setUserData(JSON.parse(sessionStr));
    }
  }, []);

  const formatRole = (rol?: string) => {
    if (rol === "ADMIN_CENTRAL") return "Administrador Central";
    if (rol === "OPERADOR") return "Operador de Sucursal";
    return "Usuario del Sistema";
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors outline-none">
          <div className="w-8 h-8 bg-[#2563EB] rounded-full flex items-center justify-center shadow-sm">
            <User className="w-5 h-5 text-white" />
          </div>
          <div className="text-left hidden lg:block">
            <div className="text-sm font-bold text-[#111827] capitalize">
              {userData?.nombre ? userData.nombre.toLowerCase() : "Cargando..."}
            </div>
            <div className="text-xs text-[#6B7280] font-medium mt-0.5">
              {formatRole(userData?.rol)}
            </div>
          </div>
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="bg-white rounded-xl shadow-xl border border-[#E5E7EB] p-1.5 min-w-[220px] z-50 animate-in fade-in zoom-in-95 duration-200"
          sideOffset={8}
          align="end"
        >
          <DropdownMenu.Item
            className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-[#111827] rounded-md hover:bg-gray-100 cursor-pointer outline-none transition-colors"
            onSelect={() => navigate("/config")}
          >
            <Settings className="w-4 h-4 text-gray-500" />
            Configuración del Sistema
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="h-px bg-[#E5E7EB] my-1.5 mx-1" />

          <DropdownMenu.Item
            className="flex items-center gap-2.5 px-3 py-2 text-sm font-bold text-[#DC2626] rounded-md hover:bg-red-50 cursor-pointer outline-none transition-colors"
            onSelect={() => logout()}
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión Segura
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
