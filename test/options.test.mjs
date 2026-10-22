import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { test } from "node:test";

const require = createRequire(import.meta.url);
const {
  getScriptSourceMap,
  isScriptOptimizationEnabled,
  toApplicationOptions,
} = require("../dist/options.js");

test("toApplicationOptions removes the options of this builder", () => {
  const result = toApplicationOptions({
    backgroundScript: "src/background.ts",
    contentScript: "src/content.ts",
    manifest: "src/manifest.json",
    outputPath: { base: "dist/app" },
    tsConfig: "tsconfig.app.json",
  });
  assert.deepEqual(result, { outputPath: { base: "dist/app" }, tsConfig: "tsconfig.app.json" });
});

test("isScriptOptimizationEnabled follows the Angular defaults", () => {
  assert.equal(isScriptOptimizationEnabled(undefined), true);
  assert.equal(isScriptOptimizationEnabled(false), false);
  assert.equal(isScriptOptimizationEnabled({ styles: true }), true);
  assert.equal(isScriptOptimizationEnabled({ scripts: false }), false);
});

test("getScriptSourceMap follows the Angular defaults", () => {
  assert.equal(getScriptSourceMap(undefined), false);
  assert.equal(getScriptSourceMap(true), true);
  assert.equal(getScriptSourceMap({ scripts: false }), false);
  assert.equal(getScriptSourceMap({ hidden: true }), "external");
});

test("the package exports a builder", () => {
  const builder = require("../dist/extension-builder.js").default;
  assert.equal(typeof builder.handler, "function");
});
