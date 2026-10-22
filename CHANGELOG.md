# Changelog

## 2.0.0

### Breaking changes

- `@angular/build`, `@angular-devkit/architect` and `typescript` are now peer dependencies. The builder uses the versions of your workspace. Supported: Angular 20, 21 and 22.
- The scripts are minified when `optimization` is enabled (the Angular default for production builds).

### Fixes

- Runtime dependency on `tslib` that was not declared.
- Watch mode: a new esbuild watcher was started on each Angular rebuild, and watchers were not stopped.
- Watch mode: an error in a script stopped the watch mode.
- The type checker ran up to 4 times for each build. Now it runs one time, and it is incremental in watch mode.
- TypeScript 6: type checking failed with error TS5011.
- Options of the `build` target replaced the options of this builder (also CLI options such as `--watch`).
- A target without a configuration read the configuration `undefined`.
- The `tsConfig` path is resolved from the workspace root.
- Messages are written with the Angular CLI logger.

### Changes

- `backgroundScript` and `contentScript` are optional.
- `sourceMap` applies to the scripts.
- `esbuild-plugin-copy` is removed. The manifest is copied by the builder.
- The root `package.json` is private, to prevent a publish from the wrong directory.
- The package has the MIT license.
