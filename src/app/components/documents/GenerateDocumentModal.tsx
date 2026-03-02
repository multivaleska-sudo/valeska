import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, CheckCircle2, AlertTriangle, XCircle, FileText, Printer, Save } from "lucide-react";
import * as RadioGroup from "@radix-ui/react-radio-group";

interface GenerateDocumentModalProps {
  tramiteId: string;
  onClose: () => void;
}

type DocumentType = "sunarp-a" | "sunarp-b" | "r-estricto" | "excel" | "recibo";

export function GenerateDocumentModal({ tramiteId, onClose }: GenerateDocumentModalProps) {
  const [selectedType, setSelectedType] = useState<DocumentType>("sunarp-a");
  const [templateVersion, setTemplateVersion] = useState("1.2.0");

  const documentTypes = [
    { id: "sunarp-a" as DocumentType, label: "SUNARP A", description: "Formato estándar A" },
    { id: "sunarp-b" as DocumentType, label: "SUNARP B", description: "Formato estándar B" },
    { id: "r-estricto" as DocumentType, label: "R estricto", description: "Formato estricto con calibración" },
    { id: "excel" as DocumentType, label: "Excel", description: "Hoja de cálculo" },
    { id: "recibo" as DocumentType, label: "Recibo", description: "Recibo de entrega" },
  ];

  return (
    <Dialog.Root open onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-auto z-50">
          <div className="p-6 border-b border-[#E5E7EB] flex items-center justify-between sticky top-0 bg-white">
            <div>
              <Dialog.Title className="text-xl font-semibold text-[#111827]">
                Generar Documento
              </Dialog.Title>
              <Dialog.Description className="text-sm text-[#6B7280] mt-1">
                Trámite {tramiteId}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button className="p-2 hover:bg-gray-100 rounded-md transition-colors">
                <X className="w-5 h-5 text-[#6B7280]" />
              </button>
            </Dialog.Close>
          </div>

          <div className="p-6 space-y-6">
            {/* Document Type Selection */}
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-3">
                Tipo de documento
              </label>
              <RadioGroup.Root value={selectedType} onValueChange={(v) => setSelectedType(v as DocumentType)}>
                <div className="grid grid-cols-2 gap-3">
                  {documentTypes.map((type) => (
                    <RadioGroup.Item
                      key={type.id}
                      value={type.id}
                      className="border-2 border-[#E5E7EB] rounded-lg p-4 hover:border-[#2563EB] transition-colors data-[state=checked]:border-[#2563EB] data-[state=checked]:bg-[#EFF6FF] cursor-pointer"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 border-2 border-[#E5E7EB] rounded-full flex items-center justify-center mt-0.5 data-[state=checked]:border-[#2563EB] data-[state=checked]:bg-[#2563EB]">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                        <div>
                          <div className="font-medium text-[#111827]">{type.label}</div>
                          <div className="text-sm text-[#6B7280] mt-1">{type.description}</div>
                        </div>
                      </div>
                    </RadioGroup.Item>
                  ))}
                </div>
              </RadioGroup.Root>
            </div>

            {/* Validation Summary */}
            <div className="bg-[#DCFCE7] border border-[#16A34A] rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#16A34A] shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-[#15803D]">
                    Validación exitosa
                  </h3>
                  <ul className="text-sm text-[#166534] mt-2 space-y-1">
                    <li>• Todos los campos requeridos están completos</li>
                    <li>• VIN y Número de Serie se imprimen igual (regla fija)</li>
                    <li>• Formato de datos correcto</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Configuration Options */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-[#111827]">Configuración</h3>
              
              {/* Template Version for A/B */}
              {(selectedType === "sunarp-a" || selectedType === "sunarp-b") && (
                <div>
                  <label className="block text-sm text-[#6B7280] mb-2">
                    Versión de plantilla
                  </label>
                  <select
                    value={templateVersion}
                    onChange={(e) => setTemplateVersion(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  >
                    <option value="1.2.0">v1.2.0 (Actual)</option>
                    <option value="1.1.5">v1.1.5</option>
                    <option value="1.0.0">v1.0.0</option>
                  </select>
                </div>
              )}

              {/* R Estricto Options */}
              {selectedType === "r-estricto" && (
                <div className="space-y-4">
                  <div className="bg-[#FEF3C7] border border-[#F59E0B] rounded-lg p-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-[#92400E]">
                      <AlertTriangle className="w-4 h-4" />
                      Modo de impresión estricto
                    </div>
                    <p className="text-sm text-[#92400E] mt-2">
                      Este formato requiere calibración de impresora
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm text-[#6B7280] mb-2">
                      Perfil de impresora
                    </label>
                    <select className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB]">
                      <option>HP LaserJet Pro - Oficina Principal</option>
                      <option>Canon Pixma - Sucursal 2</option>
                    </select>
                  </div>
                  <button className="text-sm text-[#2563EB] hover:underline flex items-center gap-2">
                    <Printer className="w-4 h-4" />
                    Calibrar impresora
                  </button>
                </div>
              )}
            </div>

            {/* Preview */}
            <div>
              <h3 className="text-sm font-medium text-[#111827] mb-3">Vista Previa</h3>
              <div className="aspect-[8.5/11] bg-gray-100 rounded border-2 border-dashed border-[#E5E7EB] flex items-center justify-center">
                <div className="text-center">
                  <FileText className="w-12 h-12 text-[#6B7280] mx-auto mb-2" />
                  <p className="text-sm text-[#6B7280]">
                    {selectedType === "r-estricto" ? "Vista única" : "Vista paginada"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-[#E5E7EB] bg-gray-50 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-[#6B7280] hover:text-[#111827] transition-colors"
            >
              Cancelar
            </button>
            <button className="px-4 py-2 bg-white border border-[#E5E7EB] text-[#111827] rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2">
              <Save className="w-4 h-4" />
              Generar y guardar local
            </button>
            <button className="px-4 py-2 bg-[#2563EB] text-white rounded-md hover:bg-[#1D4ED8] transition-colors flex items-center gap-2">
              <Printer className="w-4 h-4" />
              Generar e imprimir
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
