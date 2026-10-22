import type { ApplicationBuilderOptions } from "@angular/build";

/** Options of the `extension` builder, as declared in `schema.json`. */
export interface ExtensionBuilderOptions {
  backgroundScript?: string;
  contentScript?: string;
  manifest: string;
  outputPath: {
    base: string;
    browser?: string;
  };
  watch?: boolean;
  tsConfig?: string;
  optimization?: ApplicationBuilderOptions["optimization"];
  sourceMap?: ApplicationBuilderOptions["sourceMap"];
}

/** Options that only this builder knows. They are not sent to the Angular application builder. */
const OWN_OPTION_KEYS = ["backgroundScript", "contentScript", "manifest"] as const;

export function toApplicationOptions(
  options: ExtensionBuilderOptions
): ApplicationBuilderOptions {
  const applicationOptions: Record<string, unknown> = { ...options };
  for (const key of OWN_OPTION_KEYS) {
    delete applicationOptions[key];
  }
  return applicationOptions as unknown as ApplicationBuilderOptions;
}

export function isScriptOptimizationEnabled(
  optimization: ExtensionBuilderOptions["optimization"]
): boolean {
  if (typeof optimization === "object") {
    return optimization.scripts ?? true;
  }
  // The Angular application builder enables optimization when the option is not set.
  return optimization ?? true;
}

export function getScriptSourceMap(
  sourceMap: ExtensionBuilderOptions["sourceMap"]
): boolean | "external" {
  if (typeof sourceMap === "object") {
    if (!(sourceMap.scripts ?? true)) {
      return false;
    }
    return sourceMap.hidden ? "external" : true;
  }
  return sourceMap ?? false;
}
