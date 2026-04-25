import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import Database from "@tauri-apps/plugin-sql";
import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import * as XLSX from "xlsx";
import { sileo } from "sileo";

export interface TramiteRow {
  id: string;
  n_titulo: string;
  cliente: string;
  dni: string;
  placa: string;
  tramite: string;
  situacion: string;
  fecha_presentacion: string;
  empresa_gestiona: string;
  timestamp: number;
}

export function useTramitesListLogic() {
  const [rawData, setRawData] = useState<TramiteRow[]>([]);
  const [opcionesSituacion, setOpcionesSituacion] = useState<string[]>([]);
  const [opcionesEmpresas, setOpcionesEmpresas] = useState<string[]>([]); // Para el filtro
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const [searchCliente, setSearchCliente] = useState("");
  const [searchTitulo, setSearchTitulo] = useState("");
  const [searchDNI, setSearchDNI] = useState("");
  const [searchPlaca, setSearchPlaca] = useState("");
  const [filterSituacion, setFilterSituacion] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  const [filterEmpresa, setFilterEmpresa] = useState("");
  const [inputEmpresa, setInputEmpresa] = useState("");
  const [showEmpresaResults, setShowEmpresaResults] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null); // Referencia para cerrar el dropdown al hacer clic fuera

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowEmpresaResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchCatalogos = useCallback(async () => {
    try {
      const sqlite = await Database.load("sqlite:valeska.db");

      const resSits: any[] = await sqlite.select(
        "SELECT nombre FROM catalogo_situaciones WHERE activo = 1 ORDER BY nombre ASC",
      );
      setOpcionesSituacion(resSits.map((s) => s.nombre));

      const resEmps: any[] = await sqlite.select(
        "SELECT razon_social FROM empresas_gestoras WHERE deleted_at IS NULL ORDER BY razon_social ASC",
      );
      setOpcionesEmpresas(resEmps.map((e) => e.razon_social));
    } catch (error) {
      console.error("Error al cargar catálogos:", error);
    }
  }, []);

  const fetchTramites = useCallback(async () => {
    setIsLoading(true);
    try {
      const sqlite = await Database.load("sqlite:valeska.db");
      const query = `
                SELECT 
                    t.id,
                    t.n_titulo,
                    c.razon_social_nombres AS cliente,
                    c.numero_documento AS dni,
                    v.placa AS placa,
                    ctt.nombre AS tramite,
                    cs.nombre AS situacion,
                    t.fecha_presentacion,
                    eg.razon_social AS empresa_gestiona,
                    t.updated_at,
                    t.created_at
                FROM tramites t
                JOIN clientes c ON t.cliente_id = c.id
                LEFT JOIN vehiculos v ON t.vehiculo_id = v.id
                JOIN catalogo_tipos_tramite ctt ON t.tipo_tramite_id = ctt.id
                JOIN catalogo_situaciones cs ON t.situacion_id = cs.id
                LEFT JOIN tramite_detalles td ON t.id = td.tramite_id
                LEFT JOIN empresas_gestoras eg ON td.empresa_gestora_id = eg.id
                WHERE t.deleted_at IS NULL
                ORDER BY t.updated_at DESC
            `;
      const result: any[] = await sqlite.select(query);

      const formattedData: TramiteRow[] = result.map((row) => ({
        id: row.id,
        n_titulo: row.n_titulo || "SIN TÍTULO",
        cliente: row.cliente || "DESCONOCIDO",
        dni: row.dni || "",
        placa: row.placa || "---",
        tramite: row.tramite || "",
        situacion: row.situacion || "",
        fecha_presentacion: row.fecha_presentacion || "",
        empresa_gestiona: row.empresa_gestiona || "--",
        timestamp: row.updated_at || row.created_at || 0,
      }));

      formattedData.sort((a, b) => b.timestamp - a.timestamp);

      setRawData(formattedData);
    } catch (error) {
      console.error("Error al cargar trámites:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCatalogos();
    fetchTramites();
    window.addEventListener("valeska_reload_tramites", fetchTramites);
    return () =>
      window.removeEventListener("valeska_reload_tramites", fetchTramites);
  }, [fetchTramites, fetchCatalogos]);

  // Lógica de Autocomplete para empresas
  const empresasSugeridas = useMemo(() => {
    if (!inputEmpresa.trim()) return opcionesEmpresas;
    return opcionesEmpresas.filter((e) =>
      e.toLowerCase().includes(inputEmpresa.toLowerCase()),
    );
  }, [opcionesEmpresas, inputEmpresa]);

  const filteredTramites = useMemo(() => {
    return rawData.filter((tramite) => {
      const matchCliente = tramite.cliente
        .toLowerCase()
        .includes(searchCliente.toLowerCase());
      const matchTitulo = tramite.n_titulo
        .toLowerCase()
        .includes(searchTitulo.toLowerCase());
      const matchDNI = tramite.dni.includes(searchDNI);
      const matchPlaca = tramite.placa
        .toLowerCase()
        .includes(searchPlaca.toLowerCase());
      const matchSituacion = filterSituacion
        ? tramite.situacion === filterSituacion
        : true;
      const matchEmpresa = filterEmpresa
        ? tramite.empresa_gestiona === filterEmpresa
        : true;

      let matchFecha = true;
      if (fechaInicio)
        matchFecha = matchFecha && tramite.fecha_presentacion >= fechaInicio;
      if (fechaFin)
        matchFecha = matchFecha && tramite.fecha_presentacion <= fechaFin;

      return (
        matchCliente &&
        matchTitulo &&
        matchDNI &&
        matchPlaca &&
        matchSituacion &&
        matchEmpresa &&
        matchFecha
      );
    });
  }, [
    rawData,
    searchCliente,
    searchTitulo,
    searchDNI,
    searchPlaca,
    filterSituacion,
    filterEmpresa,
    fechaInicio,
    fechaFin,
  ]);

  const totalPages = Math.ceil(filteredTramites.length / itemsPerPage);
  const paginatedTramites = filteredTramites.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchCliente,
    searchTitulo,
    searchDNI,
    searchPlaca,
    filterSituacion,
    filterEmpresa,
    fechaInicio,
    fechaFin,
  ]);

  const handleExportExcel = async () => {
    if (filteredTramites.length === 0) return;
    setIsExporting(true);
    try {
      const dataToExport = filteredTramites.map((t, idx) => ({
        "N°": idx + 1,
        "N° TÍTULO": t.n_titulo,
        CLIENTE: t.cliente,
        "DNI / RUC": t.dni,
        PLACA: t.placa,
        TRAMITE: t.tramite,
        SITUACIÓN: t.situacion,
        FECHA: t.fecha_presentacion,
        EMPRESA: t.empresa_gestiona,
      }));
      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Reporte");
      const path = await save({
        defaultPath: `Reporte_Valeska_${new Date().toISOString().split("T")[0]}.xlsx`,
        filters: [{ name: "Excel", extensions: ["xlsx"] }],
      });
      if (path) {
        const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        await writeFile(path, new Uint8Array(excelBuffer));
        sileo.success({ title: "Éxito", description: "Excel guardado." });
      }
    } catch (e) {
      sileo.error({ title: "Error", description: "No se pudo exportar." });
    } finally {
      setIsExporting(false);
    }
  };

  return {
    filtros: {
      searchCliente,
      setSearchCliente,
      searchTitulo,
      setSearchTitulo,
      searchDNI,
      setSearchDNI,
      searchPlaca,
      setSearchPlaca,
      filterSituacion,
      setFilterSituacion,
      filterEmpresa,
      setFilterEmpresa,
      inputEmpresa,
      setInputEmpresa,
      showEmpresaResults,
      setShowEmpresaResults,
      empresasSugeridas,
      dropdownRef,
      fechaInicio,
      setFechaInicio,
      fechaFin,
      setFechaFin,
    },
    paginacion: {
      currentPage,
      setCurrentPage,
      totalPages,
      itemsPerPage,
      totalItems: filteredTramites.length,
    },
    data: paginatedTramites,
    isLoading,
    isExporting,
    opcionesSituacion,
    handleExportExcel,
  };
}