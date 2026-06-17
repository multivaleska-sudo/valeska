import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  pullSyncEntity: vi.fn(),
  getStoredCursor: vi.fn(),
  saveStoredCursor: vi.fn(),
}));

vi.mock("../../services/syncService", () => ({
  SYNC_ENTITY_TO_LOCAL_KEY: {
    plantilla_documento: "plantillasDocumentos",
  },
  SYNC_PULL_ORDER: ["plantilla_documento"],
  getStoredCursor: mocks.getStoredCursor,
  pullSyncEntity: mocks.pullSyncEntity,
  saveStoredCursor: mocks.saveStoredCursor,
}));

import { executePull } from "./pullActions";

describe("executePull transaction handling", () => {
  it("does not use manual BEGIN/COMMIT statements when applying pull pages", async () => {
    vi.stubGlobal("localStorage", {
      setItem: vi.fn(),
    });

    const sqlite = {
      calls: [] as string[],
      async execute(query: string) {
        this.calls.push(query);
        if (/^(BEGIN|COMMIT|ROLLBACK)/i.test(query.trim())) {
          throw new Error("transaction command should not be used");
        }
      },
      async select() {
        return [];
      },
    };

    mocks.getStoredCursor.mockResolvedValue(null);
    mocks.pullSyncEntity.mockResolvedValue({
      records: [
        {
          id: "tpl-1",
          nombreDocumento: "Contrato",
          contenidoHtml: "<p>ok</p>",
          orientacionPapel: "PORTRAIT",
          activo: true,
          createdAt: 1,
          updatedAt: 1,
        },
      ],
      hasMore: false,
      timestamp: "2026-06-17T00:00:00.000Z",
    });

    await expect(executePull({ apiUrl: "http://localhost" }, "user-1", sqlite)).resolves.toMatchObject({
      success: true,
    });

    expect(sqlite.calls.some((query) => /^(BEGIN|COMMIT|ROLLBACK)/i.test(query.trim()))).toBe(false);
  });
});
