import assert from "node:assert/strict";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import * as path from "node:path";
import { test } from "node:test";
import { createProject, MANIFEST, waitFor } from "./helpers.mjs";

const require = createRequire(import.meta.url);
const { ManifestCopier } = require("../dist/manifest-copier.js");

test("copy writes manifest.json into a new output directory", () => {
  const root = createProject({ "manifest.json": MANIFEST });
  const outputDir = path.join(root, "out", "browser");

  new ManifestCopier(path.join(root, "manifest.json"), outputDir).copy();

  assert.equal(readFileSync(path.join(outputDir, "manifest.json"), "utf8"), MANIFEST);
});

test("copy throws when the manifest does not exist", () => {
  const root = createProject({});

  const copier = new ManifestCopier(path.join(root, "manifest.json"), path.join(root, "out"));

  assert.throws(() => copier.copy());
});

test("watch copies the manifest again when it changes", async (t) => {
  const root = createProject({ "manifest.json": MANIFEST });
  const outputFile = path.join(root, "out", "manifest.json");
  const copier = new ManifestCopier(path.join(root, "manifest.json"), path.join(root, "out"));
  t.after(() => copier.dispose());

  copier.watch(assert.fail);
  writeFileSync(path.join(root, "manifest.json"), '{"version":"2.0"}');

  await waitFor(() => existsSync(outputFile) && readFileSync(outputFile, "utf8").includes("2.0"));
});
