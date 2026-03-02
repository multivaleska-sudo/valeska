import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router";

export function ReciboDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/recibos")}
          className="p-2 hover:bg-white rounded-md transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[#6B7280]" />
        </button>
        <h1 className="text-2xl font-semibold text-[#111827]">Recibo {id}</h1>
      </div>
      <div className="bg-white rounded-lg border border-[#E5E7EB] p-6">
        <p className="text-sm text-[#6B7280]">Detalle del recibo</p>
      </div>
    </div>
  );
}
