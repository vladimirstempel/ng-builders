import assert from "node:assert/strict";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import * as path from "node:path";
import { test } from "node:test";
import { createProject, createRecordingLogger, MANIFEST, TSCONFIG, waitFor } from "./helpers.mjs";

const require = createRequire(import.meta.url);
const { createScriptsBuilder, ScriptsBuilder } = require("../dist/scripts-builder.js");

function setUp(files, { entryPoints = { background: "background.ts" }, minify = false } = {}) {
  const root = createProject({ "tsconfig.json": TSCONFIG, "manifest.json": MANIFEST, ...files });
  const logger = createRecordingLogger();
  const outputPath = path.join(root, "out");
  const builder = createScriptsBuilder({
    entryPoints: Object.fromEntries(
      Object.entries(entryPoints).map(([name, file]) => [name, path.join(root, file)])
    ),
    manifestPath: path.join(root, "manifest.json"),
    outputPath,
    tsConfigPath: path.join(root, "tsconfig.json"),
    minify,
    sourcemap: false,
    logger,
  });
  return { root, logger, outputPath, builder };
}

test("when background.ts is valid, build writes background.js and manifest.json", async () => {
  const { outputPath, builder } = setUp({ "background.ts": 'const n: number = 1;\nconsole.log(n);\n' });

  const result = await builder.build();

  assert.deepEqual(result, { success: true });
  assert.match(readFileSync(path.join(outputPath, "background.js"), "utf8"), /console\.log/);
  assert.equal(existsSync(path.join(outputPath, "manifest.json")), true);
});

test("when background.ts has a type error, build fails and writes no script", async () => {
  const { outputPath, logger, builder } = setUp({ "background.ts": 'const n: number = "a";\n' });

  const result = await builder.build();

  assert.equal(result.success, false);
  assert.match(logger.entries.error.join("\n"), /TS2322/);
  assert.equal(existsSync(path.join(outputPath, "background.js")), false);
});

test("when background.ts imports a file that does not exist, build fails", async () => {
  const { logger, builder } = setUp({
    "background.ts": '// @ts-ignore\nimport "./missing";\n',
  });

  const result = await builder.build();

  assert.equal(result.success, false);
  assert.match(logger.entries.error.join("\n"), /missing/);
});

test("when there are no scripts, build copies only the manifest", async () => {
  const { outputPath, builder } = setUp({}, { entryPoints: {} });

  const result = await builder.build();

  assert.deepEqual(result, { success: true });
  assert.equal(existsSync(path.join(outputPath, "manifest.json")), true);
});

test("when minify is true, the script has no line breaks inside", async () => {
  const code = 'const longVariableName: number = 1;\nconsole.log(longVariableName);\n';
  const { outputPath, builder } = setUp({ "background.ts": code }, { minify: true });

  await builder.build();

  const output = readFileSync(path.join(outputPath, "background.js"), "utf8");
  assert.equal(output.trim().split("\n").length, 1);
  assert.doesNotMatch(output, /longVariableName/);
});

function createFakes({ typesOk = true } = {}) {
  const calls = { bundle: 0, copy: 0 };
  return {
    calls,
    dependencies: {
      bundler: {
        bundle: async () => { calls.bundle++; return { errors: [], warnings: [] }; },
        watch: async () => {},
        dispose: async () => {},
      },
      typeChecker: { check: () => typesOk },
      manifest: { copy: () => { calls.copy++; }, watch: () => {}, dispose: () => {} },
      reporter: { reportBundle: async () => {}, success: () => {}, failure: () => {} },
    },
  };
}

test("when the type check fails, build does not bundle and does not copy the manifest", async () => {
  const { calls, dependencies } = createFakes({ typesOk: false });

  const result = await new ScriptsBuilder(dependencies).build();

  assert.equal(result.success, false);
  assert.deepEqual(calls, { bundle: 0, copy: 0 });
});

test("when the type check passes, build bundles and copies the manifest", async () => {
  const { calls, dependencies } = createFakes();

  const result = await new ScriptsBuilder(dependencies).build();

  assert.deepEqual(result, { success: true });
  assert.deepEqual(calls, { bundle: 1, copy: 1 });
});

test("in watch mode, an error does not stop the rebuilds", async (t) => {
  const { root, outputPath, logger, builder } = setUp({ "background.ts": 'console.log("v1");\n' });
  t.after(() => builder.dispose());
  const backgroundJs = path.join(outputPath, "background.js");

  await builder.watch();
  await waitFor(() => existsSync(backgroundJs));
  writeFileSync(path.join(root, "background.ts"), 'const n: number = "a";\n');
  await waitFor(() => logger.entries.error.some((e) => e.includes("Waiting for changes")));
  writeFileSync(path.join(root, "background.ts"), 'console.log("v2");\n');

  await waitFor(() => readFileSync(backgroundJs, "utf8").includes("v2"));
});
