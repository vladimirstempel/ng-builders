import { PluginBuild } from "esbuild";

export const BUILD_PLUGIN = (callback: () => { success: boolean }) => ({
  name: "build-plugin",
  setup(build: PluginBuild) {
    build.onStart(() => {
      console.log(
        `Building ${
          (build.initialOptions.entryPoints as string[])?.[0] as string
        }`
      );
    });
    build.onEnd((result) => {
      const { success } = callback();

      if (!success) {
        console.log("Build failed. Waiting for rebuild.");
        return;
      }

      if (
        result.errors &&
        Array.isArray(result.errors) &&
        result.errors.length >= 1
      ) {
        console.error("❌ Build failed with errors.", result.errors);
        return;
      }

      if (success &&
        result.warnings &&
        Array.isArray(result.warnings) &&
        result.warnings.length >= 1
      ) {
        console.warn("⚠ Build completed with warnings.", result.warnings);
      } else {
        console.log("✔ Build completed.");
      }
    });
  },
});
