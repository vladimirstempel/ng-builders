// Writes the files that are published to npm into dist/.
import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync("package.json", "utf8"));

// The root package is private so that nobody publishes it from the root by mistake.
delete pkg.private;
delete pkg.scripts;
delete pkg.devDependencies;
delete pkg.packageManager;

writeFileSync("dist/package.json", `${JSON.stringify(pkg, null, 2)}\n`);

for (const file of ["builders.json", "README.md", "LICENSE", "CHANGELOG.md"]) {
  if (existsSync(file)) {
    copyFileSync(file, `dist/${file}`);
  }
}
