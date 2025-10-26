

> Port this project from Vue 2 to Vue 3 while maintaining all existing functionalities and ensuring compatibility with current TypeScript modules. Try to do a minimal change, keep original code as much as possible. Following the original coding style and project structure.

<details>
Modernization summary (based on staged changes):
- Switched project docs and commands to Yarn; updated `AGENTS.md` to reflect Vue 3 and Yarn workflows.
- Migrated app entry points to Vue 3 `createApp` (`app/home.ts`, `app/common-viewer.ts`, `app/embed.ts`); using Vue Router 4.
- Enabled Vue 3 compat mode via `vue: "@vue/compat"` alias; added a local shim for `vue-resize-directive` and aliased it in `vue.config.js`.
- Hardened Vue CLI config for restricted environments: disabled `friendly-errors`, `fork-ts-checker`, and `progress`; disabled cache; kept binary/yaml loaders and excluded minified JS.
- Adjusted CSS/Sass loader configuration for Vue CLI 5 + `sass-loader` v12.
- Updated Node version to `21.7.1` in `.nvmrc` and `package.json` `engines.node`.

Issues and next steps:
- Serve blocked in sandbox; re-run `yarn serve` to validate runtime and fix remaining compat warnings/errors once allowed.
- Verify `vue-class-component`/`vue-property-decorator` usage with Vue 3; upgrade or refactor components to options/composition API under compat mode.
- Audit `v-charts` (Vue 2) usage; replace with Vue 3 compatible ECharts wrapper or isolate behind compat shims.
- Align documentation about Node version in `AGENTS.md` with `.nvmrc`/`engines` to avoid confusion.
- Run `yarn build` and `yarn lint`; fix TypeScript/ESLint issues surfaced after migration.
</details>

> Current the main obstacle is vue2 packages in dependencies, *lotus*.
