import { describe, expect, it } from "vitest";
import { buildConflictResolutionUpdate, isRemoteConflictPlaceholder } from "./useConflictosLogic";

describe("buildConflictResolutionUpdate", () => {
  it("can keep a local soft delete as a pending update over the remote version", () => {
    const update = buildConflictResolutionUpdate({
      tableName: "tramites",
      mode: "local",
      registroId: "tramite-1",
      localData: { id: "tramite-1", nTitulo: "Local", deleted_at: 12345, version: 2 },
      remoteData: { id: "tramite-1", nTitulo: "Nube", deleted_at: null, version: 3 },
      resolvedData: {},
      now: 99999,
    });

    expect(update.syncStatus).toBe("LOCAL_UPDATE");
    expect(update.baseVersion).toBe(3);
    expect(update.assignments).toEqual(expect.arrayContaining([
      { column: "deleted_at", value: 12345 },
    ]));
    expect(update.query).toContain("deleted_at");
  });

  it("marks remote resolution as synced with version and base_version equal to remote version", () => {
    const update = buildConflictResolutionUpdate({
      tableName: "tramites",
      mode: "remote",
      registroId: "tramite-1",
      localData: { id: "tramite-1", nTitulo: "Local", version: 2 },
      remoteData: { id: "tramite-1", nTitulo: "Nube", version: 4 },
      resolvedData: {},
      now: 99999,
    });

    expect(update.syncStatus).toBe("SYNCED");
    expect(update.version).toBe(4);
    expect(update.baseVersion).toBe(4);
  });

  it("detects placeholder remote conflict payloads that still need a pull", () => {
    expect(isRemoteConflictPlaceholder({ pendiente_pull_conflicto: true })).toBe(true);
    expect(isRemoteConflictPlaceholder({ id: "tramite-1", version: 3 })).toBe(false);
  });
});
