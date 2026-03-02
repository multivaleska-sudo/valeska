import { Search, Plus, User } from "lucide-react";
import { useNavigate } from "react-router";

export function ClientesListPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#111827]">Clientes</h1>
          <p className="text-sm text-[#6B7280] mt-1">Gestión de clientes</p>
        </div>
        <button
          onClick={() => navigate("/clientes/new")}
          className="px-4 py-2 bg-[#2563EB] text-white rounded-md hover:bg-[#1D4ED8] transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nuevo Cliente
        </button>
      </div>

      <div className="bg-white rounded-lg border border-[#E5E7EB] p-6">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280]" />
          <input
            type="text"
            placeholder="Buscar clientes..."
            className="w-full pl-10 pr-4 py-2 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
          />
        </div>
        <div className="text-center py-12">
          <User className="w-12 h-12 text-[#E5E7EB] mx-auto mb-3" />
          <p className="text-sm text-[#6B7280]">Lista de clientes</p>
        </div>
      </div>
    </div>
  );
}
