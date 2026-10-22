import {
  BuilderContext,
  BuilderOutput,
  createBuilder,
  Target,
} from "@angular-devkit/architect";
import { buildApplication } from "@angular/build";
import * as path from "node:path";
import {
  ExtensionBuilderOptions,
  getScriptSourceMap,
  isScriptOptimizationEnabled,
  toApplicationOptions,
} from "./options";
import { createScriptsBuilder, ScriptsBuilderConfig } from "./scripts-builder";

export default createBuilder<ExtensionBuilderOptions>(buildExtension);

export async function* buildExtension(
  options: ExtensionBuilderOptions,
  context: BuilderContext
): AsyncIterable<BuilderOutput> {
  if (!context.target) {
    yield { success: false, error: "Cannot execute the build without a target." };
    return;
  }

  const mergedOptions = await mergeWithBuildTargetOptions(options, context, context.target);
  if (!mergedOptions.tsConfig) {
    yield { success: false, error: "The 'tsConfig' option is required." };
    return;
  }

  const scriptsBuilder = createScriptsBuilder(
    toScriptsBuilderConfig(mergedOptions, mergedOptions.tsConfig, context)
  );
  context.addTeardown(() => scriptsBuilder.dispose());

  let watching = false;
  for await (const output of buildApplication(toApplicationOptions(mergedOptions), context)) {
    if (!output.success) {
      yield output;
      continue;
    }

    if (!mergedOptions.watch) {
      const result = await scriptsBuilder.build();
      yield result.success ? output : { ...output, ...result };
      continue;
    }

    // In watch mode esbuild rebuilds the scripts on its own. Start it only one time.
    if (!watching) {
      watching = true;
      await scriptsBuilder.watch();
    }
    yield output;
  }
}

function toScriptsBuilderConfig(
  options: ExtensionBuilderOptions,
  tsConfig: string,
  context: BuilderContext
): ScriptsBuilderConfig {
  const workspacePath = (file: string) => path.resolve(context.workspaceRoot, file);
  const { base, browser = "" } = options.outputPath;

  const entryPoints: Record<string, string> = {};
  if (options.backgroundScript) {
    entryPoints["background"] = workspacePath(options.backgroundScript);
  }
  if (options.contentScript) {
    entryPoints["content"] = workspacePath(options.contentScript);
  }

  return {
    entryPoints,
    manifestPath: workspacePath(options.manifest),
    outputPath: workspacePath(path.join(base, browser)),
    tsConfigPath: workspacePath(tsConfig),
    minify: isScriptOptimizationEnabled(options.optimization),
    sourcemap: getScriptSourceMap(options.sourceMap),
    logger: context.logger,
  };
}

/**
 * When this builder is not the `build` target of the project, it uses the options
 * of the `build` target as defaults. The options of this builder have priority.
 */
async function mergeWithBuildTargetOptions(
  options: ExtensionBuilderOptions,
  context: BuilderContext,
  target: Target
): Promise<ExtensionBuilderOptions> {
  if (target.target === "build") {
    return options;
  }

  const buildTarget: Target = { project: target.project, target: "build" };
  if (target.configuration) {
    buildTarget.configuration = target.configuration;
  }
  const buildOptions = await context.getTargetOptions(buildTarget);
  return { ...buildOptions, ...options } as ExtensionBuilderOptions;
}
