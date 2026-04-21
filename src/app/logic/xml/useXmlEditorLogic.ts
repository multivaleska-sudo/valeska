import { useState, useEffect, useRef, useMemo } from "react";
import { open, save } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { parseXMLToInvoiceData } from "./xmlParser";
import { sileo } from "sileo";

export function useXmlEditorLogic() {
  const [filePath, setFilePath] = useState<string | null>(null);
  const [xmlContent, setXmlContent] = useState<string>("");
  const [invoiceData, setInvoiceData] = useState<any>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResult, setSearchResult] = useState<{
    indices: number[];
    current: number;
  }>({ indices: [], current: -1 });
  const isNavigating = useRef(false);

  // Motor para modificar TODOS los campos UBL de forma global y segura
  const handleGlobalFieldChange = (field: string, newValue: string, index: number = -1) => {
    if (!xmlContent) return;

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, "text/xml");

    // Helper para buscar etiquetas ignorando namespaces complejos
    const getNS = (parent: Element | Document | null, localName: string): Element | null => {
      if (!parent) return null;
      const elements = parent.getElementsByTagNameNS("*", localName);
      return elements.length > 0 ? elements[0] : null;
    };

    try {
      if (index === -1) {
        // Campos de Cabecera
        if (field === "emisor_razon") {
          const el = getNS(getNS(getNS(xmlDoc, "AccountingSupplierParty"), "PartyLegalEntity"), "RegistrationName");
          if (el) el.textContent = newValue;
        } else if (field === "emisor_ruc") {
          const el = getNS(getNS(getNS(xmlDoc, "AccountingSupplierParty"), "PartyIdentification"), "ID");
          if (el) el.textContent = newValue;
        } else if (field === "emisor_direccion") {
          const pa = getNS(getNS(xmlDoc, "AccountingSupplierParty"), "PostalAddress");
          const el = getNS(pa, "StreetName") || getNS(pa, "Line");
          if (el) el.textContent = newValue;
        } else if (field === "receptor_razon") {
          const el = getNS(getNS(getNS(xmlDoc, "AccountingCustomerParty"), "PartyLegalEntity"), "RegistrationName");
          if (el) el.textContent = newValue;
        } else if (field === "receptor_ruc") {
          const el = getNS(getNS(getNS(xmlDoc, "AccountingCustomerParty"), "PartyIdentification"), "ID");
          if (el) el.textContent = newValue;
        } else if (field === "receptor_direccion") {
          const pa = getNS(getNS(xmlDoc, "AccountingCustomerParty"), "PostalAddress");
          const el = getNS(pa, "StreetName") || getNS(pa, "Line");
          if (el) el.textContent = newValue;
        } else if (field === "fecha_emision") {
          const el = getNS(xmlDoc, "IssueDate");
          if (el) el.textContent = newValue;
        } else if (field === "moneda") {
          const el = getNS(xmlDoc, "DocumentCurrencyCode");
          if (el) el.textContent = newValue;
        } else if (field === "documento_id") {
          const el = getNS(xmlDoc, "ID");
          if (el) el.textContent = newValue;
        } else if (field === "importe_total") {
          const el = getNS(getNS(xmlDoc, "LegalMonetaryTotal"), "PayableAmount");
          if (el) el.textContent = newValue;
        }
      } else {
        // Campos de Detalles (Items)
        const lines = Array.from(xmlDoc.getElementsByTagNameNS("*", "InvoiceLine"));
        if (lines[index]) {
          const line = lines[index];
          if (field === "descripcion") {
            const el = getNS(getNS(line, "Item"), "Description");
            if (el) el.textContent = newValue;
          } else if (field === "codigo") {
            const el = getNS(getNS(getNS(line, "Item"), "SellersItemIdentification"), "ID");
            if (el) el.textContent = newValue;
          } else if (field === "unidad") {
            const el = getNS(line, "InvoicedQuantity");
            if (el) el.setAttribute("unitCode", newValue);
          } else if (field === "cantidad") {
            const el = getNS(line, "InvoicedQuantity");
            if (el) el.textContent = newValue;
          } else if (field === "precio_total") {
            const el = getNS(line, "LineExtensionAmount");
            if (el) el.textContent = newValue;
          }
        }
      }
    } catch (err) {
      console.warn("Hubo un problema actualizando el nodo en el DOM", err);
    }

    const serializer = new XMLSerializer();
    const updatedXml = serializer.serializeToString(xmlDoc);

    setXmlContent(updatedXml);
    setHasChanges(true);
    setSaveSuccess(false);
  };

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

  const highlightedHtml = useMemo(() => {
    if (!xmlContent) return "";

    const escapeHtml = (str: string) => {
      return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    };

    if (!searchTerm || searchResult.indices.length === 0) {
      let escaped = escapeHtml(xmlContent);
      if (escaped.endsWith("\n")) escaped += "<br/>";
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
      const markClass = isCurrent
        ? "active-mark rounded-sm bg-yellow-400 text-black shadow-[0_0_8px_rgba(250,204,21,0.9)]"
        : "rounded-sm bg-yellow-600/50 text-yellow-200";

      html += `<mark class="${markClass}">${escapedMatch}</mark>`;
      lastIdx = idx + searchTerm.length;
    });

    const after = xmlContent.substring(lastIdx);
    html += escapeHtml(after);
    if (html.endsWith("\n")) html += "<br/>";
    return html;
  }, [xmlContent, searchTerm, searchResult]);

  useEffect(() => {
    if (
      searchResult.current !== -1 &&
      textareaRef.current &&
      backdropRef.current
    ) {
      const pos = searchResult.indices[searchResult.current];
      const textarea = textareaRef.current;
      textarea.setSelectionRange(pos, pos + searchTerm.length);

      setTimeout(() => {
        if (!backdropRef.current || !textareaRef.current) return;
        const activeMark = backdropRef.current.querySelector(
          ".active-mark",
        ) as HTMLElement;
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

  const handleTextareaScroll = () => {
    if (textareaRef.current && backdropRef.current) {
      backdropRef.current.scrollTop = textareaRef.current.scrollTop;
      backdropRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const handleNextMatch = () => {
    isNavigating.current = true;
    setSearchResult((prev) => {
      if (prev.indices.length === 0) return prev;
      return { ...prev, current: (prev.current + 1) % prev.indices.length };
    });
  };

  const handlePrevMatch = () => {
    isNavigating.current = true;
    setSearchResult((prev) => {
      if (prev.indices.length === 0) return prev;
      return {
        ...prev,
        current: (prev.current - 1 + prev.indices.length) % prev.indices.length,
      };
    });
  };

  // Re-procesar todo el XML ante cualquier cambio para reflejar modificaciones globales
  useEffect(() => {
    if (!xmlContent || !invoiceData) return;
    try {
      const updatedData = parseXMLToInvoiceData(xmlContent);
      // Reemplazamos la data completa en lugar de solo los items
      setInvoiceData(updatedData);
    } catch (e) { }
  }, [xmlContent]);

  const handleOpenFile = async () => {
    if (isLoading) return;
    setError(null);
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: "Documentos XML", extensions: ["xml"] }],
      });

      if (!selected || typeof selected !== "string") return;

      setIsLoading(true);
      const rawText = await readTextFile(selected);
      const normalizedText = rawText.replace(/\r\n/g, "\n");

      const mappedData = parseXMLToInvoiceData(normalizedText);

      if (!mappedData.documento_id || mappedData.documento_id === "---") {
        throw new Error("El archivo no contiene un identificador válido UBL.");
      }

      setFilePath(selected);
      setInvoiceData(mappedData);
      setXmlContent(normalizedText);
      setHasChanges(false);
      setSaveSuccess(false);
      setSearchTerm("");

      sileo.success({
        title: "Archivo Abierto",
        description: "XML cargado y parseado correctamente.",
      });
    } catch (err: any) {
      const msg =
        typeof err === "string"
          ? err
          : err.message || "Error al procesar el archivo XML";
      setError(msg);
      setInvoiceData(null);
      sileo.error({ title: "Error al abrir", description: msg });
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
          defaultPath: "documento_modificado.xml",
        });
      }

      if (pathToSave) {
        await writeTextFile(pathToSave, xmlContent);
        setFilePath(pathToSave);
        setHasChanges(false);
        setSaveSuccess(true);

        sileo.success({
          title: "Guardado Exitoso",
          description: "El archivo XML se ha guardado correctamente.",
        });
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err: any) {
      const msg = "No se pudo guardar el archivo. Verifique permisos.";
      setError(msg);
      sileo.error({ title: "Error al guardar", description: msg });
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
    filePath,
    xmlContent,
    setXmlContent,
    invoiceData,
    isLoading,
    isSaving,
    hasChanges,
    setHasChanges,
    saveSuccess,
    setSaveSuccess,
    error,
    textareaRef,
    backdropRef,
    highlightedHtml,
    handleTextareaScroll,
    searchTerm,
    setSearchTerm,
    searchResult,
    handleNextMatch,
    handlePrevMatch,
    handleOpenFile,
    handleSaveFile,
    handleReset,
    handleGlobalFieldChange,
  };
}