import * as esbuild from "esbuild";

export interface BundleResult {
  errors: esbuild.Message[];
  warnings: esbuild.Message[];
}

export type BundleListener = (result: BundleResult) => Promise<void>;

export interface Bundler {
  /** Bundles one time. Bundling errors are in the result, they are not thrown. */
  bundle(): Promise<BundleResult>;
  /** Bundles, and bundles again when a source file changes. Calls the listener after each bundle. */
  watch(listener: BundleListener): Promise<void>;
  dispose(): Promise<void>;
}

export class EsbuildBundler implements Bundler {
  private context: esbuild.BuildContext | undefined;

  constructor(private readonly options: esbuild.BuildOptions) {}

  async bundle(): Promise<BundleResult> {
    try {
      return await esbuild.build(this.options);
    } catch (error) {
      if (isBuildFailure(error)) {
        return error;
      }
      throw error;
    }
  }

  async watch(listener: BundleListener): Promise<void> {
    const plugin: esbuild.Plugin = {
      name: "ng-builders-watch",
      setup: (build) => build.onEnd(listener),
    };
    this.context = await esbuild.context({ ...this.options, plugins: [plugin] });
    await this.context.watch();
  }

  async dispose(): Promise<void> {
    await this.context?.dispose();
    this.context = undefined;
  }
}

/** Used when the extension has no scripts. It bundles nothing and always succeeds. */
export class EmptyBundler implements Bundler {
  async bundle(): Promise<BundleResult> {
    return { errors: [], warnings: [] };
  }

  async watch(listener: BundleListener): Promise<void> {
    await listener(await this.bundle());
  }

  async dispose(): Promise<void> {}
}

function isBuildFailure(error: unknown): error is esbuild.BuildFailure {
  return error instanceof Error && Array.isArray((error as Partial<esbuild.BuildFailure>).errors);
}
