import type { BuilderContext } from "@angular-devkit/architect";
import { BuildReporter } from "./build-reporter";
import { Bundler, BundleResult, EmptyBundler, EsbuildBundler } from "./bundler";
import { ManifestCopier } from "./manifest-copier";
import { ScriptTypeChecker, TypeChecker } from "./type-check";

export interface ScriptsBuilderConfig {
  /** Absolute paths of the entry points, keyed by the output file name (without `.js`). */
  entryPoints: Record<string, string>;
  /** Absolute path of the manifest file. */
  manifestPath: string;
  /** Absolute path of the output directory. */
  outputPath: string;
  /** Absolute path of the tsconfig file that is used for type checking. */
  tsConfigPath: string;
  minify: boolean;
  sourcemap: boolean | "external";
  logger: BuilderContext["logger"];
}

export interface ScriptsBuilderDependencies {
  bundler: Bundler;
  typeChecker: ScriptTypeChecker;
  manifest: Pick<ManifestCopier, "copy" | "watch" | "dispose">;
  reporter: Pick<BuildReporter, "reportBundle" | "success" | "failure">;
}

export interface ScriptsBuildResult {
  success: boolean;
  error?: string;
}

/** Type checks and bundles the extension scripts, then copies the manifest. */
export class ScriptsBuilder {
  constructor(private readonly dependencies: ScriptsBuilderDependencies) {}

  /** Builds one time. */
  async build(): Promise<ScriptsBuildResult> {
    const { bundler, typeChecker, reporter } = this.dependencies;

    if (!typeChecker.check()) {
      return { success: false, error: "Type checking of the extension scripts failed." };
    }

    const result = await bundler.bundle();
    await reporter.reportBundle(result);
    if (result.errors.length > 0) {
      return { success: false, error: "Bundling of the extension scripts failed." };
    }

    return this.copyManifest();
  }

  /** Builds, and builds again when the scripts or the manifest change. Errors do not stop the watch. */
  async watch(): Promise<void> {
    const { bundler, manifest, reporter } = this.dependencies;

    await bundler.watch((result) => this.onRebuild(result));
    manifest.watch((error) => reporter.failure(`Cannot copy the manifest: ${getErrorMessage(error)}`));
  }

  async dispose(): Promise<void> {
    this.dependencies.manifest.dispose();
    await this.dependencies.bundler.dispose();
  }

  private async onRebuild(result: BundleResult): Promise<void> {
    const { typeChecker, reporter } = this.dependencies;

    const typesOk = typeChecker.check();
    await reporter.reportBundle(result);
    if (!typesOk || result.errors.length > 0) {
      reporter.failure("Extension scripts build failed. Waiting for changes...");
      return;
    }

    const { error } = this.copyManifest();
    if (error) {
      reporter.failure(error);
    }
  }

  private copyManifest(): ScriptsBuildResult {
    try {
      this.dependencies.manifest.copy();
    } catch (error) {
      return { success: false, error: `Cannot copy the manifest: ${getErrorMessage(error)}` };
    }
    this.dependencies.reporter.success();
    return { success: true };
  }
}

/** Creates a scripts builder that uses esbuild and the TypeScript compiler. */
export function createScriptsBuilder(config: ScriptsBuilderConfig): ScriptsBuilder {
  const scriptPaths = Object.values(config.entryPoints);
  const hasScripts = scriptPaths.length > 0;

  return new ScriptsBuilder({
    bundler: hasScripts ? new EsbuildBundler(createEsbuildOptions(config)) : new EmptyBundler(),
    // Without scripts there is nothing to check. The Angular builder checks the app.
    typeChecker: hasScripts
      ? new TypeChecker(config.tsConfigPath, scriptPaths, config.logger)
      : { check: () => true },
    manifest: new ManifestCopier(config.manifestPath, config.outputPath),
    reporter: new BuildReporter(config.logger),
  });
}

function createEsbuildOptions(config: ScriptsBuilderConfig) {
  return {
    entryPoints: config.entryPoints,
    outdir: config.outputPath,
    bundle: true,
    platform: "browser",
    target: "es2020",
    format: "iife",
    minify: config.minify,
    sourcemap: config.sourcemap,
    logLevel: "silent",
  } as const;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
