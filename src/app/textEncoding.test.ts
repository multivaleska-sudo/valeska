import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const BAD_ENCODING_PATTERNS = [
  /\u00C3\u0192/g,
  /\u00C3/g,
  /\u00C2/g,
  /\u00E2\u20AC\u00A2/g,
  /\u00F0\u0178/g,
];
const TEXT_EXTENSIONS = new Set([".ts", ".tsx"]);

function collectSourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) return collectSourceFiles(fullPath);
    return TEXT_EXTENSIONS.has(fullPath.slice(fullPath.lastIndexOf(".")))
      ? [fullPath]
      : [];
  });
}

describe("frontend source encoding", () => {
  it("does not contain common mojibake sequences", () => {
    const root = join(process.cwd(), "src", "app");
    const offenders = collectSourceFiles(root).filter((file) => {
      if (file.endsWith("textEncoding.test.ts")) return false;
      const text = readFileSync(file, "utf8");
      return BAD_ENCODING_PATTERNS.some((pattern) => pattern.test(text));
    });

    expect(offenders).toEqual([]);
  });
});
