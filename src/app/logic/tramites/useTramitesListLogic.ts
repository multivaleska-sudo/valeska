import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import Database from "@tauri-apps/plugin-sql";
import { save, confirm } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import * as XLSX from "xlsx";
import { sileo } from "sileo";
import { softDeleteTramiteLocally } from "./deleteTramiteLocal";

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
  creador: string;
  motor: string;
  chasis_vin: string;
  timestamp: number;
}

export function useTramitesListLogic() {
  const [rawData, setRawData] = useState<TramiteRow[]>([]);
  const [opcionesSituacion, setOpcionesSituacion] = useState<string[]>([]);
  const [opcionesEmpresas, setOpcionesEmpresas] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const [searchCliente, setSearchCliente] = useState("");
  const [searchTitulo, setSearchTitulo] = useState("");
  const [searchDNI, setSearchDNI] = useState("");
  const [searchPlaca, setSearchPlaca] = useState("");
  const [searchBusquedaRapida, setSearchBusquedaRapida] = useState("");
  const [searchMotor, setSearchMotor] = useState("");
  const [searchChasis, setSearchChasis] = useState("");
  const [searchVin, setSearchVin] = useState("");
  const [filterSituacion, setFilterSituacion] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  const [filterEmpresa, setFilterEmpresa] = useState("");
  const [inputEmpresa, setInputEmpresa] = useState("");
  const [showEmpresaResults, setShowEmpresaResults] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
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
                    v.motor AS motor,
                    v.chasis_vin AS chasis_vin,
                    ctt.nombre AS tramite,
                    cs.nombre AS situacion,
                    t.fecha_presentacion,
                    eg.razon_social AS empresa_gestiona,
                    u.nombre_completo AS creador,
                    t.updated_at,
                    t.created_at
                FROM tramites t
                JOIN clientes c ON t.cliente_id = c.id
                LEFT JOIN vehiculos v ON t.vehiculo_id = v.id
                JOIN catalogo_tipos_tramite ctt ON t.tipo_tramite_id = ctt.id
                JOIN catalogo_situaciones cs ON t.situacion_id = cs.id
                LEFT JOIN tramite_detalles td ON t.id = td.tramite_id
                LEFT JOIN empresas_gestoras eg ON td.empresa_gestora_id = eg.id
                LEFT JOIN usuarios u ON t.usuario_creador_id = u.id
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
        creador: row.creador || "Desconocido",
        motor: row.motor || "",
        chasis_vin: row.chasis_vin || "",
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

  const deleteTramite = async (id: string) => {
    // Usamos el diálogo Nativo de Tauri que SI bloquea la ejecución usando 'await'
    const isConfirmed = await confirm(
      "¿Estás seguro de eliminar este trámite de forma permanente? Esta acción no se puede deshacer.",
      { title: "Confirmar Eliminación", kind: "warning" },
    );

    if (!isConfirmed) return;

    try {
      const db = await Database.load("sqlite:valeska.db");
      await softDeleteTramiteLocally(db, id);

      sileo.success({
        title: "Trámite Eliminado",
        description: "El expediente ha sido borrado del sistema exitosamente.",
      });
      window.dispatchEvent(new Event("valeska_request_sync"));
      fetchTramites();
    } catch (error: any) {
      console.error("Error eliminando trámite", error);
      sileo.error({ title: "Error al eliminar", description: error.message });
    }
  };

  const empresasSugeridas = useMemo(() => {
    if (!inputEmpresa.trim()) return opcionesEmpresas;
    return opcionesEmpresas.filter((e) =>
      e.toLowerCase().includes(inputEmpresa.toLowerCase()),
    );
  }, [opcionesEmpresas, inputEmpresa]);

  const filteredTramites = useMemo(() => {
    return rawData.filter((tramite) => {
      // Búsqueda Rápida (evalúa múltiples campos)
      let matchRapida = true;
      if (searchBusquedaRapida) {
        const rapidaLower = searchBusquedaRapida.toLowerCase();
        matchRapida = 
          tramite.cliente.toLowerCase().includes(rapidaLower) ||
          tramite.n_titulo.toLowerCase().includes(rapidaLower) ||
          tramite.dni.toLowerCase().includes(rapidaLower) ||
          tramite.placa.toLowerCase().includes(rapidaLower) ||
          tramite.motor.toLowerCase().includes(rapidaLower) ||
          tramite.chasis_vin.toLowerCase().includes(rapidaLower);
      }

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
      const matchMotor = tramite.motor
        .toLowerCase()
        .includes(searchMotor.toLowerCase());
      const matchChasis = tramite.chasis_vin
        .toLowerCase()
        .includes(searchChasis.toLowerCase());
      const matchVin = tramite.chasis_vin
        .toLowerCase()
        .includes(searchVin.toLowerCase());
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
        matchRapida &&
        matchCliente &&
        matchTitulo &&
        matchDNI &&
        matchPlaca &&
        matchMotor &&
        matchChasis &&
        matchVin &&
        matchSituacion &&
        matchEmpresa &&
        matchFecha
      );
    });
  }, [
    rawData,
    searchBusquedaRapida,
    searchCliente,
    searchTitulo,
    searchDNI,
    searchPlaca,
    searchMotor,
    searchChasis,
    searchVin,
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
    setIsExporting(true);
    // Pequeña pausa para permitir que React renderice el Overlay antes de bloquear el hilo principal
    await new Promise((resolve) => setTimeout(resolve, 100));
    try {
      const db = await Database.load("sqlite:valeska.db");
      const tables: any[] = await db.select(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
      );

      const wb = XLSX.utils.book_new();

      // --- 1. HOJA PRINCIPAL: REPORTE GENERAL CON 36 COLUMNAS ---
      // AGENTE: Se implementa la consulta SQL requerida cruzando todas las tablas relacionadas para poblar las 36 columnas exactas de la Plantilla, omitiendo los filtros de la interfaz y extrayendo todos los trámites no eliminados.
      const queryEspecial = `
        SELECT 
          t.n_titulo, t.tramite_anio, c.razon_social_nombres, c.telefono, c.numero_documento,
          eg.razon_social as empresa_gestora, tt.nombre as tramite, cs.nombre as situacion,
          t.observaciones_generales, t.fecha_presentacion, t.fecha_tarjeta_en_oficina, t.fecha_placa_en_oficina,
          v.marca, v.chasis_vin, v.color, v.modelo, v.motor, v.anio_modelo, v.placa, v.carroceria,
          p.nombres as p_nombres, p.primer_apellido as p_apellido1, p.segundo_apellido as p_apellido2,
          td.tipo_boleta, td.fecha_boleta, td.dua, td.num_formato_inmatriculacion, td.numero_boleta,
          t.codigo_verificacion, td.clausula_monto, td.clausula_forma_pago, td.clausula_pago_bancarizado,
          td.aclaracion_dice, td.aclaracion_debe_decir, u.username as creador
        FROM tramites t
        LEFT JOIN tramite_detalles td ON t.id = td.tramite_id
        LEFT JOIN clientes c ON t.cliente_id = c.id
        LEFT JOIN vehiculos v ON t.vehiculo_id = v.id
        LEFT JOIN empresas_gestoras eg ON td.empresa_gestora_id = eg.id
        LEFT JOIN catalogo_tipos_tramite tt ON t.tipo_tramite_id = tt.id
        LEFT JOIN catalogo_situaciones cs ON t.situacion_id = cs.id
        LEFT JOIN usuarios u ON t.usuario_creador_id = u.id
        LEFT JOIN presentantes p ON td.presentante_id = p.id
        WHERE t.deleted_at IS NULL
        ORDER BY t.created_at DESC
      `;
      const tramitesEspeciales: any[] = await db.select(queryEspecial);

      // AGENTE: Configuro la estructura exacta en Array de Arrays (AOA) para garantizar el orden de columnas y asegurar que las posiciones N y V sean en blanco.
      const headers = [
        "N°", "N° TÍTULO", "Año", "CLIENTE", "Teléfono", "DNI / RUC", "EMPRESA", "TRÁMITE", "SITUACIÓN", "Observaciones", 
        "FECHA", "Tarjeta en Oficina", "Placa en Oficina", " ", "Marca", "Chasis / VIN", "Color", "Modelo", "Motor", 
        "Año Vehículo", "PLACA", "  ", "Presentante Físico (Trabajador / Tramitador Asignado)", "Tipo de Boleta", 
        "Fecha Boleta", "DUA", "N° Formato Inmatriculación", "Número Boleta", "Código Verificación", "Monto Total", 
        "Forma de Pago", "Pago Bancarizado Según", "Dice", "Debe Decir", "Carrocería", "CREADOR"
      ];

      const dataAOA = [headers];
      tramitesEspeciales.forEach((r, index) => {
        const row = [
          index + 1, // A: N°
          r.n_titulo || "", // B: N° TÍTULO
          r.tramite_anio || "", // C: Año
          r.razon_social_nombres || "", // D: CLIENTE
          r.telefono || "", // E: Teléfono
          r.numero_documento || "", // F: DNI / RUC
          r.empresa_gestora || "", // G: EMPRESA
          r.tramite || "", // H: TRÁMITE
          r.situacion || "", // I: SITUACIÓN
          r.observaciones_generales || "", // J: Observaciones
          r.fecha_presentacion || "", // K: FECHA
          r.fecha_tarjeta_en_oficina || "", // L: Tarjeta en Oficina
          r.fecha_placa_en_oficina || "", // M: Placa en Oficina
          "", // N: (COLUMNA EN BLANCO INTENCIONAL)
          r.marca || "", // O: Marca
          r.chasis_vin || "", // P: Chasis / VIN
          r.color || "", // Q: Color
          r.modelo || "", // R: Modelo
          r.motor || "", // S: Motor
          r.anio_modelo || "", // T: Año Vehículo
          r.placa || "", // U: PLACA
          "", // V: (COLUMNA EN BLANCO INTENCIONAL)
          `${r.p_nombres || ""} ${r.p_apellido1 || ""} ${r.p_apellido2 || ""}`.trim(), // W: Presentante Físico
          r.tipo_boleta || "", // X: Tipo de Boleta
          r.fecha_boleta || "", // Y: Fecha Boleta
          r.dua || "", // Z: DUA
          r.num_formato_inmatriculacion || "", // AA: N° Formato Inmatriculacion
          r.numero_boleta || "", // AB: Numero Boleta
          r.codigo_verificacion || "", // AC: Codigo Verificacion
          r.clausula_monto || "", // AD: Monto Total
          r.clausula_forma_pago || "", // AE: Forma de Pago
          r.clausula_pago_bancarizado || "", // AF: Pago Bancarizado
          r.aclaracion_dice || "", // AG: Dice
          r.aclaracion_debe_decir || "", // AH: Debe Decir
          r.carroceria || "", // AI: Carrocería
          r.creador || "" // AJ: CREADOR
        ];
        dataAOA.push(row);
      });

      const wsEspecial = XLSX.utils.aoa_to_sheet(dataAOA);
      XLSX.utils.book_append_sheet(wb, wsEspecial, "Reporte_General");

      // --- 2. DEMÁS HOJAS: VOLCADO MASIVO DE TODAS LAS TABLAS COMO BACKUP ---
      // AGENTE: Se itera sobre todas las tablas de sqlite_master como se planeó.
      for (const t of tables) {
        const tableName = t.name;
        const records: any[] = await db.select(`SELECT * FROM ${tableName}`);
        
        // Si la tabla no tiene registros, añadimos un arreglo vacío con una columna por defecto
        const dataToExport = records.length > 0 ? records : [{ Info: "Sin registros" }];
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        
        // El nombre de la hoja en Excel no puede exceder los 31 caracteres
        const sheetName = tableName.substring(0, 31);
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      }

      const path = await save({
        defaultPath: `Base_Datos_Valeska_${new Date().toISOString().split("T")[0]}.xlsx`,
        filters: [{ name: "Excel", extensions: ["xlsx"] }],
      });

      if (path) {
        const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        await writeFile(path, new Uint8Array(excelBuffer));
        sileo.success({ title: "Éxito", description: "Base de datos exportada correctamente." });
      }
    } catch (e: any) {
      console.error("Error exportando BD completa:", e);
      sileo.error({ title: "Error", description: "No se pudo exportar la base de datos." });
    } finally {
      setIsExporting(false);
    }
  };

  return {
    filtros: {
      searchBusquedaRapida,
      setSearchBusquedaRapida,
      searchMotor,
      setSearchMotor,
      searchChasis,
      setSearchChasis,
      searchVin,
      setSearchVin,
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
    deleteTramite,
  };
}
