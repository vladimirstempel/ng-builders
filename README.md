# @stempelv/ng-builders

[![npm version](https://img.shields.io/npm/v/@stempelv/ng-builders.svg)](https://www.npmjs.com/package/@stempelv/ng-builders)

Angular CLI builder for Chrome extensions (Manifest V3).

The `extension` builder:

1. Runs the standard Angular application builder (`@angular/build:application`). Use the app as a popup, options page or side panel.
2. Type checks and bundles the background and content scripts with esbuild into the same output directory.
3. Copies the extension manifest into the output directory.

## Requirements

| Package                     | Version              |
| --------------------------- | -------------------- |
| `@angular/build`            | 20.x, 21.x or 22.x   |
| `@angular-devkit/architect` | matches `@angular/build` |
| `typescript`                | the version that your Angular version supports |
| Node.js                     | the version that your Angular version supports |

These are peer dependencies. An Angular CLI workspace already contains them.

## Installation

```bash
npm install --save-dev @stempelv/ng-builders
```

## Usage

Replace the builder of the `build` target in `angular.json`:

```json
"architect": {
  "build": {
    "builder": "@stempelv/ng-builders:extension",
    "options": {
      "backgroundScript": "src/background.ts",
      "contentScript": "src/content.ts",
      "manifest": "src/manifest.json",
      "outputPath": {
        "base": "dist/my-extension"
      },
      "browser": "src/main.ts",
      "index": "src/index.html",
      "tsConfig": "tsconfig.app.json",
      "assets": [{ "glob": "**/*", "input": "public" }],
      "styles": ["src/styles.css"]
    },
    "configurations": {
      "production": {
        "outputHashing": "all"
      },
      "development": {
        "optimization": false,
        "sourceMap": true
      }
    },
    "defaultConfiguration": "production"
  }
}
```

Then build the extension:

```bash
ng build
```

Rebuild on file changes:

```bash
ng build --watch --configuration development
```

Load the `dist/my-extension/browser` directory in `chrome://extensions` with **Load unpacked**.

The output contains `background.js` and `content.js`. Refer to these names in `manifest.json`:

```json
{
  "manifest_version": 3,
  "background": { "service_worker": "background.js" },
  "content_scripts": [{ "matches": ["<all_urls>"], "js": ["content.js"] }]
}
```

### Type checking

The scripts are type checked with the compiler options of `tsConfig`. To use the `chrome` API, install `@types/chrome` and add it to `types` in `tsconfig.app.json`:

```json
{
  "compilerOptions": {
    "types": ["chrome"]
  }
}
```

### Use as a separate target

You can also add the builder as a different target (for example `extension`). Then the builder uses the options of the `build` target as defaults, and its own options have priority.

## Options

| Option               | Type      | Description                                                                                       |
| -------------------- | --------- | ------------------------------------------------------------------------------------------------- |
| `manifest`           | `string`  | **Required.** Path to the manifest, relative to the workspace root.                                |
| `outputPath.base`    | `string`  | **Required.** Output path, relative to the workspace root.                                         |
| `outputPath.browser` | `string`  | Name of the browser output directory in `outputPath.base`. Default: `browser`.                    |
| `backgroundScript`   | `string`  | Path to the background script. Output: `background.js`.                                          |
| `contentScript`      | `string`  | Path to the content script. Output: `content.js`.                                                 |
| `watch`              | `boolean` | Rebuild on file changes. Default: `false`.                                                        |

All options of [`@angular/build:application`](https://angular.dev/reference/configs/workspace-config) are also accepted. These options also apply to the scripts:

- `optimization`: minifies the scripts (`optimization.scripts` when it is an object).
- `sourceMap`: writes source maps for the scripts (`sourceMap.scripts` and `sourceMap.hidden` when it is an object).
- `tsConfig`: used for type checking of the scripts.

## License

MIT. See [LICENSE](LICENSE).
