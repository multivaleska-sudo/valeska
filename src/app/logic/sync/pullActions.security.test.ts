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
    async select() {
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
