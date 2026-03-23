import { useState, useEffect, useRef, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { mapXmlToInvoiceData } from "./xmlMapper";

export function useXmlEditorLogic() {
    const [filePath, setFilePath] = useState<string | null>(null);
    const [xmlContent, setXmlContent] = useState<string>("");
    const [invoiceData, setInvoiceData] = useState<any>(null);

    const [liveDescriptions, setLiveDescriptions] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // =========================================================================
    // 🔍 MAGIA DEL BUSCADOR: BACKDROP HIGHLIGHTING Y SCROLL EXACTO
    // =========================================================================
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const backdropRef = useRef<HTMLDivElement>(null);

    const [searchTerm, setSearchTerm] = useState("");
    const [searchResult, setSearchResult] = useState<{ indices: number[], current: number }>({ indices: [], current: -1 });
    const isNavigating = useRef(false);

    // 1. Encontrar posiciones exactas de las palabras
    useEffect(() => {
        if (!searchTerm || !xmlContent) {
            setSearchResult({ indices: [], current: -1 });
            return;
        }
        const lowerContent = xmlContent.toLowerCase();
        const lowerTerm = searchTerm.toLowerCase();
        const indices: number[] = [];
        let i = lowerContent.indexOf(lowerTerm);

        while (i !== -1) {
            indices.push(i);
            i = lowerContent.indexOf(lowerTerm, i + lowerTerm.length);
        }

        setSearchResult({ indices, current: indices.length > 0 ? 0 : -1 });
    }, [searchTerm, xmlContent]);

    // 2. Generador del HTML para la capa de fondo (Ilumina las palabras)
    const highlightedHtml = useMemo(() => {
        if (!xmlContent) return "";

        const escapeHtml = (str: string) => {
            return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        };

        if (!searchTerm || searchResult.indices.length === 0) {
            let escaped = escapeHtml(xmlContent);
            if (escaped.endsWith('\n')) escaped += '<br/>';
            return escaped;
        }

        let html = "";
        let lastIdx = 0;

        searchResult.indices.forEach((idx, i) => {
            const before = xmlContent.substring(lastIdx, idx);
            html += escapeHtml(before);

            const matchText = xmlContent.substring(idx, idx + searchTerm.length);
            const escapedMatch = escapeHtml(matchText);

            const isCurrent = i === searchResult.current;

            // CRÍTICO: Le agregamos "active-mark" a la palabra seleccionada actualmente para rastrearla
            const markClass = isCurrent
                ? "active-mark rounded-sm bg-yellow-400 text-black shadow-[0_0_8px_rgba(250,204,21,0.9)]"
                : "rounded-sm bg-yellow-600/50 text-yellow-200";

            html += `<mark class="${markClass}">${escapedMatch}</mark>`;
            lastIdx = idx + searchTerm.length;
        });

        const after = xmlContent.substring(lastIdx);
        html += escapeHtml(after);
        if (html.endsWith('\n')) html += '<br/>';

        return html;
    }, [xmlContent, searchTerm, searchResult]);

    // 3. Auto-Scroll Exacto rastreando el DOM en lugar de calcular matemáticamente
    useEffect(() => {
        if (searchResult.current !== -1 && textareaRef.current && backdropRef.current) {
            const pos = searchResult.indices[searchResult.current];
            const textarea = textareaRef.current;

            // NO robamos el foco permanentemente, solo marcamos la selección
            textarea.setSelectionRange(pos, pos + searchTerm.length);

            setTimeout(() => {
                if (!backdropRef.current || !textareaRef.current) return;

                const activeMark = backdropRef.current.querySelector('.active-mark') as HTMLElement;

                if (activeMark) {
                    const scrollPos = Math.max(0, activeMark.offsetTop - 120);

                    textareaRef.current.scrollTop = scrollPos;
                    backdropRef.current.scrollTop = scrollPos;
                }

                if (isNavigating.current) {
                    textarea.focus();
                    isNavigating.current = false;
                }
            }, 10);
        }
    }, [searchResult.current, searchTerm, highlightedHtml]);

    // 4. Sincronizador en tiempo real del scroll del mouse
    const handleTextareaScroll = () => {
        if (textareaRef.current && backdropRef.current) {
            backdropRef.current.scrollTop = textareaRef.current.scrollTop;
            backdropRef.current.scrollLeft = textareaRef.current.scrollLeft;
        }
    };

    const handleNextMatch = () => {
        isNavigating.current = true;
        setSearchResult(prev => {
            if (prev.indices.length === 0) return prev;
            return { ...prev, current: (prev.current + 1) % prev.indices.length };
        });
    };

    const handlePrevMatch = () => {
        isNavigating.current = true;
        setSearchResult(prev => {
            if (prev.indices.length === 0) return prev;
            return { ...prev, current: (prev.current - 1 + prev.indices.length) % prev.indices.length };
        });
    };

    // =========================================================================
    // PARSER EN TIEMPO REAL Y MÉTODOS DE ARCHIVO
    // =========================================================================
    useEffect(() => {
        if (!xmlContent || !invoiceData) return;
        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlContent, "text/xml");
            const invoiceLines = Array.from(xmlDoc.getElementsByTagName("*")).filter(el => el.localName === "InvoiceLine");

            const descriptions = invoiceLines.map(line => {
                const descNode = Array.from(line.getElementsByTagName("*")).find(el => el.localName === "Description");
                return descNode?.textContent || "Sin descripción";
            });

            setLiveDescriptions(descriptions);
        } catch (e) { }
    }, [xmlContent, invoiceData]);

    const handleOpenFile = async () => {
        if (isLoading) return;
        setError(null);
        try {
            const selected = await open({
                multiple: false,
                filters: [{ name: "Factura XML SUNAT", extensions: ["xml"] }],
            });

            if (!selected || typeof selected !== 'string') return;

            setIsLoading(true);
            const rawData: any = await invoke("extract_full_invoice_data", { path: selected });
            const mappedData = mapXmlToInvoiceData(rawData);

            if (!mappedData) throw new Error("Datos incompatibles o XML corrupto.");

            const rawText = await readTextFile(selected);
            // 🔥 CORRECCIÓN CRÍTICA: Normalizamos \r\n de Windows a \n puro de React
            const normalizedText = rawText.replace(/\r\n/g, '\n');

            setFilePath(selected);
            setInvoiceData(mappedData);
            setXmlContent(normalizedText);
            setHasChanges(false);
            setSaveSuccess(false);
            setSearchTerm("");
        } catch (err: any) {
            setError(typeof err === "string" ? err : err.message || "Error al procesar el archivo XML");
            setInvoiceData(null);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveFile = async () => {
        if (!xmlContent) return;
        setIsSaving(true);
        setError(null);

        try {
            let pathToSave = filePath;
            if (!pathToSave) {
                pathToSave = await save({
                    filters: [{ name: "Documentos XML", extensions: ["xml"] }],
                    defaultPath: "factura_modificada.xml",
                });
            }

            if (pathToSave) {
                await writeTextFile(pathToSave, xmlContent);
                setFilePath(pathToSave);
                setHasChanges(false);
                setSaveSuccess(true);
                setTimeout(() => setSaveSuccess(false), 3000);
            }
        } catch (err: any) {
            console.error("Error al guardar:", err);
            setError("No se pudo guardar el archivo. Verifique permisos.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleReset = () => {
        setFilePath(null);
        setXmlContent("");
        setInvoiceData(null);
        setHasChanges(false);
        setError(null);
        setSearchTerm("");
    };

    return {
        filePath, xmlContent, setXmlContent, invoiceData, liveDescriptions,
        isLoading, isSaving, hasChanges, setHasChanges, saveSuccess, setSaveSuccess, error,
        textareaRef, backdropRef, highlightedHtml, handleTextareaScroll,
        searchTerm, setSearchTerm, searchResult, handleNextMatch, handlePrevMatch,
        handleOpenFile, handleSaveFile, handleReset
    };
}