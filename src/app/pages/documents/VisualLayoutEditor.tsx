import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Grid3X3,
  Save,
  X,
  Plus,
  Minus,
  Type,
  Bold,
  ImageIcon,
  Layers,
  Monitor,
} from "lucide-react";

interface EditableElement {
  tempId: string;
  type: "text" | "image";
  tagName: string;
  variable?: string;
  originalText?: string;
  src?: string;
  top: number;
  left: number;
  fontSize?: number;
  bold?: boolean;
  width: number;
  height: number;
  textDecoration?: string;
  textAlign?: string;
  color?: string;
}

interface VisualLayoutEditorProps {
  htmlContent: string;
  onChange: (newHtml: string) => void;
  onClose: () => void;
}

const CM_TO_PX = 37.7952755906;

const DraggableItem = ({
  item,
  zoom,
  isSelected,
  onUpdate,
  onSelect,
  snapToGrid,
}: {
  item: EditableElement;
  zoom: number;
  isSelected: boolean;
  onUpdate: (id: string, updates: Partial<EditableElement>) => void;
  onSelect: (id: string) => void;
  snapToGrid: boolean;
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0, left: 0, top: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect(item.tempId);
    setIsDragging(true);
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
        width: `${item.width}px`,
        height: item.type === "image" ? `${item.height}px` : "auto",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        onMouseDown={handleMouseDown}
        className={`relative cursor-move transition-all
          ${
            isSelected
              ? "border-2 border-blue-600 bg-blue-50/20 shadow-xl ring-2 ring-blue-400/50"
              : "border border-blue-400/40 bg-white/5 hover:bg-white/40 shadow-sm"
          }`}
        style={{
          fontSize: item.fontSize ? `${item.fontSize}px` : undefined,
          fontWeight: item.bold ? "bold" : "normal",
          textDecoration: item.textDecoration,
          textAlign: item.textAlign as any,
          color: item.color,
          fontFamily: "Arial, sans-serif",
          minHeight: "14px",
          boxSizing: "border-box",
        }}
      >
        <div className="absolute top-0 right-0 bg-blue-600 text-white text-[7px] px-1 font-bold z-20 opacity-0 group-hover:opacity-100 pointer-events-none uppercase">
          {item.tagName}
        </div>

        {item.type === "image" ? (
          <img
            src={item.src}
            alt="element"
            className="w-full h-full object-contain pointer-events-none"
            style={{ display: "block" }}
          />
        ) : (
          <div
            dangerouslySetInnerHTML={{ __html: item.originalText || "" }}
            className="w-full h-full pointer-events-none"
          />
        )}
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [backgroundHtml, setBackgroundHtml] = useState<string>("");
  const [canvasSize, setCanvasSize] = useState({ width: 794, height: 1123 });
  const [zoom, setZoom] = useState(0.5);
  const [showGrid, setShowGrid] = useState(true);
  const hiddenRenderRef = useRef<HTMLDivElement>(null);

  const selectedElement = elements.find((el) => el.tempId === selectedId);

  useEffect(() => {
    if (!hiddenRenderRef.current) return;

    hiddenRenderRef.current.innerHTML = htmlContent;

    // Detectamos el contenedor que envuelve las páginas
    const pageContainer =
      hiddenRenderRef.current.querySelector("#visual-form-container") ||
      hiddenRenderRef.current.firstElementChild ||
      hiddenRenderRef.current;

    const timer = setTimeout(() => {
      const pageRect = (pageContainer as HTMLElement).getBoundingClientRect();

      // Actualizamos el tamaño del canvas del editor para que coincida con el original
      setCanvasSize({ width: pageRect.width, height: pageRect.height });

      const allCandidates = Array.from(
        pageContainer.querySelectorAll(
          "div, img, code, h1, h2, h3, p, table, section, article",
        ),
      );
      const extracted: EditableElement[] = [];

      allCandidates.forEach((el, idx) => {
        if (!(el instanceof HTMLElement)) return;
        if (el === pageContainer) return;

        const tagName = el.tagName.toUpperCase();
        const rect = el.getBoundingClientRect();
        const isAbsolute = el.style.position === "absolute";

        if (rect.width < 2 || rect.height < 2) return;

        const hasDirectText = Array.from(el.childNodes).some(
          (node) =>
            node.nodeType === Node.TEXT_NODE &&
            node.textContent?.trim().length! > 0,
        );

        const hasFormatText = Array.from(
          el.querySelectorAll("em, strong, b, u, span, i"),
        ).some((child) => (child as HTMLElement).innerText?.trim().length > 0);

        const isIndependentTag = ["CODE", "IMG"].includes(tagName);

        const isTarget =
          isIndependentTag ||
          isAbsolute ||
          hasDirectText ||
          (hasFormatText && !isIndependentTag);

        if (isTarget) {
          const tempId = `v-target-${idx}`;
          el.setAttribute("data-layout-id", tempId);

          const style = window.getComputedStyle(el);
          extracted.push({
            tempId,
            type: tagName === "IMG" ? "image" : "text",
            tagName,
            variable:
              tagName === "IMG"
                ? "Imagen"
                : el.innerText.match(/{{.*?}}/)?.[0] ||
                  el.innerText.substring(0, 15).trim() + "...",
            originalText: tagName === "IMG" ? undefined : el.innerHTML,
            src: tagName === "IMG" ? (el as HTMLImageElement).src : undefined,
            top: isAbsolute
              ? parseFloat(el.style.top) || 0
              : (rect.top - pageRect.top) / CM_TO_PX,
            left: isAbsolute
              ? parseFloat(el.style.left) || 0
              : (rect.left - pageRect.left) / CM_TO_PX,
            fontSize: parseInt(style.fontSize) || 14,
            bold:
              style.fontWeight === "700" ||
              style.fontWeight === "bold" ||
              ["H1", "H2", "B", "STRONG"].includes(tagName),
            width: rect.width,
            height: rect.height,
            textDecoration: style.textDecoration,
            textAlign: style.textAlign,
            color: style.color,
          });
        }
      });

      // Crear fondo ocultando piezas movibles
      const cleanClone = (pageContainer as HTMLElement).cloneNode(
        true,
      ) as HTMLElement;
      const hideStyle = document.createElement("style");
      hideStyle.innerHTML = `[data-layout-id] { visibility: hidden !important; }`;
      cleanClone.appendChild(hideStyle);

      setBackgroundHtml(cleanClone.outerHTML);
      setElements(extracted);
    }, 500);

    return () => clearTimeout(timer);
  }, [htmlContent]);

  const updateElement = (id: string, updates: Partial<EditableElement>) => {
    setElements((prev) =>
      prev.map((e) => (e.tempId === id ? { ...e, ...updates } : e)),
    );
  };

  const handleSave = () => {
    const root = hiddenRenderRef.current!;
    elements.forEach((el) => {
      const target = root.querySelector(
        `[data-layout-id="${el.tempId}"]`,
      ) as HTMLElement;
      if (target) {
        target.style.position = "absolute";
        target.style.top = `${el.top.toFixed(2)}cm`;
        target.style.left = `${el.left.toFixed(2)}cm`;
        target.style.width = `${el.width.toFixed(2)}px`;
        if (el.type === "text") {
          target.style.fontSize = `${el.fontSize}px`;
          target.style.fontWeight = el.bold ? "bold" : "normal";
          target.style.height = "auto";
        } else {
          target.style.height = `${el.height.toFixed(2)}px`;
        }
        target.style.margin = "0";
        target.removeAttribute("data-layout-id");
      }
    });
    root
      .querySelectorAll("[data-layout-id]")
      .forEach((node) => node.removeAttribute("data-layout-id"));
    onChange(root.innerHTML);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-slate-950/98 flex flex-col backdrop-blur-2xl"
      onClick={(e) => e.target === e.currentTarget && setSelectedId(null)}
    >
      <div
        ref={hiddenRenderRef}
        className="fixed opacity-0 pointer-events-none invisible"
        style={{ width: "21cm" }}
      />

      {/* HEADER TOOLS */}
      <div
        className="h-16 bg-white border-b flex items-center justify-between px-6 shadow-2xl z-50"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 text-slate-500 rounded-full transition-all"
            >
              <X size={20} />
            </button>
            <div className="flex flex-col">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-blue-600 leading-none mb-1 text-left">
                Motor Valeska V10.3
              </h2>
              <span className="text-sm font-bold text-slate-800 leading-none">
                Diseñador Multi-Página
              </span>
            </div>
          </div>
          <div className="h-8 w-px bg-slate-200"></div>
          {selectedElement ? (
            <div className="flex items-center gap-2 bg-indigo-50 p-1.5 rounded-xl border border-indigo-100 animate-in slide-in-from-left-2 shadow-inner">
              <div className="flex items-center gap-2 px-3 border-r border-indigo-200">
                {selectedElement.type === "image" ? (
                  <ImageIcon size={14} className="text-indigo-500" />
                ) : (
                  <Layers size={14} className="text-indigo-500" />
                )}
                <span className="text-xs font-bold text-indigo-900 truncate max-w-[200px]">
                  {selectedElement.variable}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() =>
                    updateElement(selectedId!, {
                      fontSize: (selectedElement.fontSize || 14) - 1,
                    })
                  }
                  className="p-1.5 hover:bg-white rounded-lg text-slate-600 transition-colors"
                >
                  <Minus size={14} />
                </button>
                <span className="text-xs font-mono font-bold w-10 text-center bg-white rounded border border-indigo-200 py-1">
                  {selectedElement.fontSize}
                </span>
                <button
                  onClick={() =>
                    updateElement(selectedId!, {
                      fontSize: (selectedElement.fontSize || 14) + 1,
                    })
                  }
                  className="p-1.5 hover:bg-white rounded-lg text-slate-600 transition-colors"
                >
                  <Plus size={14} />
                </button>
              </div>
              <button
                onClick={() =>
                  updateElement(selectedId!, { bold: !selectedElement.bold })
                }
                className={`p-2 rounded-lg transition-all ${selectedElement.bold ? "bg-indigo-600 text-white shadow-md" : "text-slate-500 hover:bg-white"}`}
              >
                <Bold size={16} />
              </button>
            </div>
          ) : (
            <div className="text-xs text-slate-400 italic">
              Mueve elementos libremente a través de todas las páginas
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${showGrid ? "bg-white text-indigo-600 shadow-sm border border-slate-200" : "text-slate-500"}`}
            >
              <Grid3X3 size={14} /> REJILLA
            </button>
            <div className="h-4 w-px bg-slate-200"></div>
            <div className="flex items-center gap-1 px-2">
              <button
                onClick={() => setZoom((z) => Math.max(0.2, z - 0.1))}
                className="p-1 text-slate-500 hover:text-indigo-600 transition-colors"
              >
                <Minus size={14} />
              </button>
              <span className="text-[10px] font-mono font-bold w-10 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom((z) => Math.min(1.5, z + 0.1))}
                className="p-1 text-slate-500 hover:text-indigo-600 transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
          <button
            onClick={handleSave}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl text-xs font-black shadow-lg shadow-emerald-200/50 transition-all flex items-center gap-2 active:scale-95"
          >
            <Save size={16} /> GUARDAR CAMBIOS
          </button>
        </div>
      </div>

      {/* CANVAS AREA */}
      <div className="flex-1 overflow-auto bg-slate-900/50 flex justify-center items-start p-12 custom-scrollbar">
        <div
          className="relative origin-top transition-transform duration-200"
          style={{
            width: `${canvasSize.width}px`,
            height: `${canvasSize.height}px`,
            transform: `scale(${zoom})`,
          }}
          onClick={(e) => e.target === e.currentTarget && setSelectedId(null)}
        >
          {/* FONDO LIMPIO (Todas las páginas) */}
          <div
            className="absolute inset-0 pointer-events-none select-none overflow-hidden"
            dangerouslySetInnerHTML={{ __html: backgroundHtml }}
          />

          {/* REJILLA */}
          {showGrid && (
            <div
              className="absolute inset-0 pointer-events-none z-0"
              style={{
                backgroundImage:
                  "linear-gradient(to right, rgba(99, 102, 241, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(99, 102, 241, 0.1) 1px, transparent 1px)",
                backgroundSize: "0.5cm 0.5cm",
              }}
            />
          )}

          {/* CAPAS ACTIVAS */}
          {elements.map((el) => (
            <DraggableItem
              key={el.tempId}
              item={el}
              zoom={zoom}
              isSelected={selectedId === el.tempId}
              snapToGrid={showGrid}
              onSelect={setSelectedId}
              onUpdate={updateElement}
            />
          ))}
        </div>
      </div>

      <div className="h-10 bg-slate-950 border-t border-slate-800 flex items-center px-6 text-[10px] text-slate-500 font-mono uppercase tracking-[0.2em] justify-between">
        <div className="flex gap-6 items-center">
          <span className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-md shadow-blue-500/50"></div>{" "}
            CAPAS: {elements.length}
          </span>
          {selectedId && (
            <span className="text-indigo-400 font-bold animate-pulse">
              POS: {selectedElement?.left.toFixed(1)}cm x{" "}
              {selectedElement?.top.toFixed(1)}cm
            </span>
          )}
        </div>
        <span>A4 MULTI-PAGE ENGINE v10.3</span>
      </div>
    </div>
  );
}
