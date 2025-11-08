

> Port this project from Vue 2 to Vue 3 while maintaining all existing functionalities and ensuring compatibility with current TypeScript modules. Try to do a minimal change, keep original code as much as possible. Following the original coding style and project structure.

<details>
<summary>Modernization summary (based on staged changes)</summary>

- Switched project docs and commands to Yarn; updated `AGENTS.md` to reflect Vue 3 and Yarn workflows.
- Migrated app entry points to Vue 3 `createApp` (`app/home.ts`, `app/common-viewer.ts`, `app/embed.ts`); using Vue Router 4.
- Enabled Vue 3 compat mode via `vue: "@vue/compat"` alias; added a local shim for `vue-resize-directive` and aliased it in `vue.config.js`.
- Hardened Vue CLI config for restricted environments: disabled `friendly-errors`, `fork-ts-checker`, and `progress`; disabled cache; kept binary/yaml loaders and excluded minified JS.
- Adjusted CSS/Sass loader configuration for Vue CLI 5 + `sass-loader` v12.
- Updated Node version to `21.7.1` in `.nvmrc` and `package.json` `engines.node`.
</details>

<details>
<summary>Dependency Upgrades (2025-11-08)</summary>

**Upgraded Packages:**
- `@k-l-lambda/lotus`: 0.8.37 → 1.0.2 (Vue 3 version)
- `@k-l-lambda/web-widgets`: 0.3.27 → removed (replaced by music-widgets)
- `@k-l-lambda/music-widgets`: new direct dependency at 1.0.1 (Vue 3 version)

**New Dependencies Added:**
- `@vue/compat@3.5.24` - Vue 3 compat mode for migration
- `formidable`, `xmldom`, `jison`, `jszip` - lotus peer dependencies
- `child-process-promise`, `crc-32`, `diff` - lotus backend dependencies
- `url`, `color` - webpack 5 polyfills for Node.js core modules

**Configuration Changes:**
- Added webpack resolve alias for `@k-l-lambda/lotus$` → browser entry point
- Added webpack fallback for `url` module
- Fixed ESLint error in `app/label3D.ts` (missing semicolon)

**Build Status:** ✅ Successfully building to `docs/` directory
</details>

**Next steps:**
- Test the built application in browser to verify Vue 3 compatibility
- Verify `vue-class-component`/`vue-property-decorator` usage with Vue 3; upgrade or refactor components to options/composition API under compat mode
- Audit `v-charts` (Vue 2) usage; replace with Vue 3 compatible ECharts wrapper or isolate behind compat shims
- Run `yarn serve` to validate runtime and fix remaining compat warnings/errors
