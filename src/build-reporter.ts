import type { BuilderContext } from "@angular-devkit/architect";
import * as esbuild from "esbuild";
import type { BundleResult } from "./bundler";

/** Writes the build messages of the extension scripts to the Angular CLI logger. */
export class BuildReporter {
  constructor(private readonly logger: BuilderContext["logger"]) {}

  async reportBundle(result: BundleResult): Promise<void> {
    if (result.errors.length > 0) {
      this.logger.error(await formatMessages(result.errors, "error"));
    }
    if (result.warnings.length > 0) {
      this.logger.warn(await formatMessages(result.warnings, "warning"));
    }
  }

  success(): void {
    this.logger.info("Extension scripts built.");
  }

  failure(message: string): void {
    this.logger.error(message);
  }
}

async function formatMessages(
  messages: esbuild.Message[],
  kind: "error" | "warning"
): Promise<string> {
  const formatted = await esbuild.formatMessages(messages, { kind, color: true });
  return formatted.join("\n");
}
