import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Move,
  Grid3X3,
  Image as ImageIcon,
  Save,
  X,
  Plus,
  Minus,
} from "lucide-react";

// Herramientas y tipos de datos
interface EditableElement {
  tempId: string;
  variable: string;
  originalText: string;
  top: number;
  left: number;
  fontSize: number;
  bold: boolean;
}

interface VisualLayoutEditorProps {
  htmlContent: string;
  onChange: (newHtml: string) => void;
  onClose: () => void;
}

const CM_TO_PX = 37.7952755906; // Utilizado para convertir cm a px (96 DPI)

const DraggableItem = ({
  item,
  zoom,
  onUpdate,
  snapToGrid,
}: {
  item: EditableElement;
  zoom: number;
  onUpdate: (id: string, updates: Partial<EditableElement>) => void;
  snapToGrid: boolean;
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0, left: 0, top: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    // Guardamos la posición inicial del ratón y del elemento
    dragStartPos.current = {
      x: e.clientX,
      y: e.clientY,
      left: item.left,
      top: item.top,
    };
  };

  const handleGlobalMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      const dxPx = (e.clientX - dragStartPos.current.x) / zoom;
      const dyPx = (e.clientY - dragStartPos.current.y) / zoom;
      let newLeft = dragStartPos.current.left + dxPx / CM_TO_PX;
      let newTop = dragStartPos.current.top + dyPx / CM_TO_PX;

      if (snapToGrid) {
        // Ajuste a 1mm de precisión
        newLeft = Math.round(newLeft * 10) / 10;
        newTop = Math.round(newTop * 10) / 10;
      }

      onUpdate(item.tempId, { left: newLeft, top: newTop });
    },
    [isDragging, zoom, snapToGrid, onUpdate, item.tempId],
  );

  const handleGlobalMouseUp = useCallback(() => setIsDragging(false), []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleGlobalMouseMove);
      window.addEventListener("mouseup", handleGlobalMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [isDragging, handleGlobalMouseMove, handleGlobalMouseUp]);

  return (
    <div
      className={`absolute select-none group ${isDragging ? "z-50" : "z-10"}`}
      style={{
        left: `${item.left * CM_TO_PX}px`,
        top: `${item.top * CM_TO_PX}px`,
      }}
    >
      <div
        onMouseDown={handleMouseDown}
        className={`relative cursor-move p-1 rounded border ${isDragging ? "bg-blue-100/80 border-blue-500 shadow-xl scale-105" : "border-blue-400 bg-white/40 hover:bg-white shadow-sm"}`}
        style={{
          fontSize: `${item.fontSize}px`,
          fontWeight: item.bold ? "bold" : "normal",
          fontFamily: "Arial, sans-serif",
        }}
      >
        {/* Indicador de posición y coordenadas */}
        <div className="absolute -top-5 left-0 bg-blue-700 text-white text-[8px] px-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
          {item.left.toFixed(1)}cm x {item.top.toFixed(1)}cm
        </div>

        {/* Contenido que se muestra en el elemento */}
        {item.originalText}
      </div>
    </div>
  );
};

export default function VisualLayoutEditor({
  htmlContent,
  onChange,
  onClose,
}: VisualLayoutEditorProps) {
  const [elements, setElements] = useState<EditableElement[]>([]);
  const [showGrid, setShowGrid] = useState(true);
  const [zoom, setZoom] = useState(0.65);

  // Aquí se procesa el HTML para extraer los elementos editables
  useEffect(() => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, "text/html");
    const all = Array.from(doc.body.querySelectorAll("*"));
    const extracted: EditableElement[] = [];

    all.forEach((el, idx) => {
      if (!(el instanceof HTMLElement)) return;
      const content = el.innerHTML.trim();

      // Buscamos elementos que tengan variables {{}} o que ya tengan posición absoluta
      const hasVar = /{{.*?}}/.test(content);
      const isLeaf = el.children.length === 0;

      if ((el.style.position === "absolute" || hasVar) && isLeaf) {
        const tempId = `el_${idx}`;
        extracted.push({
          tempId,
          variable: content,
          originalText: content,
          top: parseFloat(el.style.top) || 2,
          left: parseFloat(el.style.left) || 2,
          fontSize: parseInt(el.style.fontSize) || 13,
          bold: el.style.fontWeight === "bold",
        });
      }
    });
    setElements(extracted);
  }, [htmlContent]);

  const handleSave = () => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, "text/html");
    const all = Array.from(doc.body.querySelectorAll("*"));

    elements.forEach((el) => {
      // Buscamos el elemento original por contenido para actualizar sus estilos de posición
      const target = all.find(
        (node) =>
          node instanceof HTMLElement &&
          node.innerHTML.trim() === el.originalText,
      ) as HTMLElement;

      if (target) {
        target.style.position = "absolute";
        target.style.top = `${el.top.toFixed(2)}cm`;
        target.style.left = `${el.left.toFixed(2)}cm`;
        target.style.fontSize = `${el.fontSize}px`;
        target.style.fontWeight = el.bold ? "bold" : "normal";
      }
    });

    onChange(doc.body.innerHTML);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/90 flex flex-col backdrop-blur-md">
      {/* Barra de herramientas superior */}
      <div className="h-14 bg-white border-b flex items-center justify-between px-6 shadow-md">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="p-2 hover:bg-red-50 text-red-500 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
          <h2 className="text-sm font-black uppercase tracking-tighter text-slate-800">
            Diseñador Visual
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${showGrid ? "bg-blue-600 text-white shadow-lg" : "bg-slate-100 text-slate-500"}`}
          >
            <Grid3X3 size={14} className="inline mr-2" /> Rejilla
          </button>

          <div className="flex items-center gap-1 bg-slate-100 rounded-lg px-2 py-1">
            <button
              onClick={() => setZoom((z) => Math.max(0.3, z - 0.1))}
              className="p-1 hover:text-blue-600"
            >
              <Minus size={14} />
            </button>
            <span className="text-[10px] font-mono font-bold w-10 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(1.5, z + 0.1))}
              className="p-1 hover:text-blue-600"
            >
              <Plus size={14} />
            </button>
          </div>

          <button
            onClick={handleSave}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-xs font-black shadow-lg shadow-emerald-200 transition-all flex items-center gap-2 active:scale-95"
          >
            <Save size={16} /> GUARDAR POSICIONES
          </button>
        </div>
      </div>

      {/* Área de diseño principal */}
      <div className="flex-1 overflow-auto bg-slate-200/50 flex justify-center items-start p-10 custom-scrollbar">
        <div
          className="bg-white shadow-2xl relative border border-slate-300 origin-top"
          style={{
            width: "21cm",
            height: "29.7cm",
            transform: `scale(${zoom})`,
          }}
        >
          {/* Documento base (Fondo renderizado con opacidad) */}
          <div
            className="absolute inset-0 pointer-events-none opacity-30 select-none overflow-hidden"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />

          {/* Capa de rejilla de apoyo */}
          {showGrid && (
            <div
              className="absolute inset-0 pointer-events-none opacity-10"
              style={{
                backgroundImage:
                  "radial-gradient(#000 0.5px, transparent 0.5px)",
                backgroundSize: "0.5cm 0.5cm",
              }}
            />
          )}

          {/* Elementos móviles (Controladores de arrastre) */}
          {elements.map((el) => (
            <DraggableItem
              key={el.tempId}
              item={el}
              zoom={zoom}
              snapToGrid={showGrid}
              onUpdate={(id, upds) =>
                setElements((prev) =>
                  prev.map((e) => (e.tempId === id ? { ...e, ...upds } : e)),
                )
              }
            />
          ))}
        </div>
      </div>

      {/* Barra de estado inferior */}
      <div className="h-8 bg-slate-900 flex items-center px-6 text-[9px] text-slate-500 font-mono uppercase tracking-widest justify-between">
        <span>CAMPOS DETECTADOS: {elements.length}</span>
        <span>HOJA A4 (210mm x 297mm)</span>
      </div>
    </div>
  );
}
