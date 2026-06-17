import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { insertarLotesUltra, validarExcel } from "./inyectorDataLogic";

function makeExcelFile(rows: Record<string, unknown>[]) {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
  const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
  return new File([buffer], "data.xlsx", {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

const emptyCache = () => ({
  clientesMap: new Map(),
  chasisMap: new Map(),
  motorMap: new Map(),
  tipoMap: new Map(),
  situacionMap: new Map(),
  empresasMap: new Map(),
  presentantesMap: new Map(),
});

describe("validarExcel", () => {
  it("imports rows without chasis/VIN and motor as vehicle warnings", async () => {
    const file = makeExcelFile([
      {
        Cliente: "Cliente Demo",
        DNI: "12345678",
        Tramite: "Transferencia",
        Estado: "Pendiente",
        placa: "X3H890",
      },
    ]);

    const result = await validarExcel(file, {} as any, emptyCache());

    expect(result.validos).toHaveLength(1);
    expect(result.validos[0]).toMatchObject({
      chasis: null,
      motor: null,
      placa: "X3H890",
    });
    expect(result.errores.sinIdentificadorVehiculo).toEqual([]);
    expect(result.advertencias.sinIdentificadorVehiculo).toEqual([2]);
  });

  it("repairs mojibake headers before matching aliases", async () => {
    const mojibakeTramite = Buffer.from("Trámite", "utf8").toString("latin1");
    const file = makeExcelFile([
      {
        Cliente: "Cliente Demo",
        DNI: "12345678",
        [mojibakeTramite]: "Transferencia",
        Estado: "Pendiente",
        Chasis: "VIN-1",
      },
    ]);

    const result = await validarExcel(file, {} as any, emptyCache());

    expect(result.validos).toHaveLength(1);
    expect(result.validos[0].tipoTramiteNombre).toBe("Transferencia");
  });

  it("does not skip duplicate chasis rows because they represent separate tramites", async () => {
    const file = makeExcelFile([
      {
        Cliente: "Cliente Uno",
        DNI: "12345678",
        Tramite: "Transferencia",
        Estado: "Pendiente",
        Chasis: "VIN-1",
      },
      {
        Cliente: "Cliente Dos",
        DNI: "87654321",
        Tramite: "Duplicado",
        Estado: "Pendiente",
        Chasis: "VIN-1",
      },
    ]);

    const result = await validarExcel(file, {} as any, emptyCache());

    expect(result.validos).toHaveLength(2);
    expect(result.errores.duplicadosChasis).toEqual([]);
    expect(result.advertencias.vehiculoReutilizado).toEqual([3]);
  });
});

describe("insertarLotesUltra", () => {
  it("rolls back the current row when tramite_detalle insert fails", async () => {
    const calls: string[] = [];
    const db = {
      async execute(query: string) {
        calls.push(query);
        if (query.includes("INSERT INTO tramite_detalles")) {
          throw new Error("detalle rechazado");
        }
      },
    };

    const result = await insertarLotesUltra(
      db as any,
      [
        {
          filaId: 2,
          clienteNombre: "Cliente Demo",
          dni: "12345678",
          telefono: null,
          empresaNombre: null,
          presentanteNombre: null,
          chasis: "VIN-1",
          placa: null,
          motor: null,
          marca: null,
          modelo: null,
          color: null,
          anioVehiculo: null,
          tipoTramiteNombre: "Transferencia",
          situacionNombre: "Pendiente",
          tramiteAnio: "2026",
          fechaPresentacion: "2026-06-16",
          nTitulo: null,
          observacionesGenerales: null,
          fechaEntregaTarjeta: null,
          fechaEntregaPlaca: null,
          codigoVerificacion: null,
          tipoBoleta: null,
          numeroBoleta: null,
          fechaBoleta: null,
          dua: null,
          numFormatoInmatriculacion: null,
          clausulaMonto: null,
          clausulaFormaPago: null,
          clausulaPagoBancarizado: null,
          aclaracionDice: null,
          aclaracionDebeDecir: null,
        },
      ],
      { usuarioId: "user-1", sucursalId: "sucursal-1" },
      emptyCache(),
    );

    expect(calls.some((query) => query.startsWith("SAVEPOINT import_row_"))).toBe(true);
    expect(calls.some((query) => query.startsWith("ROLLBACK TO import_row_"))).toBe(true);
    expect(result.exitosos).toBe(0);
    expect(result.erroresPorFila).toEqual([
      expect.objectContaining({ filaId: 2, entidad: "tramite_detalles" }),
    ]);
  });

  it("reuses an existing vehicle by chasis and still creates a new tramite", async () => {
    const calls: Array<{ query: string; params?: any[] }> = [];
    const cache = emptyCache();
    cache.chasisMap.set("VIN-1", "vehiculo-existente");
    const db = {
      async execute(query: string, params?: any[]) {
        calls.push({ query, params });
      },
    };

    const result = await insertarLotesUltra(
      db as any,
      [
        {
          filaId: 2,
          clienteNombre: "Cliente Demo",
          dni: "12345678",
          telefono: null,
          empresaNombre: null,
          presentanteNombre: null,
          chasis: "VIN-1",
          placa: null,
          motor: null,
          marca: null,
          modelo: null,
          color: null,
          anioVehiculo: null,
          tipoTramiteNombre: "Transferencia",
          situacionNombre: "Pendiente",
          tramiteAnio: "2026",
          fechaPresentacion: "2026-06-16",
          nTitulo: null,
          observacionesGenerales: null,
          fechaEntregaTarjeta: null,
          fechaEntregaPlaca: null,
          codigoVerificacion: null,
          tipoBoleta: null,
          numeroBoleta: null,
          fechaBoleta: null,
          dua: null,
          numFormatoInmatriculacion: null,
          clausulaMonto: null,
          clausulaFormaPago: null,
          clausulaPagoBancarizado: null,
          aclaracionDice: null,
          aclaracionDebeDecir: null,
        },
      ],
      { usuarioId: "user-1", sucursalId: "sucursal-1" },
      cache,
    );

    expect(result.exitosos).toBe(1);
    expect(calls.some(({ query }) => query.includes("INSERT INTO vehiculos"))).toBe(false);
    expect(
      calls.some(
        ({ query, params }) =>
          query.includes("INSERT INTO tramites") &&
          params?.includes("vehiculo-existente"),
      ),
    ).toBe(true);
  });

  it("retries transient locks while opening row savepoints", async () => {
    const calls: string[] = [];
    let savepointAttempts = 0;
    const db = {
      async execute(query: string) {
        calls.push(query);
        if (query.startsWith("SAVEPOINT")) {
          savepointAttempts += 1;
          if (savepointAttempts === 1) {
            throw new Error("database is locked");
          }
        }
      },
    };

    const result = await insertarLotesUltra(
      db as any,
      [
        {
          filaId: 2,
          clienteNombre: "Cliente Demo",
          dni: "12345678",
          telefono: null,
          empresaNombre: null,
          presentanteNombre: null,
          chasis: "VIN-1",
          placa: null,
          motor: null,
          marca: null,
          modelo: null,
          color: null,
          anioVehiculo: null,
          tipoTramiteNombre: "Transferencia",
          situacionNombre: "Pendiente",
          tramiteAnio: "2026",
          fechaPresentacion: "2026-06-16",
          nTitulo: null,
          observacionesGenerales: null,
          fechaEntregaTarjeta: null,
          fechaEntregaPlaca: null,
          codigoVerificacion: null,
          tipoBoleta: null,
          numeroBoleta: null,
          fechaBoleta: null,
          dua: null,
          numFormatoInmatriculacion: null,
          clausulaMonto: null,
          clausulaFormaPago: null,
          clausulaPagoBancarizado: null,
          aclaracionDice: null,
          aclaracionDebeDecir: null,
        },
      ],
      { usuarioId: "user-1", sucursalId: "sucursal-1" },
      emptyCache(),
    );

    expect(result.exitosos).toBe(1);
    expect(savepointAttempts).toBe(2);
    expect(calls.filter((query) => query.startsWith("SAVEPOINT"))).toHaveLength(2);
  });

  it("updates an existing tramite on reimport instead of creating a duplicate", async () => {
    const calls: Array<{ query: string; params?: any[] }> = [];
    const db = {
      async execute(query: string, params?: any[]) {
        calls.push({ query, params });
      },
      async select(query: string) {
        if (query.includes("FROM tramites t")) {
          return [
            {
              id: "tramite-existente",
              detalle_id: "detalle-existente",
              sync_status: "SYNCED",
              version: 4,
              base_version: 4,
            },
          ];
        }
        return [];
      },
    };

    const result = await insertarLotesUltra(
      db as any,
      [
        {
          filaId: 2,
          clienteNombre: "Cliente Demo",
          dni: "12345678",
          telefono: "999999999",
          empresaNombre: null,
          presentanteNombre: null,
          chasis: "VIN-1",
          placa: "ABC123",
          motor: "MOTOR-1",
          marca: "Marca",
          modelo: "Modelo",
          color: "Rojo",
          anioVehiculo: "2026",
          tipoTramiteNombre: "Transferencia",
          situacionNombre: "Pendiente",
          tramiteAnio: "2026",
          fechaPresentacion: "2026-06-16",
          nTitulo: "31233",
          observacionesGenerales: "Actualizado por Excel",
          fechaEntregaTarjeta: null,
          fechaEntregaPlaca: null,
          codigoVerificacion: "COD-1",
          tipoBoleta: null,
          numeroBoleta: null,
          fechaBoleta: null,
          dua: null,
          numFormatoInmatriculacion: null,
          clausulaMonto: null,
          clausulaFormaPago: null,
          clausulaPagoBancarizado: null,
          aclaracionDice: null,
          aclaracionDebeDecir: null,
        },
      ],
      { usuarioId: "user-1", sucursalId: "sucursal-1" },
      {
        ...emptyCache(),
        clientesMap: new Map([["12345678", "cliente-1"]]),
        chasisMap: new Map([["VIN-1", "vehiculo-1"]]),
        tipoMap: new Map([["Transferencia", "tipo-1"]]),
        situacionMap: new Map([["Pendiente", "situacion-1"]]),
      },
    );

    expect(result.exitosos).toBe(1);
    expect(calls.some(({ query }) => query.includes("INSERT INTO tramites"))).toBe(false);
    expect(calls.some(({ query }) => query.includes("UPDATE tramites SET"))).toBe(true);
    expect(calls.some(({ query }) => query.includes("UPDATE tramite_detalles SET"))).toBe(true);
  });
});
