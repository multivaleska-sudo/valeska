import { FileText, Hash, Folder } from "lucide-react";

interface DocumentPreviewPanelProps {
  document: any;
}

export function DocumentPreviewPanel({ document }: DocumentPreviewPanelProps) {
  if (!document) {
    return (
      <div className="bg-white rounded-lg border border-[#E5E7EB] p-12 flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-16 h-16 text-[#E5E7EB] mx-auto mb-3" />
          <p className="text-sm text-[#6B7280]">
            Selecciona un documento para ver la vista previa
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-[#E5E7EB] overflow-hidden">
      <div className="p-4 border-b border-[#E5E7EB]">
        <h2 className="font-semibold text-[#111827]">Vista Previa</h2>
      </div>
      <div className="p-6">
        {/* PDF Preview Placeholder */}
        <div className="aspect-[8.5/11] bg-gray-100 rounded border border-[#E5E7EB] mb-6 flex items-center justify-center">
          <FileText className="w-16 h-16 text-[#6B7280]" />
        </div>

        {/* Metadata */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#6B7280] mb-1">
              <Hash className="w-3.5 h-3.5" />
              Hash
            </div>
            <p className="text-sm font-mono text-[#111827] break-all">
              {document.hash}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs text-[#6B7280] mb-1">
              <Folder className="w-3.5 h-3.5" />
              Ruta
            </div>
            <p className="text-sm font-mono text-[#111827] break-all">
              {document.ruta}
            </p>
          </div>
          <div>
            <div className="text-xs text-[#6B7280] mb-1">
              Storage Key
            </div>
            <p className="text-sm font-mono text-[#111827] break-all">
              storage_key_{document.id}_{Date.now()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
