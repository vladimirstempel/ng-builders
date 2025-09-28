import { PluginBuild } from 'esbuild';

export const BUILD_PLUGIN = {
    name: "build-plugin",
    setup(build: PluginBuild) {
        build.onStart(() => {
            console.log(`Building ${(build.initialOptions.entryPoints as string[])?.[0] as string}`);
        });
        build.onEnd((result) => {
            if (result.errors && Array.isArray(result.errors) && result.errors.length >= 1) {
                console.error("❌ Build failed with errors.", result.errors);
                return;
            }

            if (result.warnings && Array.isArray(result.warnings) && result.warnings.length >= 1) {
                console.warn("⚠ Build completed with warnings.", result.warnings);
            } else {
                console.log("✔ Build completed.");
            }
        });
    },
};