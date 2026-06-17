import { describe, expect, it } from "vitest";
import { shouldDeferSyncForImport } from "./useSyncLogic";

describe("shouldDeferSyncForImport", () => {
  it("defers auto sync while an Excel import is writing locally", () => {
    expect(
      shouldDeferSyncForImport(
        { source: "auto", silent: true },
        { importInFlight: true },
      ),
    ).toBe(true);
  });

  it("does not defer the final Excel sync after the import lock is released", () => {
    expect(
      shouldDeferSyncForImport(
        { source: "excel-import", silent: false },
        { importInFlight: false },
      ),
    ).toBe(false);
  });
});
