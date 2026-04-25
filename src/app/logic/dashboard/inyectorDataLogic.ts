import * as XLSX from "xlsx";
import Database from "@tauri-apps/plugin-sql";

// =============================
// TIPOS E INTERFACES
// =============================
export interface RegistroExcel {
  filaId: number;
  clienteNombre: string;
  dni: string;
  telefono: string | null;

  empresaNombre: string | null;
  presentanteNombre: string | null;

  chasis: string | null;
  placa: string | null;
  motor: string | null;
  marca: string | null;
  modelo: string | null;
  color: string | null;
  anioVehiculo: string | null;

  tipoTramiteNombre: string;
  situacionNombre: string;

  tramiteAnio: string;
  fechaPresentacion: string;
  nTitulo: string | null;
  observacionesGenerales: string | null;
  fechaEntregaTarjeta: string | null;
  fechaEntregaPlaca: string | null;
  codigoVerificacion: string | null;

  tipoBoleta: string | null;
  numeroBoleta: string | null;
  fechaBoleta: string | null;
  dua: string | null;
  numFormatoInmatriculacion: string | null;

  clausulaMonto: number | null;
  clausulaFormaPago: string | null;
  clausulaPagoBancarizado: string | null;
  aclaracionDice: string | null;
  aclaracionDebeDecir: string | null;
}

export interface ResultadoImportacion {
  exitosos: number;
  errores: {
    duplicadosChasis: number[];
    duplicadosMotor: number[];
    duplicadosBDChasis: number[];
    duplicadosBDMotor: number[];
    otros: number[];
  };
}

// =============================
// PARSERS Y NORMALIZADORES ROBUSTOS
// =============================

const normalizeKey = (key: string) => {
  return key
    .toLowerCase()
    .replace(/nº|n°|nro/g, "n") // Limpieza agresiva de simbolos de número
    .replace(/º|°/g, "o")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Elimina tildes
    .replace(/[^a-z0-9]/g, ""); // Borra guiones, espacios, etc.
};

// BÚSQUEDA MULTI-ALIAS
const getVal = (row: any, ...keysToFind: string[]) => {
  const normalizedKeys = keysToFind.map(normalizeKey);
  const foundKey = Object.keys(row).find((k) =>
    normalizedKeys.includes(normalizeKey(k)),
  );
  return foundKey ? row[foundKey] : null;
};

const parseText = (v: any): string | null => {
  if (v === null || v === undefined) return null;
  const val = v.toString().trim();
  return val === "" ? null : val;
};

// PARSER DE FECHA: DEVUELVE YYYY-MM-DD PARA QUE REACT NO SE ROMPA
const parseFecha = (v: any): string | null => {
  if (!v) return null;
  let str = v.toString().trim();

  // 1. Número serial de Excel (ej: 45312)
  if (!isNaN(Number(str)) && Number(str) > 10000) {
    const date = new Date((Number(str) - (25567 + 2)) * 86400 * 1000);
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
  }

  // 2. Extraer todos los dígitos (ej. 058/09/2026, 2026-03-20, 4/09/2026)
  const parts = str.match(/\d+/g);
  if (!parts || parts.length < 3) return null;

  let d = parts[0];
  let m = parts[1];
  let y = parts[2];

  // Si el año viene primero (ej. 2026-01-02), los invertimos
  if (d.length === 4) {
    y = parts[0];
    m = parts[1];
    d = parts[2];
  }

  if (y.length === 2) y = "20" + y; // Asume los 2000s si viene "26"

  // Limpieza de absurdos (Ej: 058 de día -> se convierte a 05)
  let dayNum = parseInt(d, 10);
  let monthNum = parseInt(m, 10);

  if (dayNum > 31) dayNum = parseInt(d.substring(0, 2), 10); // Corta el exceso si era 058
  if (dayNum > 31 || dayNum === 0) dayNum = 1;

  if (monthNum > 12) monthNum = parseInt(m.substring(0, 2), 10);
  if (monthNum > 12 || monthNum === 0) monthNum = 1;

  // Retorna ISO format para compatibilidad directa con HTML5 Date Inputs
  return `${y}-${monthNum.toString().padStart(2, "0")}-${dayNum.toString().padStart(2, "0")}`;
};

// PARSER DE AÑO ESTRICTO
const parseYear = (v: any): string | null => {
  if (!v) return null;
  const str = v.toString();
  // Extrae estrictamente los 4 números que representan el año, ignorando texto basura o letras
  const match = str.match(/\b(19|20)\d{2}\b/);
  return match ? match[0] : null;
};

const parseNumber = (v: any): number | null => {
  if (typeof v === "string") {
    v = v.replace(/[^0-9.-]+/g, "");
  }
  const n = Number(v);
  return isNaN(n) ? null : n;
};

const safeParams = (params: any[]) =>
  params.map((p) => (p === undefined ? null : p));

// =============================
// CACHÉ DE BD
// =============================
const cargarCache = async (db: Database) => {
  const [clientes, vehiculos, tipos, situaciones, empresas, presentantes] =
    await Promise.all([
      db.select("SELECT id, numero_documento FROM clientes"),
      db.select("SELECT id, chasis_vin, motor FROM vehiculos"),
      db.select("SELECT id, nombre FROM catalogo_tipos_tramite"),
      db.select("SELECT id, nombre FROM catalogo_situaciones"),
      db.select("SELECT id, razon_social FROM empresas_gestoras"),
      db.select("SELECT id, nombres FROM presentantes"),
    ]);

  return {
    clientesMap: new Map(
      (clientes as any[]).map((c) => [c.numero_documento, c.id]),
    ),
    chasisMap: new Map((vehiculos as any[]).map((v) => [v.chasis_vin, v.id])),
    motorMap: new Map(
      (vehiculos as any[]).filter((v) => v.motor).map((v) => [v.motor, v.id]),
    ),
    tipoMap: new Map((tipos as any[]).map((t) => [t.nombre, t.id])),
    situacionMap: new Map((situaciones as any[]).map((s) => [s.nombre, s.id])),
    empresasMap: new Map(
      (empresas as any[]).map((e) => [e.razon_social, e.id]),
    ),
    presentantesMap: new Map(
      (presentantes as any[]).map((p) => [p.nombres, p.id]),
    ),
  };
};

// =============================
// OBTENER CONTEXTO (SESIÓN AUTÉNTICA)
// =============================
const buildImportContext = async (db: Database) => {
  const sessionStr =
    localStorage.getItem("valeska_session_user") ||
    localStorage.getItem("auth_storage");
  if (!sessionStr) throw new Error("Sesión no encontrada.");

  let userId = null;
  try {
    const authData = JSON.parse(sessionStr);
    userId = authData.id || authData.state?.user?.id || authData.user?.id;
  } catch (e) {
    throw new Error("Formato de sesión inválido");
  }

  if (!userId) throw new Error("ID de usuario no encontrado en la sesión");

  const result = await db.select<any[]>(
    `SELECT d.sucursal_id FROM usuarios u INNER JOIN dispositivos d ON u.dispositivo_id = d.id WHERE u.id = $1 LIMIT 1`,
    [userId],
  );

  if (!result || result.length === 0)
    throw new Error("El usuario actual no tiene una sucursal asignada.");

  return { usuarioId: userId, sucursalId: result[0].sucursal_id };
};

// =============================
// FASE 1: LECTURA Y VALIDACIÓN
// =============================
export const validarExcel = async (file: File, db: Database, cache: any) => {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];

  const rawRows = XLSX.utils.sheet_to_json<any>(sheet, {
    raw: false,
    defval: null,
  });

  const validos: RegistroExcel[] = [];
  const errores = {
    duplicadosChasis: [] as number[],
    duplicadosMotor: [] as number[],
    duplicadosBDChasis: [] as number[],
    duplicadosBDMotor: [] as number[],
    otros: [] as number[],
  };

  const chasisSet = new Set<string>();
  const motorSet = new Set<string>();
  let emptyCount = 0;

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];
    const filaId = i + 2;

    const tieneDatos = Object.values(row).some(
      (v) => v !== null && v !== undefined && v !== "",
    );
    if (!tieneDatos) {
      emptyCount++;
      if (emptyCount >= 5) break;
      continue;
    }
    emptyCount = 0;

    try {
      const clienteNombre = parseText(
        getVal(row, "cliente", "clientenombre", "nombrecliente", "razonsocial"),
      );
      const dni = parseText(
        getVal(row, "ndni", "dni", "nodni", "documento", "numerodni"),
      );

      // Empresa y presentante mejorados
      const empresaNombre = parseText(
        getVal(row, "empresa", "empresagestora", "concesionario"),
      );
      const presentanteNombre = parseText(
        getVal(row, "presentante", "nombrepresentante", "gestor"),
      );

      const chasis = parseText(getVal(row, "chasis", "chasisvin", "vin"));
      const motor = parseText(getVal(row, "motor", "nromotor"));

      const tipoTramiteNombre = parseText(
        getVal(row, "tramite", "tipotramite"),
      );
      const situacionNombre = parseText(getVal(row, "estado", "situacion"));

      let fechaPresentacion = parseFecha(
        getVal(row, "fpresentacion", "fechapresentacion"),
      );
      let tramiteAnio = parseYear(
        getVal(row, "ano", "año", "year", "tramiteanio"),
      );

      if (!fechaPresentacion) {
        const today = new Date();
        fechaPresentacion = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, "0")}-${today.getDate().toString().padStart(2, "0")}`;
      }
      if (!tramiteAnio) tramiteAnio = new Date().getFullYear().toString();

      // RECHAZO ABSOLUTO
      if (!clienteNombre || !dni || !tipoTramiteNombre || !situacionNombre) {
        console.warn(
          `🛑 [Fila ${filaId}] Rechazada por falta de DNI, Cliente, Trámite o Estado.`,
        );
        errores.otros.push(filaId);
        continue;
      }

      if (chasis) {
        if (chasisSet.has(chasis)) {
          errores.duplicadosChasis.push(filaId);
          continue;
        }
        if (cache.chasisMap.has(chasis)) {
          errores.duplicadosBDChasis.push(filaId);
          continue;
        }
        chasisSet.add(chasis);
      }

      if (motor) {
        if (motorSet.has(motor)) {
          errores.duplicadosMotor.push(filaId);
          continue;
        }
        if (cache.motorMap.has(motor)) {
          errores.duplicadosBDMotor.push(filaId);
          continue;
        }
        motorSet.add(motor);
      }

      validos.push({
        filaId,
        clienteNombre,
        dni,
        telefono: parseText(getVal(row, "telefono")),
        empresaNombre,
        presentanteNombre,
        chasis,
        // Agregado multiples alias para capturar bien la placa
        placa: parseText(getVal(row, "placa", "nroplaca", "numeroplaca")),
        motor,
        marca: parseText(getVal(row, "marca")),
        modelo: parseText(getVal(row, "modelo")),
        color: parseText(getVal(row, "color")),
        // Busca en MÚLTIPLES columnas por el año del vehículo
        anioVehiculo: parseYear(
          getVal(
            row,
            "año1",
            "ano1",
            "año_1",
            "ano_1",
            "año(vehiculo)",
            "anovehiculo",
          ),
        ),
        tipoTramiteNombre,
        situacionNombre,
        tramiteAnio,
        fechaPresentacion,
        // Abarca "Nº Titulo", "Titulo", etc.
        nTitulo: parseText(
          getVal(row, "ntitulo", "notitulo", "titulo", "numerotitulo"),
        ),
        observacionesGenerales: parseText(
          getVal(row, "obs", "observaciones", "observacion"),
        ),
        fechaEntregaTarjeta: parseFecha(
          getVal(row, "fenttarj", "fechaentregatarjeta", "entregatarjeta"),
        ),
        fechaEntregaPlaca: parseFecha(
          getVal(row, "fentplaca", "fechaentregaplaca", "entregaplaca"),
        ),
        codigoVerificacion: parseText(
          getVal(row, "codver", "codigoverificacion", "codigo"),
        ),
        tipoBoleta: parseText(getVal(row, "boleta", "tipoboleta")),
        numeroBoleta: parseText(
          getVal(row, "noboleta", "ndeboleta", "numeroboleta"),
        ),
        fechaBoleta: parseFecha(getVal(row, "fboleta", "fechaboleta")),
        dua: parseText(getVal(row, "dua")),
        numFormatoInmatriculacion: parseText(
          getVal(
            row,
            "forminmatriculacion",
            "formatoinmatriculacion",
            "formato",
          ),
        ),
        clausulaMonto: parseNumber(getVal(row, "montototal", "monto", "total")),
        clausulaFormaPago: parseText(getVal(row, "formadepago", "formapago")),
        clausulaPagoBancarizado: parseText(
          getVal(row, "pagobancarizadosegun", "pagobancarizado"),
        ),
        aclaracionDice: parseText(getVal(row, "dice", "aclaraciondice")),
        aclaracionDebeDecir: parseText(
          getVal(row, "deberiadecir", "aclaraciondebedecir"),
        ),
      });
    } catch (e) {
      errores.otros.push(filaId);
    }
  }

  return { validos, errores };
};

// =============================
// FUNCIÓN AUXILIAR: REINTENTOS PARA SQLITE
// =============================
const executeWithRetry = async (
  db: Database,
  query: string,
  params: any[],
  retries = 5,
) => {
  let lastError: any;
  for (let i = 0; i < retries; i++) {
    try {
      await db.execute(query, params);
      return;
    } catch (error: any) {
      lastError = error;
      if (
        error?.message?.includes("database is locked") ||
        error?.message?.includes("busy")
      ) {
        await new Promise((res) => setTimeout(res, 100 + Math.random() * 200));
      } else {
        throw error;
      }
    }
  }
  throw lastError;
};

// =============================
// FASE 2: INSERCIÓN ULTRA RÁPIDA
// =============================
export const insertarLotesUltra = async (
  db: Database,
  validos: RegistroExcel[],
  ctx: { usuarioId: string; sucursalId: string },
  cache: any,
  onProgress?: (p: number) => void,
) => {
  const chunkSize = 20; // Reducido para mayor estabilidad
  let exitosos = 0;

  for (let i = 0; i < validos.length; i += chunkSize) {
    const chunk = validos.slice(i, i + chunkSize);
    await new Promise((res) => setTimeout(res, 50));

    for (const r of chunk) {
      const now = Date.now();

      try {
        // Cliente
        let clienteId = cache.clientesMap.get(r.dni);
        if (!clienteId) {
          clienteId = crypto.randomUUID();
          await executeWithRetry(
            db,
            `INSERT INTO clientes (id, tipo_documento, numero_documento, razon_social_nombres, telefono, created_at, updated_at, sync_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            safeParams([
              clienteId,
              "DNI",
              r.dni,
              r.clienteNombre,
              r.telefono,
              now,
              now,
              "LOCAL_INSERT",
            ]),
          );
          cache.clientesMap.set(r.dni, clienteId);
        }

        // Empresa Gestora
        let empresaId = null;
        if (r.empresaNombre) {
          empresaId = cache.empresasMap.get(r.empresaNombre);
          if (!empresaId) {
            empresaId = crypto.randomUUID();
            await executeWithRetry(
              db,
              `INSERT INTO empresas_gestoras (id, ruc, razon_social, direccion, created_at, updated_at, sync_status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
              safeParams([
                empresaId,
                "S/N",
                r.empresaNombre,
                "S/N",
                now,
                now,
                "LOCAL_INSERT",
              ]),
            );
            cache.empresasMap.set(r.empresaNombre, empresaId);
          }
        }

        // Presentante - Usamos "?" en lugar de "$1" para asegurar la integridad posicional de los valores
        let presentanteId = null;
        if (r.presentanteNombre) {
          presentanteId = cache.presentantesMap.get(r.presentanteNombre);
          if (!presentanteId) {
            presentanteId = crypto.randomUUID();
            await executeWithRetry(
              db,
              `INSERT INTO presentantes (id, dni, nombres, primer_apellido, segundo_apellido, created_at, updated_at, sync_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              safeParams([
                presentanteId,
                "S/N",
                r.presentanteNombre,
                "S/N",
                "S/N",
                now,
                now,
                "LOCAL_INSERT",
              ]),
            );
            cache.presentantesMap.set(r.presentanteNombre, presentanteId);
          }
        }

        // Vehículo
        const vehiculoId = crypto.randomUUID();
        await executeWithRetry(
          db,
          `INSERT INTO vehiculos (id, chasis_vin, placa, motor, marca, modelo, color, carroceria, anio_modelo, anio_fabricacion, created_at, updated_at, sync_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          safeParams([
            vehiculoId,
            r.chasis || "SIN CHASIS",
            r.placa,
            r.motor,
            r.marca,
            r.modelo,
            r.color,
            null,
            r.anioVehiculo,
            r.anioVehiculo,
            now,
            now,
            "LOCAL_INSERT",
          ]),
        );

        // Catálogos
        let tipoId = cache.tipoMap.get(r.tipoTramiteNombre);
        if (!tipoId) {
          tipoId = crypto.randomUUID();
          await executeWithRetry(
            db,
            `INSERT INTO catalogo_tipos_tramite (id, nombre, activo, created_at, updated_at, sync_status) VALUES (?, ?, 1, ?, ?, ?)`,
            safeParams([tipoId, r.tipoTramiteNombre, now, now, "LOCAL_INSERT"]),
          );
          cache.tipoMap.set(r.tipoTramiteNombre, tipoId);
        }

        let situacionId = cache.situacionMap.get(r.situacionNombre);
        if (!situacionId) {
          situacionId = crypto.randomUUID();
          await executeWithRetry(
            db,
            `INSERT INTO catalogo_situaciones (id, nombre, color_hex, activo, created_at, updated_at, sync_status) VALUES (?, ?, '#CCCCCC', 1, ?, ?, ?)`,
            safeParams([
              situacionId,
              r.situacionNombre,
              now,
              now,
              "LOCAL_INSERT",
            ]),
          );
          cache.situacionMap.set(r.situacionNombre, situacionId);
        }

        // Trámite Principal
        const tramiteId = crypto.randomUUID();
        await executeWithRetry(
          db,
          `INSERT INTO tramites (id, tramite_anio, cliente_id, vehiculo_id, tipo_tramite_id, situacion_id, usuario_creador_id, sucursal_id, n_titulo, fecha_presentacion, observaciones_generales, codigo_verificacion, created_at, updated_at, sync_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          safeParams([
            tramiteId,
            r.tramiteAnio,
            clienteId,
            vehiculoId,
            tipoId,
            situacionId,
            ctx.usuarioId,
            ctx.sucursalId,
            r.nTitulo,
            r.fechaPresentacion,
            r.observacionesGenerales,
            r.codigoVerificacion,
            now,
            now,
            "LOCAL_INSERT",
          ]),
        );

        // Detalles del Trámite
        await executeWithRetry(
          db,
          `INSERT INTO tramite_detalles (id, tramite_id, empresa_gestora_id, presentante_id, tipo_boleta, numero_boleta, fecha_boleta, dua, num_formato_inmatriculacion, clausula_monto, clausula_forma_pago, clausula_pago_bancarizado, aclaracion_dice, aclaracion_debe_decir, created_at, updated_at, sync_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          safeParams([
            crypto.randomUUID(),
            tramiteId,
            empresaId,
            presentanteId,
            r.tipoBoleta,
            r.numeroBoleta,
            r.fechaBoleta,
            r.dua,
            r.numFormatoInmatriculacion,
            r.clausulaMonto,
            r.clausulaFormaPago,
            r.clausulaPagoBancarizado,
            r.aclaracionDice,
            r.aclaracionDebeDecir,
            now,
            now,
            "LOCAL_INSERT",
          ]),
        );

        exitosos++;
      } catch (err: any) {
        console.error(
          `🔥 Fila ${r.filaId} omitida por error en SQLite:`,
          err.message || err,
        );
      }
    }

    if (onProgress) {
      const chunkProgress = Math.round(
        ((i + chunk.length) / validos.length) * 50,
      );
      onProgress(50 + chunkProgress);
    }
  }

  return exitosos;
};

// =============================
// PIPELINE FINAL (Exportado a React)
// =============================
export const importarPipeline = async (
  file: File,
  onProgress?: (p: number) => void,
): Promise<ResultadoImportacion> => {
  if (onProgress) onProgress(5);
  const db = await Database.load("sqlite:valeska.db");

  try {
    await db.execute("PRAGMA journal_mode = WAL;", []);
    await db.execute("PRAGMA busy_timeout = 10000;", []); // Aumentado a 10s
    await db.execute("PRAGMA synchronous = NORMAL;", []);
  } catch (e) {
    console.warn("Aviso: No se pudieron configurar los PRAGMAs de SQLite", e);
  }

  if (onProgress) onProgress(10);
  const ctx = await buildImportContext(db);

  if (onProgress) onProgress(20);
  const cache = await cargarCache(db);

  if (onProgress) onProgress(30);
  const { validos, errores } = await validarExcel(file, db, cache);

  if (onProgress) onProgress(50);
  const exitosos = await insertarLotesUltra(
    db,
    validos,
    ctx,
    cache,
    onProgress,
  );

  if (onProgress) onProgress(100);

  return { exitosos, errores };
};
