import React from "react";
import { Printer, ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { usePrintDocumentLogic } from "../../logic/documents/usePrintDocumentLogic";

export function PrintDocumentPage() {
  // Consumimos toda la lógica limpia
  const { renderedHtml, orientacion, isLoading, error, navigate, handlePrint } =
    usePrintDocumentLogic();

  // ESTADO DE CARGA
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-200">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  // ESTADO DE ERROR (Si falla algo en la base de datos o la plantilla está vacía)
  if (error) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-200 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center border border-red-100 max-w-lg">
          <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-black text-gray-800 mb-2 uppercase">
            Error de Generación
          </h2>
          <p className="text-red-600 font-medium mb-6">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold shadow-md hover:bg-blue-700 transition-colors"
          >
            Volver al Trámite
          </button>
        </div>
      </div>
    );
  }

  // RENDERIZADO DEL DOCUMENTO (ÉXITO)
  const isPortrait = orientacion === "PORTRAIT";

  return (
    <div className="bg-transparent flex flex-col items-center pb-12 w-full">
      {/* HEADER INTEGRADO (Solo visible en pantalla, no en impresión) */}
      <div className="print:hidden w-full max-w-5xl bg-white border border-gray-200 shadow-sm p-4 rounded-xl flex items-center justify-between mt-4 mb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-4 py-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg font-bold transition-all"
        >
          <ArrowLeft size={18} /> Regresar
        </button>

        <div className="text-sm font-black tracking-widest text-blue-900 uppercase">
          Vista Previa de Impresión
        </div>

        <button
          onClick={handlePrint}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-md shadow-blue-200 transition-all active:scale-95"
        >
          <Printer size={18} /> Imprimir Documento
        </button>
      </div>

      {/* ESTILOS GLOBALES ESTRICTOS PARA LA IMPRESORA */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #impresion-a4, #impresion-a4 * {
            visibility: visible;
          }
          #impresion-a4 {
            position: absolute;
            left: 0;
            top: 0;
            margin: 0;
            padding: 0;
          }
          @page { size: A4 ${isPortrait ? "portrait" : "landscape"}; margin: 0; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background-color: white !important; }
        }
      `,
        }}
      />

      {/* HOJA A4 FINAL (Crece libremente sin cortarse) */}
      <div
        id="impresion-a4"
        className={`bg-white shadow-2xl print:shadow-none print:m-0 relative overflow-hidden
          ${isPortrait ? "w-[210mm] min-h-[297mm]" : "w-[297mm] min-h-[210mm]"}
        `}
      >
        <div
          className="w-full h-full text-black"
          dangerouslySetInnerHTML={{ __html: renderedHtml }}
        />
      </div>
    </div>
  );
}
