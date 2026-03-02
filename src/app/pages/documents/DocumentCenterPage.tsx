import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Plus, Search, FileText, Eye, Download, Trash2 } from "lucide-react";
import { useState } from "react";
import { GenerateDocumentModal } from "../../components/documents/GenerateDocumentModal";
import { DocumentPreviewPanel } from "../../components/documents/DocumentPreviewPanel";
import { StatusPill } from "../../components/StatusPill";
import { SyncChip } from "../../components/SyncChip";
import { ConflictChip } from "../../components/ConflictChip";

export function DocumentCenterPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);

  const documents = [
    {
      id: "1",
      nombre: "SUNARP_A_v1.pdf",
      tipo: "SUNARP A",
      fecha: "2024-03-01 14:30",
      estado: "Generado",
      hash: "a7f8e9d2c1b3...",
      ruta: "/docs/tramites/T-2024-0345/sunarp_a_v1.pdf",
    },
    {
      id: "2",
      nombre: "SUNARP_B_v1.pdf",
      tipo: "SUNARP B",
      fecha: "2024-03-01 14:35",
      estado: "Generado",
      hash: "b2e4f6a8c9d1...",
      ruta: "/docs/tramites/T-2024-0345/sunarp_b_v1.pdf",
    },
    {
      id: "3",
      nombre: "Recibo_strict.pdf",
      tipo: "R estricto",
      fecha: "2024-03-01 15:00",
      estado: "Generado",
      hash: "c3d5e7f9a1b2...",
      ruta: "/docs/tramites/T-2024-0345/recibo_strict.pdf",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(id ? `/tramites/${id}` : "/documentos")}
          className="p-2 hover:bg-white rounded-md transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[#6B7280]" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-[#111827]">
            Documentos {id && `— Trámite ${id}`}
          </h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Gestión y generación de documentos
          </p>
        </div>
        {id && (
          <div className="flex items-center gap-2">
            <StatusPill status="En proceso" />
            <SyncChip synced={true} />
          </div>
        )}
      </div>

      {/* Actions Bar */}
      <div className="bg-white rounded-lg border border-[#E5E7EB] p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280]" />
            <input
              type="text"
              placeholder="Buscar documentos..."
              className="w-full pl-10 pr-4 py-2 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            />
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-white border border-[#E5E7EB] text-[#111827] rounded-md hover:bg-gray-50 transition-colors text-sm">
              Adjuntar
            </button>
            <button
              onClick={() => setShowGenerateModal(true)}
              className="px-4 py-2 bg-[#2563EB] text-white rounded-md hover:bg-[#1D4ED8] transition-colors flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              Generar documento
            </button>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Document List */}
        <div className="bg-white rounded-lg border border-[#E5E7EB] overflow-hidden">
          <div className="p-4 border-b border-[#E5E7EB]">
            <h2 className="font-semibold text-[#111827]">Lista de Documentos</h2>
          </div>
          <div className="divide-y divide-[#E5E7EB]">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className={`p-4 hover:bg-[#F9FAFB] cursor-pointer transition-colors ${
                  selectedDoc?.id === doc.id ? "bg-[#EFF6FF]" : ""
                }`}
                onClick={() => setSelectedDoc(doc)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <FileText className="w-5 h-5 text-[#2563EB] shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-[#111827] truncate">
                        {doc.nombre}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 bg-[#EFF6FF] text-[#2563EB] rounded">
                          {doc.tipo}
                        </span>
                        <span className="text-xs text-[#6B7280]">{doc.fecha}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <Eye className="w-4 h-4 text-[#6B7280]" />
                    </button>
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <Download className="w-4 h-4 text-[#6B7280]" />
                    </button>
                    <button className="p-1 hover:bg-red-50 rounded">
                      <Trash2 className="w-4 h-4 text-[#DC2626]" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Preview Panel */}
        <DocumentPreviewPanel document={selectedDoc} />
      </div>

      {/* Generate Document Modal */}
      {showGenerateModal && (
        <GenerateDocumentModal
          tramiteId={id || ""}
          onClose={() => setShowGenerateModal(false)}
        />
      )}
    </div>
  );
}
