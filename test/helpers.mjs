import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import * as path from "node:path";

/** Logger that keeps the messages, so that tests can check them. */
export function createRecordingLogger() {
  const entries = { info: [], warn: [], error: [] };
  return {
    entries,
    info: (message) => entries.info.push(message),
    warn: (message) => entries.warn.push(message),
    error: (message) => entries.error.push(message),
  };
}

/** Creates a temporary directory with the given files. Returns its absolute path. */
export function createProject(files) {
  const root = mkdtempSync(path.join(tmpdir(), "ng-builders-"));
  for (const [name, content] of Object.entries(files)) {
    writeFileSync(path.join(root, name), content);
  }
  return root;
}

export const TSCONFIG = JSON.stringify({
  compilerOptions: { strict: true, target: "ES2022", module: "preserve", lib: ["ES2022", "DOM"], types: [] },
  include: ["*.ts"],
});

export const MANIFEST = JSON.stringify({ manifest_version: 3, name: "test", version: "1.0" });

/** Waits until the condition is true, or fails after the timeout. */
export async function waitFor(condition, timeoutMs = 3000) {
  const end = Date.now() + timeoutMs;
  while (!condition()) {
    if (Date.now() > end) {
      throw new Error("Timeout: the condition did not become true.");
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}
