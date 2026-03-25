import React from "react";
import { FileText, Search, ChevronUp, ChevronDown } from "lucide-react";

interface XmlCodeEditorProps {
  xmlContent: string;
  setXmlContent: (val: string) => void;
  setHasChanges: (val: boolean) => void;
  setSaveSuccess: (val: boolean) => void;
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  searchResult: { indices: number[]; current: number };
  handleNextMatch: () => void;
  handlePrevMatch: () => void;
  highlightedHtml: string;
  textareaRef: React.Ref<HTMLTextAreaElement>;
  backdropRef: React.Ref<HTMLDivElement>;
  handleTextareaScroll: () => void;
}

export function XmlCodeEditor({
  xmlContent,
  setXmlContent,
  setHasChanges,
  setSaveSuccess,
  searchTerm,
  setSearchTerm,
  searchResult,
  handleNextMatch,
  handlePrevMatch,
  highlightedHtml,
  textareaRef,
  backdropRef,
  handleTextareaScroll,
}: XmlCodeEditorProps) {
  return (
    <div className="h-full w-full flex flex-col bg-[#0d1117] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl relative">
      <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center justify-between shrink-0">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <FileText size={14} className="text-blue-400" /> Código Fuente XML
        </span>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              type="text"
              placeholder="Buscar en XML..."
              className="bg-slate-800 border-none text-[12px] rounded-md pl-9 pr-3 py-1.5 text-slate-200 w-64 focus:ring-1 focus:ring-blue-500 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleNextMatch();
                }
              }}
            />
          </div>
          {searchTerm && searchResult.indices.length > 0 && (
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevMatch}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded"
              >
                <ChevronUp size={14} />
              </button>
              <button
                onClick={handleNextMatch}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded"
              >
                <ChevronDown size={14} />
              </button>
              <span className="text-[11px] text-slate-500 font-mono ml-1">
                {searchResult.current + 1}/{searchResult.indices.length}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden group">
        <div
          ref={backdropRef}
          className="absolute inset-0 p-6 font-mono text-[14px] leading-relaxed text-[#569CD6] pointer-events-none whitespace-pre-wrap break-words overflow-y-auto overflow-x-hidden"
          style={{ tabSize: 4 }}
          dangerouslySetInnerHTML={{ __html: highlightedHtml }}
        />
        <textarea
          ref={textareaRef}
          value={xmlContent}
          onScroll={handleTextareaScroll}
          onChange={(e) => {
            setXmlContent(e.target.value.replace(/\r\n/g, "\n"));
            setHasChanges(true);
            setSaveSuccess(false);
          }}
          className="absolute inset-0 w-full h-full bg-transparent p-6 font-mono text-[14px] leading-relaxed text-transparent caret-white outline-none resize-none z-10 whitespace-pre-wrap break-words overflow-y-auto overflow-x-hidden custom-scrollbar-dark selection:bg-blue-500/30"
          style={{ tabSize: 4 }}
          spellCheck={false}
        />
      </div>
    </div>
  );
}
