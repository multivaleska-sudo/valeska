import { describe, expect, it } from "vitest";
import {
  isLocalDbBusy,
  runExclusiveLocalDbOperation,
  waitForLocalDbIdle,
} from "./localDbOperationGate";

const defer = () => {
  let resolve!: () => void;
  const promise = new Promise<void>((res) => {
    resolve = res;
  });
  return { promise, resolve };
};

describe("localDbOperationGate", () => {
  it("serializes local SQLite operations", async () => {
    const firstRelease = defer();
    const events: string[] = [];

    const first = runExclusiveLocalDbOperation("sync", async () => {
      events.push("sync:start");
      expect(isLocalDbBusy()).toBe(true);
      await firstRelease.promise;
      events.push("sync:end");
      return "sync-result";
    });

    const second = runExclusiveLocalDbOperation("excel-import", async () => {
      events.push("import:start");
      events.push("import:end");
      return "import-result";
    });

    await Promise.resolve();
    expect(events).toEqual(["sync:start"]);
    firstRelease.resolve();

    await expect(first).resolves.toBe("sync-result");
    await expect(second).resolves.toBe("import-result");
    expect(events).toEqual(["sync:start", "sync:end", "import:start", "import:end"]);
    expect(isLocalDbBusy()).toBe(false);
  });

  it("waits until the active local operation finishes", async () => {
    const release = defer();
    const operation = runExclusiveLocalDbOperation("sync", async () => {
      await release.promise;
    });

    await Promise.resolve();
    const wait = waitForLocalDbIdle();
    let resolved = false;
    wait.then(() => {
      resolved = true;
    });

    await Promise.resolve();
    expect(resolved).toBe(false);
    release.resolve();
    await operation;
    await wait;
    expect(resolved).toBe(true);
  });
});
