# @stempelv/ng-builders: Angular Builder for Chrome Extensions

[![npm version](https://badge.fury.io/js/%40stempelv%2Fng-builders.svg)](https://badge.fury.io/js/%40stempelv%2Fng-builders)

This repository contains a custom Angular CLI builder (`@stempelv/ng-builders`) for building Chrome Extensions.

The builder streamlines the development of Chrome extensions by:
1.  Executing the standard Angular application build (`@angular-devkit/build-angular:browser`) to compile the main application, which can be used as a popup or options page.
2.  Using `esbuild` to compile and bundle browser-specific scripts, such as `background.ts` and `content.ts`, into the final output directory.

## Installation

To install the builder, run the following command in your Angular project:

```bash
npm install @stempelv/ng-builders --save-dev
```
or
```bash
pnpm add @stempelv/ng-builders --save-dev
```

## Usage

To use the builder, you need to configure it in your `angular.json` file. Replace the default `build` builder with the custom `extension` builder.

Here is an example configuration:

```json
// In angular.json
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
      "tsConfig": "tsconfig.app.json",
      "assets": [
        "src/favicon.ico",
        "src/assets"
      ],
      "index": "src/index.html",
      "main": "src/main.ts",
      "polyfills": "src/polyfills.ts"
    },
    "configurations": {
      "production": {
        "fileReplacements": [
          {
            "replace": "src/environments/environment.ts",
            "with": "src/environments/environment.prod.ts"
          }
        ],
        "optimization": true,
        "outputHashing": "all",
        "sourceMap": false,
        "extractCss": true,
        "namedChunks": false,
        "extractLicenses": true,
        "vendorChunk": false,
        "buildOptimizer": true,
        "budgets": [
          {
            "type": "initial",
            "maximumWarning": "2mb",
            "maximumError": "5mb"
          }
        ]
      }
    }
  },
  // ... other architect targets
}
```

Then, you can build your extension by running:

```bash
ng build
```

## Builder Options

The following options are available for the `extension` builder:

| Option             | Type      | Description                                                                                              |
| ------------------ | --------- | -------------------------------------------------------------------------------------------------------- |
| `watch`            | `boolean` | Rebuild on file changes. Defaults to `false`.                                                            |
| `backgroundScript` | `string`  | **Required.** Path to the background script (e.g., `src/background.ts`).                                     |
| `contentScript`    | `string`  | **Required.** Path to the content script (e.g., `src/content.ts`).                                       |
| `manifest`         | `string`  | **Required.** Path to the manifest file (e.g., `src/manifest.json`).                                        |
| `outputPath`       | `object`  | **Required.** An object defining the output paths.                                                       |
| `outputPath.base`  | `string`  | **Required.** The base output path relative to the workspace root (e.g., `dist/my-extension`).              |
| `outputPath.browser`| `string` | The output directory name for the browser build within the base path. Defaults to `browser`.             |

Any other options valid for the standard `@angular/build:application` builder (like `tsConfig`, `assets`, `styles`, etc.) can also be used.