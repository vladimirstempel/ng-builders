import {
  BuilderContext,
  BuilderOutput,
  createBuilder,
  targetFromTargetString,
} from '@angular-devkit/architect';
import { JsonObject } from '@angular-devkit/core';
import { ApplicationBuilderOptions, buildApplication } from '@angular/build';
import * as esbuild from 'esbuild';
import { copy } from 'esbuild-plugin-copy';
import * as path from 'node:path';
import { BUILD_PLUGIN } from './esbuild.pliugins';

// Define the options for our custom builder
interface Options extends JsonObject {
  backgroundScript: string;
  contentScript: string;
  manifest: string;
  outputPath: {
    base: string;
    browser?: string;
  },
  watch: boolean;
}

export default createBuilder<Options>(buildExtension);

async function* buildExtension(
  options: Options,
  context: BuilderContext
): AsyncIterable<BuilderOutput> {
  context.logger.info('Custom builder is running!');

  if (!context.target) {
    context.logger.error('Cannot execute the build without a target');
    yield { success: false, error: 'Cannot execute the build without a target' };
    return;
  }

  // 1. Get the main application build options
  const buildTarget = targetFromTargetString(
    context.target.project + ':build:' + context.target.configuration
  );
  const buildOptions = Object.assign({}, options, (await context.getTargetOptions(
    buildTarget
  ))) as unknown as ApplicationBuilderOptions;

  // 2. Execute the default Angular application builder (esbuild)
  const buildResults = buildApplication(buildOptions, context);

  for await (const output of buildResults) {
    if (output.success) {
      // 3. Determine the output path
      const outputPath = path.join(
        context.workspaceRoot,
        options.outputPath.base,
        options.outputPath.browser ?? ''
      );

      // 4. Build the background and content scripts using esbuild
      const scriptsToBuild: { [key: string]: string | undefined } = {
        background: options.backgroundScript,
        content: options.contentScript,
      };

      for (const [name, scriptPath] of Object.entries(scriptsToBuild)) {
        if (scriptPath) {
          let esbuildCtx: esbuild.BuildContext | null = null;

          try {
            const esbuildConfig: esbuild.SameShape<esbuild.BuildOptions, esbuild.BuildOptions> = {
              entryPoints: [path.join(context.workspaceRoot, scriptPath)],
              bundle: true,
              outfile: path.join(outputPath, `${name}.js`),
              platform: 'browser',
              target: 'es2020',
              format: 'iife',
              plugins: [
                copy({
                  resolveFrom: 'cwd',
                  assets: {
                    from: [options.manifest],
                    to: [path.join(outputPath)],
                  },
                  watch: options.watch,
                }),
                BUILD_PLUGIN
              ]
            };
            if (options.watch) {
              esbuildCtx = await esbuild.context(esbuildConfig);
              await esbuildCtx.watch();
            } else {
              await esbuild.build(esbuildConfig);
            }
            context.logger.info(`Successfully built ${name} script.`);
          } catch (error) {
            context.logger.error(`Error building ${name} script:`);
            if (error instanceof Error) {
              context.logger.error(error.toString());
            }
            if (esbuildCtx) {
              await esbuildCtx.dispose();
            }
            yield { success: false, error: (error as Error).message };
            return;
          }
        }
      }
    }
    yield output;
  }
}
