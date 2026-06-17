import { describe, expect, it } from "vitest";
import { processPullSync } from "./pullActions";
import { resetSecurityPullCursors } from "../../services/syncService";

function createFakeSqlite() {
  const calls: Array<{ query: string; params: unknown[] }> = [];

  return {
    calls,
    async execute(query: string, params: unknown[] = []) {
      calls.push({ query, params });

      if (query.includes("INSERT INTO usuarios") && params[6] !== null) {
        throw new Error(`usuario.dispositivo_id must be deferred, got ${String(params[6])}`);
      }

      if (query.includes("INSERT INTO dispositivos") && params[6] !== null) {
        throw new Error(`dispositivo.usuario_id must be deferred, got ${String(params[6])}`);
      }
    },
    async select(query: string, params: unknown[] = []) {
      if (query.includes("WHERE id = $1 LIMIT 1") && !query.includes("FROM tramites WHERE id")) {
        return [{ id: params[0] }];
      }
      return [];
    },
  };
}

describe("processPullSync security relationships", () => {
  it("defers circular usuario/dispositivo foreign keys and repairs them after base rows exist", async () => {
    const sqlite = createFakeSqlite();

    await processPullSync(sqlite, {
      usuarios: [
        {
          id: "user-1",
          username: "admin",
          passwordHash: "hash",
          rol: "ADMIN_CENTRAL",
          nombreCompleto: "Administrador",
          dispositivoId: "device-1",
          estaActivo: true,
          createdAt: 1,
          updatedAt: 1,
        },
      ],
      dispositivos: [
        {
          id: "device-1",
          macAddress: "aa:bb:cc",
          nombreEquipo: "PC Admin",
          autorizado: true,
          sucursalId: "sucursal-1",
          usuarioId: "user-1",
          createdAt: 1,
          updatedAt: 1,
        },
      ],
    });

    expect(
      sqlite.calls.some(
        (call) =>
          call.query.includes("UPDATE usuarios") &&
          call.params[0] === "device-1" &&
          call.params[1] === "user-1",
      ),
    ).toBe(true);
    expect(
      sqlite.calls.some(
        (call) =>
          call.query.includes("UPDATE dispositivos") &&
          call.params[0] === "user-1" &&
          call.params[1] === "device-1",
      ),
    ).toBe(true);
  });

  it("reports the missing tramite dependency before applying the row", async () => {
    const sqlite = {
      async execute(query: string) {
        if (query.includes("INSERT INTO tramites")) {
          throw new Error("FOREIGN KEY constraint failed");
        }
      },
      async select(query: string, params: unknown[] = []) {
        if (query.includes("FROM tramites WHERE id")) return [];
        if (query.includes("FROM clientes WHERE id")) return [];
        if (query.includes("FROM vehiculos WHERE id")) return [{ id: params[0] }];
        if (query.includes("FROM catalogo_tipos_tramite WHERE id")) return [{ id: params[0] }];
        if (query.includes("FROM catalogo_situaciones WHERE id")) return [{ id: params[0] }];
        if (query.includes("FROM usuarios WHERE id")) return [{ id: params[0] }];
        if (query.includes("FROM sucursales WHERE id")) return [{ id: params[0] }];
        return [];
      },
    };

    await expect(
      processPullSync(sqlite, {
        tramites: [
          {
            id: "tramite-1",
            tramiteAnio: "2026",
            clienteId: "cliente-faltante",
            vehiculoId: "vehiculo-1",
            tipoTramiteId: "tipo-1",
            situacionId: "sit-1",
            usuarioCreadorId: "user-1",
            sucursalId: "sucursal-1",
            fechaPresentacion: "2026-06-16",
            createdAt: 1,
            updatedAt: 1,
          },
        ],
      }),
    ).rejects.toThrow("falta cliente_id cliente-faltante");
  });

  it("stores base_version equal to version for synced tramite records pulled from server", async () => {
    const sqlite = createFakeSqlite();

    await processPullSync(sqlite, {
      tramites: [
        {
          id: "tramite-1",
          codigoVerificacion: "ABC",
          tramiteAnio: "2026",
          clienteId: "cliente-1",
          vehiculoId: "vehiculo-1",
          tipoTramiteId: "tipo-1",
          situacionId: "sit-1",
          usuarioCreadorId: "user-1",
          sucursalId: "sucursal-1",
          version: 3,
          baseVersion: 2,
          createdAt: 1,
          updatedAt: 2,
        },
      ],
    });

    const tramiteInsert = sqlite.calls.find((call) =>
      call.query.includes("INSERT INTO tramites"),
    );

    expect(tramiteInsert?.params[27]).toBe(3);
    expect(tramiteInsert?.params[28]).toBe(3);
  });
});

describe("resetSecurityPullCursors", () => {
  it("removes only usuario and dispositivo pull cursors", async () => {
    const calls: Array<{ query: string; params: unknown[] }> = [];
    const sqlite = {
      async execute(query: string, params: unknown[] = []) {
        calls.push({ query, params });
      },
    };

    await resetSecurityPullCursors(sqlite);

    expect(calls).toEqual([
      {
        query: "DELETE FROM sync_cursors WHERE entity_name IN ($1, $2)",
        params: ["usuario", "dispositivo"],
      },
    ]);
  });
});
