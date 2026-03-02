import { Upload, FileCode, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router";

export function XMLImportPage() {
  const navigate = useNavigate();

  const recentImports = [
    { id: "xml-001", filename: "SUNAT_20240301_001.xml", date: "2024-03-01 14:30", status: "Procesado" },
    { id: "xml-002", filename: "SUNAT_20240301_002.xml", date: "2024-03-01 15:00", status: "Procesado" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#111827]">XML SUNAT</h1>
        <p className="text-sm text-[#6B7280] mt-1">
          Importar y revisar archivos XML de SUNAT
        </p>
      </div>

      {/* File Uploader */}
      <div className="bg-white rounded-lg border border-[#E5E7EB] p-8">
        <div className="border-2 border-dashed border-[#E5E7EB] rounded-lg p-12 text-center hover:border-[#2563EB] transition-colors cursor-pointer">
          <Upload className="w-12 h-12 text-[#6B7280] mx-auto mb-4" />
          <h3 className="text-lg font-medium text-[#111827] mb-2">
            Arrastra archivos XML aquí
          </h3>
          <p className="text-sm text-[#6B7280] mb-4">
            o haz clic para seleccionar archivos
          </p>
          <button className="px-4 py-2 bg-[#2563EB] text-white rounded-md hover:bg-[#1D4ED8] transition-colors">
            Seleccionar archivos
          </button>
        </div>
      </div>

      {/* Recent Imports */}
      <div className="bg-white rounded-lg border border-[#E5E7EB]">
        <div className="p-6 border-b border-[#E5E7EB]">
          <h2 className="text-lg font-semibold text-[#111827]">
            Importaciones Recientes
          </h2>
        </div>
        <div className="divide-y divide-[#E5E7EB]">
          {recentImports.map((item) => (
            <div
              key={item.id}
              className="p-4 hover:bg-[#F9FAFB] cursor-pointer transition-colors"
              onClick={() => navigate(`/xml/${item.id}`)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileCode className="w-5 h-5 text-[#2563EB]" />
                  <div>
                    <h3 className="text-sm font-medium text-[#111827]">
                      {item.filename}
                    </h3>
                    <p className="text-xs text-[#6B7280] mt-1">{item.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#16A34A]" />
                  <span className="text-sm text-[#16A34A]">{item.status}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
