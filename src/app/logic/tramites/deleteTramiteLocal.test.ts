import { describe, expect, it } from "vitest";
import { softDeleteTramiteLocally } from "./deleteTramiteLocal";

describe("softDeleteTramiteLocally", () => {
  it("soft deletes only the tramite and its detalles", async () => {
    const calls: Array<{ query: string; params: unknown[] }> = [];
    const db = {
      async execute(query: string, params: unknown[] = []) {
        calls.push({ query, params });
      },
    };

    await softDeleteTramiteLocally(db, "tramite-1", 12345);

    expect(calls).toHaveLength(2);
    expect(calls[0].query).toContain("UPDATE tramites");
    expect(calls[0].query).toContain("deleted_at=$1");
    expect(calls[0].query).toContain("updated_at=$1");
    expect(calls[0].query).toContain("sync_status='LOCAL_UPDATE'");
    expect(calls[1].query).toContain("UPDATE tramite_detalles");
    expect(calls.some((call) => call.query.includes("UPDATE clientes"))).toBe(false);
    expect(calls.some((call) => call.query.includes("UPDATE vehiculos"))).toBe(false);
  });
});
