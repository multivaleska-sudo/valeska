import { ArrowLeft, CheckCircle, FileText } from "lucide-react";
import { useNavigate, useParams } from "react-router";

export function XMLReviewPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/xml")}
          className="p-2 hover:bg-white rounded-md transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[#6B7280]" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-[#111827]">
            Revisión XML {id}
          </h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Edición y validación de campos extraídos
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Extracted Fields Editor */}
        <div className="bg-white rounded-lg border border-[#E5E7EB] p-6">
          <h2 className="text-lg font-semibold text-[#111827] mb-4">
            Campos Extraídos
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-2">
                Placa
              </label>
              <input
                type="text"
                defaultValue="ABC-123"
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-2">
                VIN
              </label>
              <input
                type="text"
                defaultValue="1HGBH41JXMN109186"
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] font-mono"
              />
            </div>
          </div>
          <button className="w-full mt-6 px-4 py-2 bg-[#2563EB] text-white rounded-md hover:bg-[#1D4ED8] transition-colors flex items-center justify-center gap-2">
            <FileText className="w-4 h-4" />
            Crear trámite desde XML
          </button>
        </div>

        {/* XML Raw Viewer */}
        <div className="bg-white rounded-lg border border-[#E5E7EB] p-6">
          <h2 className="text-lg font-semibold text-[#111827] mb-4">
            XML Original
          </h2>
          <div className="bg-gray-900 rounded p-4 font-mono text-xs text-green-400 overflow-auto max-h-[500px]">
            {"<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<documento>\n  <placa>ABC-123</placa>\n  <vin>1HGBH41JXMN109186</vin>\n</documento>"}
          </div>
        </div>
      </div>
    </div>
  );
}
