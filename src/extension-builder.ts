import { BuilderContext, BuilderOutput, createBuilder, targetFromTargetString } from '@angular-devkit/architect';
import { JsonObject } from '@angular-devkit/core';
import { ApplicationBuilderOptions, buildApplication } from '@angular/build';
import * as esbuild from 'esbuild';
import * as path from 'node:path';

// Define the options for our custom builder
interface Options extends JsonObject {
  backgroundScript: string;
  contentScript: string;
}

export default createBuilder<Options>(buildExtensionasync);

async function buildExtensionasync (options: Options, context: BuilderContext): Promise<BuilderOutput> {
  context.logger.info('Custom builder is running!');

  if (!context.target) {
    context.logger.error("Cannot execute the build without a target");
    return { success: false, error: "Cannot execute the build without a target"};
  }

  // 1. Get the main application build options
  const buildTarget = targetFromTargetString(context.target.project + ':build:' + context.target.configuration);
  const buildOptions = await context.getTargetOptions(buildTarget) as unknown as ApplicationBuilderOptions;

  // 2. Execute the default Angular application builder (esbuild)
  try {
    for await (const output of buildApplication(buildOptions, context)) {
        // This loop runs for each build, and for rebuilds in watch mode.
        // For a single build, it will run once.
    }
    context.logger.info('Main application build successful.');
  } catch (error) {
    context.logger.error('Main application build failed:');
    if (error instanceof Error) {
      context.logger.error(error.toString());
    }
    return { success: false, error: (error as Error).message };
  }

  const outputPathClass = (buildOptions.outputPath as { base: string, browser?: string });

  // 3. Determine the output path
  const outputPath = path.join(
    context.workspaceRoot,
    outputPathClass.base,
    outputPathClass.browser ?? ""
  );

  // 4. Build the background and content scripts using esbuild
  const scriptsToBuild: { [key: string]: string | undefined } = {
    background: options.backgroundScript,
    content: options.contentScript,
  };

  for (const [name, scriptPath] of Object.entries(scriptsToBuild)) {
    if (scriptPath) {
      try {
        await esbuild.build({
          entryPoints: [path.join(context.workspaceRoot, scriptPath)],
          bundle: true,
          outfile: path.join(outputPath, `${name}.js`),
          platform: 'browser',
          target: 'es2020',
          format: 'iife',
        });
        context.logger.info(`Successfully built ${name} script.`);
      } catch (error) {
        context.logger.error(`Error building ${name} script:`);
        if (error instanceof Error) {
          context.logger.error(error.toString());
        }
        return { success: false, error: (error as Error).message };
      }
    }
  }

  return { success: true };
}
