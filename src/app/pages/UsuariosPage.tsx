import { UserCog, Plus } from "lucide-react";

export function UsuariosPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#111827]">Usuarios</h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Gestión de usuarios del dispositivo
          </p>
        </div>
        <button className="px-4 py-2 bg-[#2563EB] text-white rounded-md hover:bg-[#1D4ED8] transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nuevo Usuario
        </button>
      </div>
      <div className="bg-white rounded-lg border border-[#E5E7EB] p-12 text-center">
        <UserCog className="w-12 h-12 text-[#E5E7EB] mx-auto mb-3" />
        <p className="text-sm text-[#6B7280]">
          Gestión de usuarios (Solo Admin Dispositivo)
        </p>
      </div>
    </div>
  );
}
