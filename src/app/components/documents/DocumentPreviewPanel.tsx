import React from "react";
import { FileQuestion } from "lucide-react";
import { TemplateData } from "../../types/documents/template.types";

interface Props {
  document: TemplateData | null;
}

export function DocumentPreviewPanel({ document }: Props) {
  if (!document) {
    return (
      <div className="bg-slate-100 rounded-2xl border border-dashed border-gray-300 h-[600px] flex flex-col items-center justify-center text-gray-400">
        <FileQuestion size={48} className="mb-4 opacity-50" />
        <p className="font-bold">Ninguna plantilla seleccionada</p>
        <p className="text-sm mt-1">
          Selecciona una plantilla de la lista para ver su diseño.
        </p>
      </div>
    );
  }

  const isPortrait = document.orientacion === "PORTRAIT";

  return (
    <div className="bg-gray-200/80 rounded-2xl border border-gray-200 overflow-hidden flex flex-col h-[calc(100vh-240px)] min-h-[500px] shadow-inner">
      <div className="bg-slate-700 px-4 py-2 flex items-center justify-between shadow-md z-10 shrink-0">
        <span className="text-xs font-bold text-slate-200 uppercase tracking-widest">
          Vista Previa: {document.nombre}
        </span>
        <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-1 rounded">
          MODO HTML DINÁMICO
        </span>
      </div>

      {/* Contenedor principal con Scroll libre e interno */}
      <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center custom-scrollbar">
        {/* Contenedor Físico Exacto (Calculado a escala 0.7 para que coincida con el editor) */}
        <div
          style={{
            width: isPortrait ? "555.8px" : "786.1px",
            minHeight: isPortrait ? "786.1px" : "555.8px",
          }}
          className="relative shrink-0 mb-10"
        >
          {/* HOJA A4 VIRTUAL (Tamaño real, pero escalada visualmente al 70%) */}
          <div
            className={`bg-white shadow-2xl absolute top-0 left-0 origin-top-left
              ${isPortrait ? "w-[794px] min-h-[1123px]" : "w-[1123px] min-h-[794px]"}
            `}
            style={{ transform: "scale(0.7)" }}
          >
            {/* Aquí inyectamos el HTML */}
            <div
              className="w-full h-full text-gray-800 pb-12 relative"
              dangerouslySetInnerHTML={{ __html: document.contenidoHtml }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
