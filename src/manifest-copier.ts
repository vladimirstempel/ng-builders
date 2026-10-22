import * as fs from "node:fs";
import * as path from "node:path";

/** Copies the extension manifest into the output directory. */
export class ManifestCopier {
  private watcher: fs.FSWatcher | undefined;

  constructor(
    private readonly manifestPath: string,
    private readonly outputPath: string
  ) {}

  copy(): void {
    fs.mkdirSync(this.outputPath, { recursive: true });
    fs.copyFileSync(this.manifestPath, path.join(this.outputPath, path.basename(this.manifestPath)));
  }

  /** Copies the manifest each time it changes. */
  watch(onError: (error: unknown) => void): void {
    // Watch the directory, not the file: editors often replace the file when they save it.
    const manifestName = path.basename(this.manifestPath);
    this.watcher = fs.watch(path.dirname(this.manifestPath), (_event, fileName) => {
      if (fileName !== manifestName) {
        return;
      }
      try {
        this.copy();
      } catch (error) {
        onError(error);
      }
    });
  }

  dispose(): void {
    this.watcher?.close();
    this.watcher = undefined;
  }
}
