import { Receipt } from "lucide-react";

export function RecibosListPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#111827]">Recibos</h1>
        <p className="text-sm text-[#6B7280] mt-1">Gestión de recibos de entrega</p>
      </div>
      <div className="bg-white rounded-lg border border-[#E5E7EB] p-12 text-center">
        <Receipt className="w-12 h-12 text-[#E5E7EB] mx-auto mb-3" />
        <p className="text-sm text-[#6B7280]">Lista de recibos</p>
      </div>
    </div>
  );
}
