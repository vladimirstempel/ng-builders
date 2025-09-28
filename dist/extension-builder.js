"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const architect_1 = require("@angular-devkit/architect");
const build_1 = require("@angular/build");
const esbuild = tslib_1.__importStar(require("esbuild"));
const path = tslib_1.__importStar(require("node:path"));
exports.default = (0, architect_1.createBuilder)(buildExtensionasync);
async function buildExtensionasync(options, context) {
    context.logger.info('Custom builder is running!');
    if (!context.target) {
        context.logger.error("Cannot execute the build without a target");
        return { success: false, error: "Cannot execute the build without a target" };
    }
    // 1. Get the main application build options
    const buildTarget = (0, architect_1.targetFromTargetString)(context.target.project + ':build:' + context.target.configuration);
    const buildOptions = await context.getTargetOptions(buildTarget);
    // 2. Execute the default Angular application builder (esbuild)
    try {
        for await (const output of (0, build_1.buildApplication)(buildOptions, context)) {
            // This loop runs for each build, and for rebuilds in watch mode.
            // For a single build, it will run once.
        }
        context.logger.info('Main application build successful.');
    }
    catch (error) {
        context.logger.error('Main application build failed:');
        if (error instanceof Error) {
            context.logger.error(error.toString());
        }
        return { success: false, error: error.message };
    }
    const outputPathClass = buildOptions.outputPath;
    // 3. Determine the output path
    const outputPath = path.join(context.workspaceRoot, outputPathClass.base, outputPathClass.browser ?? "");
    // 4. Build the background and content scripts using esbuild
    const scriptsToBuild = {
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
            }
            catch (error) {
                context.logger.error(`Error building ${name} script:`);
                if (error instanceof Error) {
                    context.logger.error(error.toString());
                }
                return { success: false, error: error.message };
            }
        }
    }
    return { success: true };
}
//# sourceMappingURL=extension-builder.js.map