import { describe, expect, it } from "vitest";
import { markRecordsAsSynced } from "./syncUtils";

describe("markRecordsAsSynced", () => {
  it("normalizes version and base_version for accepted versioned records", async () => {
    const calls: Array<{ query: string; params?: unknown[] }> = [];
    const sqlite = {
      async execute(query: string, params?: unknown[]) {
        calls.push({ query, params });
      },
    };

    await markRecordsAsSynced(sqlite, "tramites", ["tramite-1"]);

    expect(calls[0].query).toContain("version");
    expect(calls[0].query).toContain("base_version");
    expect(calls[0].query).toContain("LOCAL_INSERT");
    expect(calls[0].query).toContain("sync_status = 'SYNCED'");
  });

  it("keeps simple sync status updates for non-versioned records", async () => {
    const calls: Array<{ query: string; params?: unknown[] }> = [];
    const sqlite = {
      async execute(query: string, params?: unknown[]) {
        calls.push({ query, params });
      },
    };

    await markRecordsAsSynced(sqlite, "message_templates", ["template-1"]);

    expect(calls[0].query).toBe("UPDATE message_templates SET sync_status = 'SYNCED' WHERE id IN ('template-1')");
  });
});
