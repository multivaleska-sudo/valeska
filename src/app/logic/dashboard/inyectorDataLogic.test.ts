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
  it("omits rows without chasis/VIN and motor", async () => {
    const file = makeExcelFile([
      {
        Cliente: "Cliente Demo",
        DNI: "12345678",
        Tramite: "Transferencia",
        Estado: "Pendiente",
      },
    ]);

    const result = await validarExcel(file, {} as any, emptyCache());

    expect(result.validos).toHaveLength(0);
    expect(result.errores.sinIdentificadorVehiculo).toEqual([2]);
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
});
