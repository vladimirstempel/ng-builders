import type { BuilderContext } from "@angular-devkit/architect";
import * as path from "node:path";
import * as ts from "typescript";

const formatHost: ts.FormatDiagnosticsHost = {
  getCanonicalFileName: (fileName) => fileName,
  getCurrentDirectory: ts.sys.getCurrentDirectory,
  getNewLine: () => ts.sys.newLine,
};

export interface ScriptTypeChecker {
  /** Returns true when there are no type errors. Errors are written to the logger. */
  check(): boolean;
}

/**
 * Type checks the extension scripts with the compiler options of the app tsconfig.
 * The previous program is kept, so that rebuilds in watch mode are incremental.
 */
export class TypeChecker implements ScriptTypeChecker {
  private previousProgram: ts.Program | undefined;

  constructor(
    private readonly tsConfigPath: string,
    private readonly scriptPaths: string[],
    private readonly logger: BuilderContext["logger"]
  ) {}

  check(): boolean {
    const parsedConfig = this.readConfig();
    if (!parsedConfig) {
      return false;
    }

    const rootNames = [...new Set([...parsedConfig.fileNames, ...this.scriptPaths])];
    const program = ts.createProgram({
      rootNames,
      // Only type check. Emit options of the app tsconfig (outDir, rootDir) do not apply.
      options: { ...parsedConfig.options, noEmit: true },
      projectReferences: parsedConfig.projectReferences,
      oldProgram: this.previousProgram,
    });
    this.previousProgram = program;

    const diagnostics = ts.getPreEmitDiagnostics(program);
    if (diagnostics.length > 0) {
      this.logger.error(ts.formatDiagnosticsWithColorAndContext(diagnostics, formatHost));
      return false;
    }
    return true;
  }

  private readConfig(): ts.ParsedCommandLine | undefined {
    const { config, error } = ts.readConfigFile(this.tsConfigPath, ts.sys.readFile);
    if (error) {
      this.logDiagnostics([error]);
      return undefined;
    }

    const parsedConfig = ts.parseJsonConfigFileContent(
      config,
      ts.sys,
      path.dirname(this.tsConfigPath),
      undefined,
      this.tsConfigPath
    );
    if (parsedConfig.errors.length > 0) {
      this.logDiagnostics(parsedConfig.errors);
      return undefined;
    }
    return parsedConfig;
  }

  private logDiagnostics(diagnostics: readonly ts.Diagnostic[]): void {
    this.logger.error(ts.formatDiagnostics(diagnostics, formatHost));
  }
}
