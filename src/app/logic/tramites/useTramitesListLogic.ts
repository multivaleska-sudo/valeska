import { useState, useMemo, useEffect, useCallback } from "react";
import Database from "@tauri-apps/plugin-sql";
import { sileo } from "sileo";

export interface TramiteRow {
  id: string;
  n_titulo: string;
  cliente: string;
  dni: string;
  placa: string; // <-- AÑADIDO
  tramite: string;
  situacion: string;
  fecha_presentacion: string;
  empresa_gestiona: string;
}

export function useTramitesListLogic() {
  const [rawData, setRawData] = useState<TramiteRow[]>([]);
  const [opcionesSituacion, setOpcionesSituacion] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchCliente, setSearchCliente] = useState("");
  const [searchTitulo, setSearchTitulo] = useState("");
  const [searchDNI, setSearchDNI] = useState("");
  const [searchPlaca, setSearchPlaca] = useState(""); // <-- AÑADIDO
  const [filterSituacion, setFilterSituacion] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchCatalogos = useCallback(async () => {
    try {
      const sqlite = await Database.load("sqlite:valeska.db");
      const resSits: any[] = await sqlite.select(
        "SELECT nombre FROM catalogo_situaciones WHERE activo = 1 ORDER BY nombre ASC",
      );
      setOpcionesSituacion(resSits.map((s) => s.nombre));
    } catch (error) {
      console.error("Error al cargar catálogos para filtros:", error);
      sileo.error({
        title: "Error de Filtros",
        description: "No se pudieron cargar los catálogos para los filtros.",
      });
    }
  }, []);

  const fetchTramites = useCallback(async () => {
    setIsLoading(true);
    try {
      const sqlite = await Database.load("sqlite:valeska.db");

      // <-- CONSULTA SQL ACTUALIZADA PARA TRAER LA PLACA
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
                    eg.razon_social AS empresa_gestiona
                FROM tramites t
                JOIN clientes c ON t.cliente_id = c.id
                LEFT JOIN vehiculos v ON t.vehiculo_id = v.id
                JOIN catalogo_tipos_tramite ctt ON t.tipo_tramite_id = ctt.id
                JOIN catalogo_situaciones cs ON t.situacion_id = cs.id
                LEFT JOIN tramite_detalles td ON t.id = td.tramite_id
                LEFT JOIN empresas_gestoras eg ON td.empresa_gestora_id = eg.id
                WHERE t.deleted_at IS NULL
                ORDER BY t.created_at DESC
            `;

      const result: any[] = await sqlite.select(query);

      const formattedData: TramiteRow[] = result.map((row) => ({
        id: row.id,
        n_titulo: row.n_titulo || "SIN TÍTULO",
        cliente: row.cliente || "DESCONOCIDO",
        dni: row.dni || "",
        placa: row.placa || "---", // <-- AÑADIDO
        tramite: row.tramite || "",
        situacion: row.situacion || "",
        fecha_presentacion: row.fecha_presentacion || "",
        empresa_gestiona: row.empresa_gestiona || "--",
      }));

      setRawData(formattedData);
    } catch (error) {
      console.error("Error al cargar trámites desde SQLite:", error);
      sileo.error({
        title: "Error",
        description: "Ocurrió un error al cargar la lista de trámites.",
      });
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
        .includes(searchPlaca.toLowerCase()); // <-- AÑADIDO
      const matchSituacion = filterSituacion
        ? tramite.situacion === filterSituacion
        : true;

      let matchFecha = true;
      if (fechaInicio) {
        matchFecha = matchFecha && tramite.fecha_presentacion >= fechaInicio;
      }
      if (fechaFin) {
        matchFecha = matchFecha && tramite.fecha_presentacion <= fechaFin;
      }

      return (
        matchCliente &&
        matchTitulo &&
        matchDNI &&
        matchPlaca && // <-- AÑADIDO
        matchSituacion &&
        matchFecha
      );
    });
  }, [
    rawData,
    searchCliente,
    searchTitulo,
    searchDNI,
    searchPlaca, // <-- AÑADIDO
    filterSituacion,
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
    searchPlaca, // <-- AÑADIDO
    filterSituacion,
    fechaInicio,
    fechaFin,
  ]);

  return {
    filtros: {
      searchCliente,
      setSearchCliente,
      searchTitulo,
      setSearchTitulo,
      searchDNI,
      setSearchDNI,
      searchPlaca, // <-- AÑADIDO
      setSearchPlaca, // <-- AÑADIDO
      filterSituacion,
      setFilterSituacion,
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
    opcionesSituacion,
  };
}
