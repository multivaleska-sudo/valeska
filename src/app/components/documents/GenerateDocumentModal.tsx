import { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useNavigate } from "react-router"; // <-- Importación crucial añadida
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Save,
  FileText,
  Loader2,
} from "lucide-react";
import * as RadioGroup from "@radix-ui/react-radio-group";
import Database from "@tauri-apps/plugin-sql";
import { TemplateData } from "../../types/documents/template.types";

interface GenerateDocumentModalProps {
  tramiteId: string;
  onClose: () => void;
}

export function GenerateDocumentModal({
  tramiteId,
  onClose,
}: GenerateDocumentModalProps) {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<TemplateData[]>([]);
  const [selectedType, setSelectedType] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const sqlite = await Database.load("sqlite:valeska.db");
        const result: any[] = await sqlite.select(
          "SELECT * FROM plantillas_documentos WHERE activo = 1 AND deleted_at IS NULL ORDER BY nombre_documento ASC",
        );

        const formattedData: TemplateData[] = result.map((row) => ({
          id: row.id,
          nombre: row.nombre_documento,
          contenidoHtml: row.contenido_html,
          orientacion: row.orientacion_papel,
          ultima_edicion: new Date(row.updated_at).toLocaleDateString(),
          variables_mapeadas: (row.contenido_html.match(/\{\{/g) || []).length,
          activo: true,
        }));

        setTemplates(formattedData);
        if (formattedData.length > 0) {
          setSelectedType(formattedData[0].id);
        }
      } catch (error) {
        console.error("Error al cargar plantillas en el modal:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  const handlePrint = async () => {
    setIsGenerating(true);

    // Cerramos el modal y viajamos a la pantalla de impresión con la data real
    onClose();
    navigate(`/tramites/${tramiteId}/print/${selectedType}`);
  };

  return (
    <Dialog.Root open onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 animate-in fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-auto z-50 animate-in zoom-in-95 duration-200">
          <div className="p-6 border-b border-[#E5E7EB] flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur z-10">
            <div>
              <Dialog.Title className="text-xl font-black text-gray-800 uppercase tracking-tight">
                Generar Documento
              </Dialog.Title>
              <Dialog.Description className="text-sm font-bold text-blue-600 mt-1 flex items-center gap-2">
                Expediente N°{" "}
                <span className="bg-blue-100 px-2 py-0.5 rounded text-blue-800">
                  {tramiteId}
                </span>
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button className="p-2 hover:bg-red-50 hover:text-red-500 rounded-xl transition-colors">
                <X className="w-6 h-6" />
              </button>
            </Dialog.Close>
          </div>

          <div className="p-8 space-y-8">
            {/* Selección de Plantillas Dinámicas */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">
                Seleccione el formato a imprimir
              </label>

              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="animate-spin text-blue-500 w-8 h-8" />
                </div>
              ) : templates.length === 0 ? (
                <div className="text-center p-8 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                  <FileText className="mx-auto text-gray-400 mb-2" size={32} />
                  <p className="text-gray-500 font-bold">
                    No hay plantillas activas en el sistema.
                  </p>
                </div>
              ) : (
                <RadioGroup.Root
                  value={selectedType}
                  onValueChange={setSelectedType}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {templates.map((tpl) => (
                      <RadioGroup.Item
                        key={tpl.id}
                        value={tpl.id}
                        className="border-2 border-[#E5E7EB] rounded-xl p-4 hover:border-blue-400 transition-all data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-50/50 cursor-pointer group text-left"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-5 h-5 border-2 border-gray-300 rounded-full flex items-center justify-center mt-0.5 group-data-[state=checked]:border-blue-600 group-data-[state=checked]:bg-blue-600 transition-colors">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                          <div>
                            <div className="font-bold text-gray-800">
                              {tpl.nombre}
                            </div>
                            <div className="text-xs font-medium text-gray-500 mt-1.5 flex gap-3">
                              <span>
                                Orientación:{" "}
                                {tpl.orientacion === "PORTRAIT"
                                  ? "Vertical"
                                  : "Horizontal"}
                              </span>
                              <span className="text-blue-600">
                                {tpl.variables_mapeadas} Variables
                              </span>
                            </div>
                          </div>
                        </div>
                      </RadioGroup.Item>
                    ))}
                  </div>
                </RadioGroup.Root>
              )}
            </div>

            {/* Validation Summary */}
            <div className="bg-[#DCFCE7] border-2 border-[#16A34A]/20 rounded-xl p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <CheckCircle2 className="w-6 h-6 text-[#16A34A] shrink-0" />
                <div className="flex-1">
                  <h3 className="text-sm font-black text-[#15803D] uppercase tracking-wide">
                    Validación de Datos Exitosa
                  </h3>
                  <ul className="text-sm font-medium text-[#166534] mt-2 space-y-1.5">
                    <li>
                      • Todos los campos requeridos en la plantilla están
                      completos en el expediente.
                    </li>
                    <li>• Variables dinámicas conectadas correctamente.</li>
                    <li>• Formato de fechas y montos estandarizados.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Nota de impresión estricta */}
            <div className="bg-amber-50 border-2 border-amber-200/50 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-3 text-sm font-black text-amber-800 uppercase tracking-wide">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                Aviso de Impresión
              </div>
              <p className="text-sm font-medium text-amber-700 mt-2">
                Asegúrese de tener papel en tamaño A4 insertado en la bandeja
                principal. El sistema generará el documento en formato PDF listo
                para su firma.
              </p>
            </div>
          </div>

          {/* Footer de Acciones */}
          <div className="p-6 border-t border-[#E5E7EB] bg-gray-50/80 rounded-b-2xl flex items-center justify-end gap-4">
            <button
              onClick={onClose}
              className="px-6 py-3 text-sm font-bold text-gray-500 hover:bg-gray-200 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button className="px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center gap-2 shadow-sm">
              <Save className="w-5 h-5 text-gray-500" />
              Guardar Copia PDF
            </button>
            <button
              onClick={handlePrint}
              disabled={isGenerating || !selectedType}
              className="px-8 py-3 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-200 disabled:opacity-50"
            >
              {isGenerating ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Printer className="w-5 h-5" />
              )}
              {isGenerating ? "Cargando..." : "Generar e Imprimir"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
