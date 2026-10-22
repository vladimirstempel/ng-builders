import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { test } from "node:test";
import { createRecordingLogger } from "./helpers.mjs";

const require = createRequire(import.meta.url);
const { BuildReporter } = require("../dist/build-reporter.js");

const message = { text: "Something is wrong", location: null, notes: [] };

test("when the result has 1 error and 1 warning, logs 1 error and 1 warning", async () => {
  const logger = createRecordingLogger();

  await new BuildReporter(logger).reportBundle({ errors: [message], warnings: [message] });

  assert.equal(logger.entries.error.length, 1);
  assert.equal(logger.entries.warn.length, 1);
  assert.match(logger.entries.error[0], /Something is wrong/);
});

test("when the result has no messages, logs nothing", async () => {
  const logger = createRecordingLogger();

  await new BuildReporter(logger).reportBundle({ errors: [], warnings: [] });

  assert.deepEqual(logger.entries, { info: [], warn: [], error: [] });
});
