## 2026-07-17 Hexagon Blocks recognition overlay preview

- Recognition results now retain source image dimensions plus each accepted contour polygon and centroid for pixel-aligned review overlays.
- The photo panel now layers a responsive SVG over the selected image, distinguishes matched and unmatched contours, reports counts, and keeps Apply/Discard below the preview.
- Added stale async-result and object-URL cleanup for replacement, discard, shape change, and component teardown.
- Validation: focused recognition test, focused ESLint, `git diff --check`, and production build passed.

## 2026-07-17 OpenCV reduced-build contour metrics

- The vendored reduced OpenCV build exposes neither `cv.contourArea` nor `cv.moments`.
- Recognition now calculates polygon area and centroid directly from each contour's `data32S` point buffer using the shoelace formula.
- Confirmed no unsupported calls remain in source or the production bundle; focused ESLint, `git diff --check`, and `yarn build` passed.


- OpenCV build does not expose `cv.contourArea`; contour area is now derived from `cv.moments(contour).m00`.
- This prevents photo recognition from failing with `cv.contourArea is not a function`.
- Focused ESLint and `git diff --check` passed.

## 2026-07-17 Hexagon Blocks photo recognition workflow

- Vendored the local OpenCV JavaScript/WASM runtime and added a cached browser loader.
- Added contour-based `recognizePhotoCv` integration with existing global recognition matching.
- Added photo upload, preview, recognition status, apply, and discard controls to the Hexagon Blocks page.
- Validation: production build passed; ESLint passed with existing warnings.


- Added pure photo-recognition types, stable placement keys, weighted evidence scoring, and deterministic legal global matching.
- Added focused recognition regressions for key stability, score aggregation, conflict filtering, and legal matching.
- Validation: focused ts-node test and ESLint passed; existing app/home.vue change was preserved.

## 2026-07-17 Hexagon Blocks nearest solver fix

- **Solver:** Nearest searches now treat current placements as preferences, allow blocks to move, and optimize the number of moved existing blocks while requiring a complete tiling.
- **UI:** Incomplete or cancelled nearest searches no longer overwrite the board; successful results report the moved-block count.
- **Validation:** Added complete, minimal-movement, and cancellation regressions; focused test, ESLint, and production build passed. `Changelog.txt` was not modified.

## 2026-07-17 Hexagon Blocks pointer interaction

- **Interaction:** Added pointer-captured left-button dragging for palette and placed blocks, middle-button vertical orientation rotation, and nearest legal precomputed-placement snapping on release.
- **Safety:** Active placements are excluded from overlap checks, invalid drops restore the original arrangement, and accepted moves create one history snapshot.
- **Validation:** Focused Hexagon Blocks test, ESLint, and production build passed; `Changelog.txt` was not modified.

## 2026-07-17 Hexagon Blocks follow-up

<details>
<summary>Rendering, solver, and default board fixes</summary>

- **Rendering:** Matched `viewer.html` parity-aware triangle projection, corrected projected board bounds, and added actual six-triangle candidate previews.
- **Solver:** Added cooperative async search/cancellation, explicit complete/partial/cancelled results, structural placement validation, parity-safe orientation normalization, and random searches from an empty board.
- **Default:** Set `std` as the initial board type.
- **Validation:** Focused test, ESLint, and production build passed. `Changelog.txt` was not modified.

</details>


## 2026-07-17 Hexagon Blocks rhombus random fix

- **Issue:** Rhombus randomized searches could hit the time limit through Vue reactive proxy overhead and apply a partial arrangement with gaps.
- **Fix:** Marked immutable Shape data as raw before solver use and added rhombus completeness/placement-index regression tests.
- **Validation:** Focused test passed with rhombus 72/72 coverage; ESLint and production build passed.

<details>
<summary>Issue / Root Cause / Fix / Validation</summary>

- **Issue:** The archived HexagonBlocks Python solver needed to become an interactive K.L. Studio page.
- **Root Cause:** The repository had no triangular-grid puzzle implementation or browser simulator.
- **Fix:** Added archive-derived TypeScript geometry/data, exact-cover traversal with random and nearest-result APIs, snapshot history, SVG Vue page, route/gallery registration, and focused console.assert tests.
- **Validation:** Focused test passed; new files pass ESLint; production build passed. Full repository lint retains pre-existing warnings and generated-data style warnings.

</details>

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

<details>
<summary>Router Fix (2025-11-08)</summary>

**Issue:** Runtime error when clicking router links:
```
Cannot read properties of null (reading 'parentNode')
TypeError: Cannot read properties of null (reading 'parentNode')
```

**Root Cause:** Vue 3 does not allow mounting to `<body>` or `<html>` elements. The app was:
1. Mounting to `"body"` in `app/home.ts`
2. Using `<body>` as the root element in `home.vue` template

**Fix Applied:**
- Added `<div id="app"></div>` mount point in `app/html/CommonTemplate.html`
- Changed mount target from `"body"` to `"#app"` in all entry points:
  - `app/home.ts`
  - `app/common-viewer.ts`
  - `app/embed.ts`
- Replaced `<body>` root element with proper div wrappers:
  - `home.vue`: `<div id="home-root">`
  - `common-viewer.vue`: `<div id="common-viewer-root">`
  - `embed.vue`: `<div id="embed-root">`
- Updated CSS selectors from `body` to appropriate root div IDs
- Added global styles for `#app`, `html`, and `body` to ensure proper height/overflow behavior

**Result:** ✅ Router navigation now works without errors across all pages
</details>

<details>
<summary>v-charts Replacement with Direct ECharts (2025-11-08)</summary>

**Issue:** Runtime error when navigating to chess-lab page:
```
Cannot read properties of undefined (reading 'map')
TypeError in v-charts/lib/index.js:1306:46 addWatchToProps
```

**Root Cause:** `v-charts` is a Vue 2 library that's fundamentally incompatible with Vue 3. Even with compat mode and defensive guards, the library's `created()` hook fails when trying to access undefined data structures in Vue 3's reactivity system.

**Solution:** Complete replacement of v-charts with a Vue 3 native implementation.

**Changes:**
1. **Replaced `app/components/chart.vue`** with a new Vue 3 compatible implementation
   - Uses `echarts` directly (already a project dependency)
   - Implements the same props interface as v-charts for backward compatibility
   - Supports dynamic chart types (line, bar, etc.)
   - Handles data in the same format: `{data: {rows, columns}, settings, ...}`
   - Includes proper lifecycle management (mount, unmount, resize handling)
   - Provides `getVChart()` method for compatibility with existing code

2. **Key Features:**
   - Reactive updates when `sourceData` changes
   - Automatic resize handling on window resize
   - Error handling with console logging
   - Support for custom options (grid, tooltip, legend, xAxis, yAxis, etc.)
   - Maintains the same component interface (`type`, `sourceData` props)

3. **Backed up old implementation** to `app/components/chart-old.vue`

**Result:** ✅ Chart component fully functional with Vue 3
- No more v-charts dependency errors
- Direct ECharts integration provides better performance
- Full Vue 3 reactivity support
- Backward compatible with existing chess-lab usage

**Technical Details:**
- Chart initialization in `mounted()` hook
- Proper cleanup in `beforeUnmount()` to dispose echarts instance
- Deep watch on `sourceData` for reactive updates
- Flexible data structure parsing (rows/columns format)
</details>

<details>
<summary>Router Root Path Fix (2025-11-08)</summary>

**Issue:** Vue Router warning:
```
[Vue Router warn]: No match found for location with path "/"
```

**Root Cause:** Router configuration was missing a route definition for the root path "/".

**Fix Applied:**
- Added root route in `app/router.ts`:
  ```javascript
  {
    path: "/",
    name: undefined,
    component: () => import("./views/home-placeholder.vue"),
  }
  ```
- Created `app/views/home-placeholder.vue` as an empty placeholder component

**Result:** ✅ Router warning resolved
</details>

<details>
<summary>globe-cube3 Component Registration Fix (2025-11-08)</summary>

**Issue:** `<globe-cube3>` component not rendering on home page. The raw tag `<globe-cube3>` was visible in the browser instead of the component.

**Root Cause:** Dynamic component registration using `this.$options.components` in the `created()` hook doesn't work properly in Vue 3. The original code at line 156 in `app/home.vue`:
```javascript
this.$options.components["globe-cube3"] = defineAsyncComponent(() => import("./views/globe-cube3.vue"));
```

**Fix Applied:**
1. Moved component registration from `created()` hook to the `components` option in the export default object:
   ```javascript
   export default {
     name: "home",
     components: {
       "globe-cube3": defineAsyncComponent(() => import("./views/globe-cube3.vue")),
     },
     // ...
   }
   ```
2. Removed the dynamic registration code from the `created()` hook
3. Removed unused `getCurrentInstance` import

**Technical Details:**
- Vue 3's component registration mechanism requires components to be declared in the component's `components` option
- `defineAsyncComponent()` is properly supported when used in the components option
- This maintains the lazy loading behavior while ensuring Vue 3 compatibility

**Result:** ✅ globe-cube3 component now renders correctly on the home page
</details>

<details>
<summary>Chart Component ECharts Integration Refinement (2025-11-08)</summary>

**Issue:** Runtime error when navigating to chess-lab page with analyzer enabled:
```
TypeError: Cannot read properties of undefined (reading 'type')
at Object.reset (webpack-internal:///./node_modules/echarts/lib/processor/dataSample.js:104:20)
```

**Root Cause:** The chart.vue component implementation had several issues:
1. Duplicate `beforeUnmount` lifecycle hook
2. Series configuration could be overridden without proper type checking
3. v-charts specific properties (settings, theme, markLine, events) weren't being handled
4. Height property wasn't being handled as a string value

**Fix Applied:**
1. Removed duplicate `beforeUnmount` hook (lines 29-34)
2. Refactored `buildOption()` method to:
   - Extract `theme` from `sourceData` and handle it separately
   - Build series with proper type enforcement
   - Apply smooth setting from `theme.line.smooth` for line charts
   - Handle `markLine` property from sourceData for each series
   - Use theme.grid for grid configuration
   - Support `settings.xAxisType` for xAxis type configuration
   - Handle animation configuration explicitly
   - Fix height property to accept string values (e.g., "240px")
3. Added event handler registration in `initChart()`:
   - Check for `sourceData.events`
   - Register ECharts event handlers (e.g., click) for v-charts compatibility

**Technical Details:**
- Series now always have a `type` property set from chartType
- Configuration priority: customOptions > theme > defaults
- Maintains backward compatibility with v-charts data structure
- Supports all v-charts features used in chess-lab: settings, theme, markLine, events, animation

**Result:** ✅ Chart component fully compatible with Vue 3 and v-charts data structure
- Win rate chart in chess-lab now renders correctly
- All v-charts features are supported
- Event handlers work properly
- Proper lifecycle management without duplicates

**Follow-up Fix:** Added defensive validation to prevent ECharts errors:
- `buildOption()` now returns `null` (instead of empty object) when data is invalid
- `updateChart()` only calls `setOption` when option has valid series array with length > 0
- Added validation for empty rows array (`data.rows.length === 0`) to prevent initialization with empty data
- Added validation for minimum 2 columns (x-axis + at least one data series)
- Changed `setOption` to use merge mode (`notMerge: false`) instead of replace mode for safer updates
- Added console warnings for debugging invalid data states
- Prevents "Cannot read properties of undefined (reading 'type')" error in ECharts

</details>

<details>
<summary>Webpack 5 Asset Modules Migration (2025-11-08)</summary>

**Issue:** StyleGAN mapping page failing to load data files:
```
Cannot find module './random-2/mappingSource.dat'
```

**Root Cause:** Vue CLI 5 uses Webpack 5, which deprecated `url-loader` and `file-loader` in favor of built-in asset modules. The old `url-loader` configuration was no longer working.

**Fix Applied:**
Updated `vue.config.js` to use Webpack 5's built-in asset modules:
- Changed `.dat` and `.gltf` file handling from `url-loader` to `asset/resource` type
- Changed `.yaml` file handling from `url-loader` to `asset/resource` type

**Technical Details:**
- Webpack 5's `asset/resource` type replaces `file-loader` and emits separate files
- This is the modern, recommended approach for handling binary assets
- No additional loaders needed - webpack handles it natively

**Result:** ✅ StyleGAN mapping page can now load data files correctly
- All `.dat` files in `app/assets/stylegan-mapping/` directories are properly loaded
- Binary assets are handled with webpack 5's optimized asset system
</details>

<details>
<summary>Migration from Vue CLI (Webpack) to Vite (2025-11-08)</summary>

**Motivation:** Vite provides significantly faster build times and better development experience compared to Vue CLI/Webpack.

**Changes Made:**

1. **Installed Vite and dependencies:**
   - `vite@5.4.21` (compatible with Node 21)
   - `@vitejs/plugin-vue@5.2.4`
   - `vite-plugin-static-copy@2.3.2`

2. **Created `vite.config.mjs`:**
   - Configured Vue 3 compat mode (`MODE: 2`)
   - Set up multi-page application (index, inner, embed)
   - Configured path aliases (vue, lotus, vue-resize-directive)
   - Added asset handling for `.dat`, `.gltf`, `.yaml` files
   - Configured static file copying from `public/`
   - Output directory: `docs/`

3. **Created HTML entry files:**
   - `index.html` → `/app/home.ts`
   - `inner.html` → `/app/common-viewer.ts`
   - `embed.html` → `/app/embed.ts`
   - Each uses `<script type="module">` for ES module loading

4. **Updated `package.json` scripts:**
   - `serve`: `vite` (dev server)
   - `build`: `vite build`
   - `preview`: `vite preview` (preview production build)
   - `lint`: Updated to use ESLint directly

5. **Fixed compatibility issues:**
   - Added `.vue` extension to `mesh-viewer` import in `flipping-cube.vue`
   - Added ESM default export to `inc/third-party/fix-webm-duration.js` (UMD → ESM hybrid)

6. **Backed up old config:**
   - `vue.config.js` → `vue.config.js.bak`

**Results:**
- ✅ Build completed successfully in ~28 seconds (Vite) vs ~46 seconds (Webpack)
- ✅ All 2269 modules transformed
- ✅ Multi-page setup working (3 HTML entries)
- ✅ Asset handling working (.dat, .gltf, .yaml files)
- ✅ Vue 3 compat mode functioning
- ⚡ **Build time improved by ~40%**

**Technical Notes:**
- Using ES modules (.mjs) for Vite config to support ESM-only plugins
- `__dirname` manually defined for .mjs files using `fileURLToPath`
- Asset files are properly handled via `assetsInclude` configuration
- Static files copied from `public/` directory to build root

**Build Output:**
- Output directory: `docs/`
- Assets directory: `docs/assets/`
- All three pages built successfully

**Follow-up Fix:** Added `process.env` global definition in Vite config:
- `process.env.NODE_ENV` - Build environment
- `process.env.VUE_APP_DORME` - Debug mode flag
- `process.env.VUE_APP_GOOGLE_ANALYTICS_ID` - Analytics ID
- Fixes runtime error: "Uncaught ReferenceError: process is not defined"

**Follow-up Fix 2:** Fixed image asset imports for Vite (2025-11-09):
- **Issue**: Runtime error "Expected a JavaScript-or-Wasm module script but the server responded with a MIME type of 'image/jpeg'"
- **Root Cause**: Vite's dynamic import() with variables doesn't support the `?url` suffix. Vite requires explicit asset URL resolution.
- **Fix Applied**:
  - Updated `loadTexture()` in `app/views/globe-cube3.vue` to use Vite's recommended pattern: `new URL(\`../assets/\${assetPath}\`, import.meta.url).href`
  - Updated skybox texture loading to use the same pattern: `cubeTextureNames.map(name => new URL(\`../assets/skybox-space/\${name}.jpg\`, import.meta.url).href)`
  - The `new URL(path, import.meta.url).href` pattern allows Vite to properly resolve asset URLs at build time
- **Result**: ✅ Dev server starts successfully, all assets load correctly
- Build warnings about dynamic imports in other files (app/home.vue, mesh-viewer.vue) are informational and don't affect functionality

**Follow-up Fix 3:** Fixed chess.js import compatibility (2025-11-09):
- **Issue**: Runtime error "Chess is not a constructor" at chess-lab.vue:639
- **Root Cause**: `chess.js` uses CommonJS named export (`exports.Chess = Chess`), not default export. Vite's ESM loader requires named import.
- **Fix Applied**:
  - Changed `import Chess from "chess.js"` → `import {Chess} from "chess.js"` in 3 files:
    - `app/views/chess-lab.vue:220`
    - `app/chessCompactNotation.ts:2`
    - `inc/chessWorkers.ts:3`
- **Result**: ✅ Build succeeds in ~27s, Chess constructor works correctly

**Follow-up Fix 4:** Fixed Plotly.js UMD module compatibility (2025-11-09):
- **Issue**: Runtime error "Cannot read properties of undefined (reading 'document')" in plotly.min.js
- **Root Cause**: Plotly's UMD wrapper expects proper browser globals (`window`, `document`) but Vite's ESM transformation breaks the UMD detection logic, causing the module to execute in the wrong context.
- **Initial attempt**: Configured Vite to exclude plotly from optimization, but this didn't fully resolve the issue because `import()` still triggered module transformation.
- **Final Fix** in `app/components/circle-plot.vue:70-81`:
  - Changed from ESM dynamic import: `await import("../third-party/plotly.min.js")`
  - To script tag loading: Use `import("../third-party/plotly.min.js?url")` to get the URL, then dynamically create and append a `<script>` tag
  - This bypasses Vite's ESM transformation entirely, allowing Plotly's UMD wrapper to execute in native browser context with proper globals
  - Access via `window.Plotly` after script loads
- **Result**: ✅ Build succeeds in ~18s (faster!), Plotly loads correctly without transformation errors

**Feature Addition:** Development index page (2025-11-09):
- **Created** `app/views/dev-index.vue`: Simple view that lists all available routes from the router
- **Modified** `app/router.ts:166-172`: Added dev index route at `/` path, only in development mode (`process.env.NODE_ENV !== "production"`)
- **Features**:
  - Lists all routes with their names as clickable links
  - Shows cleaned paths for parameterized routes (e.g., routes with `::config` or `::demoPath`)
  - Filters to only show routes that have names defined
  - No styling - minimal HTML structure
- **Usage**: In development, navigate to `/` to see all available routes

**Configuration Fix:** Environment variable loading in Vite (2025-11-09):
- **Issue**: `PORT` and `HOST` environment variables from `.env` and `.env.local` were not being used by Vite dev server
- **Root Cause**: Unlike Vue CLI, Vite doesn't automatically load `.env` files into `process.env` at config evaluation time. The hardcoded port `8080` was always used.
- **Fix Applied** in `vite.config.mjs`:
  - Changed from static config object to function config: `defineConfig(({mode}) => {...})`
  - Import and use `loadEnv` from Vite to load environment variables
  - Updated server config to use env variables: `host: env.HOST || "localhost"`, `port: parseInt(env.PORT) || 8080`, `https: !!env.HTTPS`
  - Also updated `define` section to use `env.VUE_APP_DORME` and `env.VUE_APP_GOOGLE_ANALYTICS_ID` from loaded env instead of `process.env`
- **Result**: ✅ Dev server now respects `PORT=8130` from `.env.local` and `HOST=127.0.0.1` from `.env`

**Bug Fix:** Vue 3 v-for/v-if priority incompatibility (2025-11-09):
- **Issue**: Runtime error "Cannot read properties of undefined (reading 'name')" at equal-temperament.vue:83
- **Root Cause**: In Vue 2, `v-for` has higher priority than `v-if`, but in Vue 3 this is reversed. Using both on same element like `<text v-for="step of steps" v-if="step.name">` causes `step` to be undefined when `v-if` evaluates first.
- **Fix Applied** in `app/views/equal-temperament.vue`:
  - Changed: `<text v-for="step of steps" v-if="step.name" ...>{{step.name}}</text>`
  - To: `<template v-for="step of steps" :key="step.pitch"><text v-if="step.name" ...>{{step.name}}</text></template>`
  - Wrapped with `<template>` element to separate `v-for` and `v-if` onto different DOM levels
  - Added `:key` binding to template as required by Vue 3
  - Applied to 2 occurrences (lines 22-27 and 84-89)
- **Result**: ✅ Equal-temperament view renders correctly without undefined property errors

**Bug Fix:** Lotus player trying to load HTML as JSON (2025-11-09):
- **Issue**: Runtime error "Uncaught (in promise) SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON" at lotus-player.vue:87
- **Root Cause**: When accessing `/lotus` route without a hash parameter specifying a score file, `hashurl.pathname` is empty or "/". The code then calls `fetch(source)` with an empty/root path, which causes Vite dev server to return `index.html` instead of a JSON file. This HTML is then passed to `lotus.ScoreBundle.fromJSON()` which tries to parse it as JSON.
- **Fix Applied** in `app/views/lotus.vue:90-102`:
  - Added validation: Only fetch if `source` is non-empty and not "/"
  - Wrapped fetch in try-catch to handle errors gracefully
  - Set `this.score = null` when no valid source is provided
- **Result**: ✅ Lotus view loads without errors when accessed without a score parameter

**Bug Fix:** Race condition with Plotly loading in circle-plot (2025-11-09):
- **Issue**: Runtime error "Cannot read properties of undefined (reading 'restyle')" at circle-plot.vue:221
- **Root Cause**: The `focusPointIndex` watcher tries to call `this.Plotly.restyle()` but `this.Plotly` is loaded asynchronously in the `created()` lifecycle hook using a script tag. If the `focusPointIndex` prop changes before Plotly finishes loading, the watcher executes with `this.Plotly` still being undefined.
- **Fix Applied** in `app/components/circle-plot.vue:218`:
  - Changed condition from: `if (this.normalPoints)`
  - To: `if (this.normalPoints && this.Plotly)`
  - Now checks that Plotly is loaded before attempting to use its methods
- **Note**: The `loadData()` method already has proper async waiting for Plotly (lines 124-125), but the watcher needs the guard as well
- **Result**: ✅ Circle plot component handles prop changes gracefully even before Plotly is fully loaded

**Documentation Enhancement:** Comprehensive README.md (2025-11-09):
- **Created**: Complete README.md with project overview and feature descriptions
- **Content includes**:
  - Project introduction and overview
  - Categorized list of all applications (Music, Chess, Rubik's Cube, ML, Math, Tools)
  - Brief description and route path for each page
  - Development setup instructions
  - Environment variables documentation
  - Project structure overview
  - Key technologies used
  - Build commands and coding style guidelines
  - Production deployment instructions
  - Browser compatibility notes
- **Purpose**: Help developers and users understand the project's capabilities and how to work with it

</details>


## 2026/05/13

<details>
<summary>midi-player Local MIDI Roll Replacement (2026-05-13)</summary>

**Issue:** `@k-l-lambda/music-widgets` newer versions removed the exported `MidiRoll` Vue component, so `app/views/midi-player.vue` could no longer import it from the package.

**Fix Applied:**
- Replaced the package `MidiRoll` import with a local `MidiRoll` component inside `app/views/midi-player.vue`.
- Ported the old MIDI roll behavior from `~/work/music-widgets/source/views/midi-roll.vue`:
  - SVG piano roll rendering from `player.notation`.
  - Progress highlighting and active note status.
  - Click-to-seek and mouse wheel horizontal scrolling.
  - Pitch/time grid and scale labels.
- Kept `MIDI`, `MidiPlayer`, and `MidiAudio` imported from `@k-l-lambda/music-widgets`.

**Validation:**
- `./node_modules/.bin/eslint app --ext .ts,.vue` completed with existing warnings only.
- `./node_modules/.bin/vite build` completed successfully.
- `yarn` was unavailable in the local shell, so validation used local package binaries directly.

**Follow-up Audio Warmup Fix:**
- Mirrored Starry's MIDI playback warmup flow: before playing, call `MidiAudio.WebAudio.needsWarmup?.()` and await `MidiAudio.WebAudio.awaitWarmup?.()` when needed.
- `togglePlayer()` now routes playback through async `playMidi()`, while preserving the existing `setTimeout`-based `nextFrame` scheduler.
- Verified with `./node_modules/.bin/eslint app/views/midi-player.vue` and `./node_modules/.bin/vite build`.

**Follow-up Playback Scheduling Fix:**
- Passed an explicit `nextFrame` option to `MidiPlayer.play()` from `app/views/midi-player.vue`.
- The supplied scheduler uses `setTimeout` instead of the player's internal `requestAnimationFrame` default.
- Verified with `./node_modules/.bin/eslint app/views/midi-player.vue` and `./node_modules/.bin/vite build`.

**Follow-up CSS Fix:**
- Vue 3 scoped CSS no longer matched SVG nodes rendered inside the local child `MidiRoll` component.
- Converted MIDI roll SVG selectors to `:deep(...)` so scale text, grid lines, progress line, and note styles apply correctly again.
- Verified with `./node_modules/.bin/eslint app/views/midi-player.vue` and `./node_modules/.bin/vite build`.

**Result:** ✅ MIDI player no longer depends on the removed `MidiRoll` export and builds against the updated `music-widgets` package.

</details>

<details>
<summary>chess-lab chessboardjs Loading Fix (2026-05-13)</summary>

**Issue:** Opening `app/views/chess-lab.vue` could fail with `require is not defined` after the Vite migration.

**Root Cause:** The page used dynamic `import()` to execute `@chrisoakman/chessboardjs/dist/chessboard-1.0.0.js`. That package is a browser-global UMD script, and Vite module transformation could expose its CommonJS `require` path at runtime.

**Fix Applied:**
- Added `loadScript()` and `loadChessboard()` helpers in `app/views/chess-lab.vue`.
- Changed chessboardjs loading from direct dynamic execution import to `?url` import plus a `<script>` tag, matching the existing Plotly loading pattern.
- Kept `window.Chessboard` as the runtime API expected by the existing code.

**Validation:**
- `./node_modules/.bin/eslint app/views/chess-lab.vue` completed with one existing unused `reactive` warning.
- `./node_modules/.bin/vite build` completed successfully.

**Follow-up ECharts Removal:**
- Replaced `app/components/chart.vue` with a lightweight SVG chart tailored to the chess-lab winrate chart.
- The new component draws a point-and-line chart from `sourceData.data.rows`, supports the current x-axis mark line, resizes via `getVChart().resize()`, and emits a compatible `sourceData.events.click` payload with `componentType: "series"` and `value: [x, y]`.
- Removed all runtime ECharts imports from app code, avoiding both CommonJS `require` and UMD `this` binding issues under Vite.
- Verified with `./node_modules/.bin/eslint app/components/chart.vue app/views/chess-lab.vue`; only the existing unused `reactive` warning remains.

**Follow-up ECharts Import Fix:**
- Browser stack identified the remaining error as `/node_modules/echarts/index.js`, whose line 21 calls CommonJS `require("./lib/echarts")`.
- Changed `app/components/chart.vue` from `import * as echarts from "echarts"` to `import * as echarts from "echarts/dist/echarts.js"` so Vite loads ECharts' browser build instead of the CommonJS index.
- Verified with `./node_modules/.bin/eslint app/components/chart.vue app/views/chess-lab.vue app/chessEngines.ts` and `./node_modules/.bin/vite build`.

**Follow-up:**
- The error persisted after changing chessboardjs alone, so `jquery` dynamic import was also replaced with `?url` plus `<script>` loading.
- Stockfish worker construction was changed from `new Worker("chess/engines/stockfish.js")` to a Vite-resolved classic worker URL via `new URL("../public/chess/engines/stockfish.js", import.meta.url)`.
- Rebuilt output now leaves only lodash's guarded `module.require` feature-detection branch inside the chess-lab chunk.
- Verified with `./node_modules/.bin/eslint app/views/chess-lab.vue app/chessEngines.ts` and `./node_modules/.bin/vite build`.

**Result:** ✅ chessboardjs now loads as a browser script without Vite executing it as an ESM/CommonJS module.

</details>




**Issue:** When deployed to GitHub Pages at `/studio/` path, app cover images failed to load on the home page.

**Root Cause Analysis:**
- Original code in `app/home.vue` used dynamic imports with template strings:
  ```javascript
  await import(`./assets/app-covers/${this.cover}`)
  ```
- This pattern cannot be statically analyzed by Vite during build time
- Build output:
  - Source: `app/assets/app-covers/chess-lab.png`
  - Built: `docs/assets/chess-lab-DbVYFQKW.png` (with hash, **no `app-covers/` subdirectory**)
  - Runtime attempted: `./assets/app-covers/chess-lab.png` ❌ (path doesn't exist)
- Even with `base: "./"`configuration, the dynamic import path remained incorrect because Vite couldn't transform it

**Fix Applied in `app/home.vue`:**
1. **Replaced dynamic imports with Vite's glob import** (line 52-53):
   ```javascript
   const coverImages = import.meta.glob('./assets/app-covers/*', {eager: true, import: 'default'});
   ```
   - This tells Vite to import all files matching the pattern at build time
   - `eager: true` loads them immediately instead of lazy loading
   - `import: 'default'` extracts the default export (the asset URL)

2. **Updated `App.load()` method** (line 66-70):
   ```javascript
   async load () {
       const imagePath = `./assets/app-covers/${this.cover}`;
       this.coverURL = coverImages[imagePath];
   }
   ```
   - Now looks up the preloaded image from the `coverImages` object
   - Vite transforms this correctly during build, mapping to actual hashed filenames

3. **Removed duplicate image loading code** (line 151-164):
   - Deleted redundant `apps.forEach()` loop in `created()` hook that was trying to load images again

**Technical Details:**
- Vite's `import.meta.glob()` generates a mapping at build time of all matched files
- Each file path is transformed to its final hashed name in the build output
- The glob pattern is analyzed statically, so Vite knows exactly which files to include
- Works correctly with both `base: "./"` (relative) and `base: "/studio/"` (absolute) configurations

**Result:** ✅ App cover images now load correctly when deployed to any path (root or subdirectory)
- No changes needed to `vite.config.mjs` base path setting
- Compatible with GitHub Pages deployment at `/studio/`
- Maintains relative path benefits for flexible deployment

</details>

<details>
<summary>GitHub Pages Deployment Fix - Jekyll and Dynamic Imports (2025-12-23)</summary>

**Issue:** Two 404 errors when deployed to GitHub Pages at `/klstudio/` path:
1. `_commonjsHelpers-DM6icglO.js net::ERR_ABORTED 404`
2. `Failed to fetch dynamically imported module: globe-cube3-xdm44WXH.js`

**Root Cause Analysis:**

**Problem 1: Jekyll ignoring underscore files** (PRIMARY ISSUE)
- GitHub Pages uses Jekyll by default
- Jekyll ignores files and directories starting with underscore `_`
- The `_commonjsHelpers-DM6icglO.js` file was being skipped during Jekyll processing
- File existed in git but returned 404 from GitHub Pages

**Problem 2: Dynamic imports using relative paths**
- Vite's `base` config doesn't affect dynamically generated import paths in built JS chunks
- Built code contained: `import("./chess-lab-xxx.js")` instead of `import("/klstudio/assets/chess-lab-xxx.js")`

**Fixes Applied:**

1. **Added .nojekyll file** (`public/.nojekyll`):
   - Empty file that tells GitHub Pages to skip Jekyll processing
   - Allows files starting with underscore to be served correctly
   - This was the key fix for the 404 errors

2. **Added VITE_BASE_PATH environment variable** (`.github/workflows/publish.yml`):
   ```yaml
   env:
     VITE_BASE_PATH: /klstudio/
   ```

3. **Created rewriteDynamicImports plugin** (`vite.config.mjs`):
   - Rewrites dynamic import paths from relative (`./`) to absolute (`/klstudio/assets/`)
   - Handles `import("./xxx")`, `from"./xxx"`, and `import"./xxx"` patterns

4. **Added experimental.renderBuiltUrl** (`vite.config.mjs`):
   - Ensures asset URLs use the correct base path during build

**Note:** Some intermediate attempts at fixing dynamic imports caused canvas rendering issues (silent failures without errors). The current configuration in the repo is the correct working version.

**Result:** ✅ All assets load correctly on GitHub Pages at `/klstudio/` path
- Underscore-prefixed files are served properly (via `.nojekyll`)
- Dynamic module imports work correctly
- Site fully functional at https://k-l-lambda.github.io/klstudio/

</details>

<details>
<summary>AI Controller Fix During Layer Clearing (2025-12-27)</summary>

> Why does AI playing suddenly stop during gameplay?

**Issue:** AI controller would suddenly stop playing/controlling the piece during gameplay, particularly after layer clearing events.

**Root Cause:** The AI controller's `update()` method didn't check for `isClearingAnimation` state. During layer clearing animation:
- The game's `currentPiece` is still the old locked piece
- AI would try to continue controlling/moving a piece that should be locked
- This caused unexpected behavior and interruptions

**Fix Applied in `AiController.ts:128`:**
```typescript
update(timestamp: number): void {
    if (!this.enabled || !this.targetState || !this.game.currentPiece) return;
    if (this.game.state.paused || this.game.state.gameOver) return;
    if (this.game.isClearingAnimation) return;  // Skip during layer clearing
    // ...
}
```

**Result:** ✅ AI now pauses control during layer clearing animation and resumes after new piece spawns

</details>

<details>
<summary>Add Cube Tetris Home Page Entry (2025-12-28)</summary>

**Added Cube Tetris as the first entry on the home page:**

1. **Cover image**: Copied and resized ChatGPT-generated image to 300x300 pixels
   - Source: `footages/ChatGPT Image Dec 28, 2025, 09_44_03 PM.png` (1024x1024, 1MB)
   - Destination: `app/assets/app-covers/cube-tetris.png` (300x300, 155KB)

2. **Home page entry** in `app/home.vue`:
   ```javascript
   {
       name: "Cube Tetris",
       _title: "Cube Tetris",
       path: "/cube-tetris",
       cover: "cube-tetris.png",
       description: `<p>A 3D Tetris game in a 4×4×20 cubic well. Features AI auto-play demo mode and camera-relative controls.</p>
   <p>Ported from the original <a href="https://github.com/nicholascc/CubeTetris" target="_blank">CubeTetris</a> game.</p>`,
   },
   ```

**Result:** ✅ Cube Tetris now appears as the first app on the K.L. Studio home page

</details>

**Next steps:**
- Test the built application in browser to verify Vue 3 compatibility and all features work correctly
- Verify `vue-class-component`/`vue-property-decorator` usage with Vue 3; upgrade or refactor components to options/composition API under compat mode
- Address remaining Vue compat warnings (e.g., `.sync` modifier → `v-model:propName`, `beforeDestroy` → `beforeUnmount`)


<details>
<summary>spiral-piano MIDI Playback Warmup Sync (2026-05-13)</summary>

**Issue:** The MIDI playback fixes applied to `midi-player.vue` also needed to apply to `app/views/spiral-piano.vue`.

**Fix Applied:**
- Added the same `setTimeout`-based `nextFrame` scheduler used by `midi-player.vue`.
- Added the same WebAudio warmup guard before playback:
  - `MidiAudio.WebAudio.needsWarmup?.()`
  - `MidiAudio.WebAudio.awaitWarmup?.()`
- Routed `onPlayFile()` through async `playMidi()` so playback waits for warmup before calling `player.play({nextFrame})`.

**Validation:**
- `./node_modules/.bin/eslint app/views/spiral-piano.vue` completed successfully.
- `./node_modules/.bin/vite build` completed successfully.

**Result:** ✅ `spiral-piano.vue` now uses the same warmed-up, timer-driven MIDI playback path as `midi-player.vue`.

</details>




> Use the same tetris types as the original game - each brick should consist of 4 cubes. The mesh geometry should also match the original, not assembled from small cubes. First implement the AI auto-play demo mode from CubeTetris for development testing, then add interactive input controls later. You can commit to git when there are milestones. Continuously improve the game's appearance to match the original game as shown in the reference screenshot.

<details>
<summary>Cube Tetris AI Demo Mode Implementation (2025-12-27)</summary>

**Changes Made:**

1. **Refactored `constants.ts`:**
   - Reduced from 15 piece definitions to 8 standard tetromino types (Brick4_0 through Brick4_7)
   - All pieces now have exactly 4 cubes as in the original CubeTetris
   - Includes both 2D flat shapes (I, L, T, O, S) and 3D shapes that extend into Z-axis

2. **Enhanced `TetrisRenderer.ts`:**
   - Created `createBeveledCubeGeometry()` function that generates cube mesh with beveled edges
   - Mimics the original cube0.mesh geometry with inner flat faces and angled edge bevels
   - Added auto-rotating camera support for demo/screensaver mode
   - Added `setAutoRotate(enabled, speed)` method to control camera rotation
   - Updated visual style: darker background (0x0a0a18), more visible boundary posts

3. **Created `AiController.ts`:**
   - Ported AI logic from original `AiController.lua`
   - Evaluates all 24 regular orientations (cube rotations) for each piece
   - Position scoring based on:
     - Height score (lower positions preferred)
     - Side faces count (fewer exposed faces = better)
     - Hole space (empty spaces beneath blocks = penalty)
   - Automatically moves and rotates pieces toward optimal position
   - Configurable move delay for AI speed control

4. **Updated `cube-tetris.vue`:**
   - Integrated AI controller with game loop
   - Added toggle button to switch between AI demo mode and manual play
   - Auto-restart game after game over in AI mode (2 second delay)
   - Controls hint only shown in manual mode
   - Camera auto-rotates in AI mode, user control in manual mode

**Technical Details:**
- AI evaluates all positions for each orientation, then selects from top 3 candidates (adds variety)
- Beveled cube geometry has 6 main faces + bevel quads + corner triangles
- Used `markRaw()` for Vue 3 compatibility with Three.js objects

**Commit:** `feat(cube-tetris): Add AI demo mode with beveled cube geometry`

**Result:** ✅ Game running with AI auto-play, auto-rotating camera, beveled cube visuals

</details>

<details>
<summary>Unified Piece Mesh Geometry (2025-12-27)</summary>

> The mesh is still assembled from small cubes. Note how F:\Documents\Works\Games\TanxGames\CubeTetris\Product\cube*.mesh.xml files define the geometry.

**Issue:** Initial implementation assembled pieces from individual cube meshes, creating visible seams between adjacent cubes within the same piece. Original CubeTetris uses unified meshes where each brick is a single geometry.

**Root Cause Analysis:**
- Analyzed original Ogre3D mesh files (cube0.mesh.xml, cube1.mesh.xml, cube2.mesh.xml)
- cube0: Single beveled cube with 6 submeshes (one per face)
- cube1, cube2: Multi-cube pieces where internal faces between adjacent cubes are removed
- Beveled edges only appear on exterior surfaces

**Solution:** Created `createUnifiedPieceGeometry()` function in `TetrisRenderer.ts`:

1. **Neighbor detection**: Build a set of block positions, check each cube's 6 neighbors
2. **Face culling**: Only render faces where there's no adjacent cube (exterior faces)
3. **Edge bevels**: Only add beveled edges on exterior surfaces
4. **Corner bevels**: Only add corner triangles when all 3 adjacent faces are exterior

**Changes Made:**

1. **TetrisRenderer.ts:**
   - Added `createUnifiedPieceGeometry(blocks[], cubeSize, bevel)` function
   - Uses `FaceDir` type and `FACE_NEIGHBORS` map for direction handling
   - Processes each block, determines exterior faces, generates appropriate geometry
   - Updated `updatePiece()` to create single unified mesh positioned at piece origin
   - Updated `updateGhost()` to use unified mesh for ghost preview
   - Proper geometry disposal on mesh cleanup

2. **TetrisPiece.ts:**
   - Added `getLocalBlocks()` method to return block positions relative to piece origin
   - Used by renderer to generate unified geometry in local space

**Technical Details:**
- Geometry is generated dynamically for each piece shape/rotation
- Internal faces (where cubes touch) are completely removed
- Beveled edges follow the same rules as the original mesh files
- Single mesh per piece reduces draw calls and looks correct

**Commit:** `feat(cube-tetris): Use unified piece mesh geometry`

**Result:** ✅ Pieces now render as single unified meshes matching original game style

</details>

<details>
<summary>Mesh Geometry Parameters Fix (2025-12-27)</summary>

> 你确定你这个mesh跟我原方案是一样的吗？ (Are you sure your mesh matches my original design?)

**Issue:** The beveled cube geometry parameters did not match the original CubeTetris mesh files.

**Root Cause Analysis:**
Analyzed original `cube0.mesh.xml` vertex positions:
- Inner flat area: ±0.411447
- Bevel outer edge: ±0.455892
- Face position: ±0.501482 (cube half-size)
- Bevel normals: 0.716035/0.698065 (not 0.707/0.707)
- NO corner bevel triangles in original mesh

**Changes Made in `TetrisRenderer.ts`:**

1. **Updated geometry parameters:**
   - `cubeSize`: 0.95 → 1.003 (matches original)
   - `inner`: s × 0.82 (≈0.411, matches original 0.411447)
   - `outer`: s × 0.91 (≈0.456, matches original 0.455892)

2. **Updated all bevel normal values:**
   - Changed from 0.707 to 0.716/0.698 to match original mesh normals
   - Applied to all 6 face directions (+Y, -Y, +Z, -Z, +X, -X)

3. **Removed corner bevel triangles:**
   - Original mesh does not have corner triangle faces
   - Deleted `addCornerBevel()` function and all 8 corner calls
   - Removed unused `addTriangle()` helper function
   - Removed unused `isEdgeExterior()` function
   - Removed unused `bevel` parameter from function signature

4. **Updated all function calls:**
   - `createBeveledCubeGeometry()` now uses default 1.003 size
   - `createUnifiedPieceGeometry()` calls simplified to use defaults

**Technical Details:**
- Original mesh uses specific vertex ratios: inner=0.82×s, outer=0.91×s
- Bevel angle is ~44° (atan(0.698/0.716) ≈ 44.3°), not exactly 45°
- Each face has inner quad + 4 edge bevel strips, no corner triangles

**Result:** ✅ Mesh geometry now matches original CubeTetris exactly

</details>

<details>
<summary>Face Winding Order Fix (2025-12-27)</summary>

> 再截屏一次，方块上表面镂空了 (Take another screenshot, the top surface of blocks is hollow)

**Issue:** Top faces (+Y) of cubes were not rendering, making blocks appear hollow when viewed from above.

**Root Cause:**
- Three.js uses counter-clockwise (CCW) vertex winding for front faces by default
- The +Y and -Y face vertices were in clockwise (CW) order
- This caused the faces to be back-face culled (not rendered)

**Fix Applied in `TetrisRenderer.ts`:**

1. **Reversed +Y face vertex order:**
   ```typescript
   // Before (CW - wrong):
   [ox - inner, oy + s, oz - inner], [ox + inner, oy + s, oz - inner],
   [ox + inner, oy + s, oz + inner], [ox - inner, oy + s, oz + inner]

   // After (CCW - correct):
   [ox - inner, oy + s, oz + inner], [ox + inner, oy + s, oz + inner],
   [ox + inner, oy + s, oz - inner], [ox - inner, oy + s, oz - inner]
   ```

2. **Reversed -Y face vertex order:**
   - Similar fix applied to bottom face

3. **Updated all +Y/-Y bevel edge vertex orders** to match new inner quad winding

**Result:** ✅ All cube faces now render correctly - no more hollow/transparent tops

</details>

<details>
<summary>Camera Height Following (2025-12-27)</summary>

> 让摄像机位置跟随池内高度，检查原版逻辑，实现类似功能 (Make camera position follow the pool height, check original logic and implement similar feature)

**Analysis of Original CubeTetris:**

From `TetrisPool.lua`:
```lua
function TetrisPool:idealCameraHeight()
    local height = self.Heap:maxY() * s_GridYSize + 2
    if self.FocusBrick then
        local bricky = self.FocusBrick:get():getMainBody():get():getPosition().y
        if height < bricky - 12 then height = bricky - 12 end
        if height > bricky + 10 then height = bricky + 10 end
    end
    height = math.min(height, self.TopHeight)
    height = math.max(height, 16)
    return height
end
```

Smooth movement in update:
```lua
local delta = iif(differ > 0, elapsed, -elapsed) * math.max(0.6, math.abs(differ) * 0.8)
```

**Implementation in `TetrisRenderer.ts`:**

1. **Added tracking properties:**
   - `heapMaxY`: Maximum Y of the heap
   - `currentPieceY`: Y position of current piece
   - `cameraTargetHeight`: Current target height for camera orbit
   - `lastFrameTime`: For calculating elapsed time

2. **Added `idealCameraHeight()` method:**
   - Base height = heapMaxY + 2
   - Constrain to piece range: [pieceY - 12, pieceY + 10]
   - Clamp to [minHeight, maxHeight]

3. **Added `updateCameraHeight(elapsed)` method:**
   - Calculate smooth delta movement
   - Speed scales with distance: max(0.6, |differ| × 0.8)
   - Snap to ideal if would overshoot

4. **Modified `render()` method:**
   - Calculate elapsed time from frame timestamps
   - Call `updateCameraHeight()` each frame
   - Update `boardCenter.y` and camera position accordingly

5. **Updated `cube-tetris.vue`:**
   - Call `setHeapMaxY()` with board bounds after updateBoard
   - Call `setCurrentPieceY()` with piece bounds after updatePiece

**Result:** ✅ Camera smoothly follows heap height, keeping gameplay visible as blocks pile up

</details>

<details>
<summary>Layer Clearing Animation Effect (2025-12-27)</summary>

> 消层的特效加一下，参考原作 (Add layer clearing effects, reference original)

**Analysis of Original CubeTetris:**

From `TetrisPool.lua`:
```lua
-- CleaningCubes array stores blocks being cleared with 0.4s animation
table.insert(self.CleaningCubes, {body = ..., remain = 0.4})

-- Animation update: flash material every 0.08s
local odd = (math.floor(cube.remain / 0.08) % 2) > 0
cube.body:get():getObject():setMaterialName(iif(odd, "Cleaning/0", "Cleaning/1"))
```

**Implementation:**

1. **TetrisRenderer.ts - Added clearing animation system:**
   - New properties: `clearingBlocks` Map, `clearingGroup`, `CLEAR_DURATION = 0.4`, `FLASH_INTERVAL = 0.08`
   - `startClearingAnimation(blocks)`: Creates meshes for blocks being cleared, stores with `remain` timer
   - `updateClearingAnimation(elapsed)`: Updates flash effect (alternates between white glow and original color every 80ms), removes blocks when animation completes
   - `isClearingAnimation()`: Returns true if animation is in progress

2. **TetrisGame.ts - Added animated layer clearing flow:**
   - New event type: `layersClearStart`
   - New state: `_clearingLayers`, `_isClearingAnimation`
   - `lockPiece()` now detects full layers but delays removal, emits `layersClearStart` with block positions/colors
   - `completeClearingAnimation()`: Called when animation finishes, removes layers and updates score
   - Game pauses during clearing animation

3. **cube-tetris.vue - Wired up animation:**
   - Listens to `layersClearStart` event, calls `renderer.startClearingAnimation(blocks)`
   - Render loop checks when renderer animation completes, calls `game.completeClearingAnimation()`

**Bug Fix:**
- Initial implementation had blocks repeatedly resetting `remain` to 0.4 (animation stuck)
- Root cause: `startClearingAnimation` was being called multiple times for same blocks
- Fix: Added duplicate check `if (this.clearingBlocks.has(key)) continue;`

**Result:** ✅ Blocks flash white/original color for 0.4 seconds before being cleared, matching original game behavior

</details>

<details>
<summary>Camera-Relative Movement Controls (2025-12-27)</summary>

> In non-AI mode, let movement always be defined by current camera view direction.

**Issue:** Movement controls (WASD) were using fixed world directions, which became confusing when the camera was rotated to different viewing angles.

**Implementation in `cube-tetris.vue`:**

1. **Added `moveCameraRelative(direction)` method:**
   - Gets camera position and board center from renderer
   - Calculates camera-to-center angle using `atan2(dz, dx)`
   - Divides into 4 quadrants (45° each) to determine viewing direction
   - Maps input direction (forward/backward/left/right) to world movement

2. **Quadrant mappings:**
   ```
   315-45°:  Camera looking toward +X
   45-135°:  Camera looking toward +Z
   135-225°: Camera looking toward -X
   225-315°: Camera looking toward -Z
   ```

3. **Added `getBoardCenter()` method to TetrisRenderer.ts**

**Bug Fix - All Quadrants Left/Right:**

Initial implementation had left/right swapped in +X and -X quadrants. The correct mapping uses counter-clockwise rotation (viewed from above) to determine left:
- Facing +X: left = -Z (moveForward), right = +Z (moveBackward)
- Facing +Z: left = +X (moveRight), right = -X (moveLeft)
- Facing -X: left = +Z (moveBackward), right = -Z (moveForward)
- Facing -Z: left = -X (moveLeft), right = +X (moveRight)

**Result:** ✅ Movement controls now intuitive regardless of camera rotation angle

</details>

<details>
<summary>Hard Drop Animation (2025-12-28)</summary>

> Make bricks fall over a period of time instead of instantly, reference original implementation.

**Issue:** Hard drop was instant (teleporting), unlike the original game which has pieces falling smoothly.

**Analysis of Original:**
- Original CubeTetris uses physics simulation (Havok) where pieces fall due to gravity
- Our implementation doesn't have physics, so we simulate falling animation

**Implementation:**

1. **Added `hardDropSpeed` config** (`constants.ts`):
   - 25 units per second for smooth falling animation

2. **Added drop animation state** (`TetrisGame.ts`):
   - `_isDropping`: boolean flag
   - `_dropTargetY`: final Y position
   - `_dropVisualY`: current visual Y during animation
   - `_lastDropAnimTime`: for elapsed time calculation

3. **Modified `hardDrop()` method**:
   - Calculates target position using ghost position
   - Moves piece to target immediately (for collision)
   - Starts visual animation from current Y to target Y
   - Emits `pieceDropping` event

4. **Added `updateDropAnimation()` method**:
   - Animates `_dropVisualY` toward `_dropTargetY` at configured speed
   - Locks piece when animation completes

5. **Updated `TetrisRenderer.updatePiece()`**:
   - Added optional `visualY` parameter for animation override

6. **Updated Vue component**:
   - `updateVisuals()` passes `game.dropVisualY` during animation
   - Hides ghost piece during drop
   - Render loop calls `updateVisuals()` during drop
   - Camera tracking uses visual Y during drop

7. **AI Controller skip during drop**:
   - Added `if (this.game.isDropping) return;` check

**Result:** ✅ Pieces now fall smoothly at 25 units/second instead of teleporting

</details>

<details>
<summary>Geometry Caching by Rotation (2025-12-28)</summary>

> Fix piece/ghost alignment bug introduced when using mesh.rotation for piece rendering.

**Issue:** After attempting to optimize by using only 8 base geometries with mesh.rotation for different orientations, the piece and ghost positions became misaligned.

**Root Cause:** Three.js Euler angles (`mesh.rotation.set()`) don't compose the same way as `CubeGrid.rotate()` which applies sequential 90° rotations around the origin with specific formulas per axis.

**Fix Applied:**
1. Changed geometry caching from `piece.definition.name` (8 types) to `geometryCacheKey(localBlocks)` which caches by actual rotated block positions
2. Removed `mesh.rotation` usage - geometry is created directly from `localBlocks` which are already rotated by `CubeGrid.rotate()`
3. Simplified positioning - mesh placed directly at piece position without offset calculations

**Result:** ✅ Piece and ghost now use identical geometry and positioning, ensuring perfect alignment

</details>

<details>
<summary>Preserve Block Geometry When Locking (2025-12-28)</summary>

> Create geometry with 4 separate parts for each brick so blocks can be easily split apart and managed individually when locked into the heap.

**Implementation:**

1. **Added `faceMask` to BlockData type** (`types.ts`):
   - Bitmask indicating which faces are exposed (no neighbor within piece)
   - Bits: +x=1, -x=2, +y=4, -y=8, +z=16, -z=32

2. **Added `FACE_MASK` constants** (`constants.ts`):
   - Named constants for each face direction
   - `FACE_MASK.ALL = 63` for isolated cubes

3. **Updated `TetrisPiece.getWorldBlocks()`** (`TetrisPiece.ts`):
   - Calculates `faceMask` for each block based on neighbors within the piece
   - Internal faces (where blocks touch within piece) are marked as hidden

4. **Added `createBlockGeometryFromMask()`** (`TetrisRenderer.ts`):
   - Generates single-block geometry with only specified faces exposed
   - Reuses same bevel edge logic as unified piece geometry
   - Cached by `faceMask` (up to 64 variants possible)

5. **Updated board rendering**:
   - `updateBoard()` uses stored `faceMask` for each block
   - `startClearingAnimation()` also uses `faceMask` for consistency
   - All use `blockGeometryCache` for efficient reuse

**Result:** ✅ When pieces lock into heap, each block retains its original mesh appearance (internal faces remain hidden), matching original CubeTetris behavior

</details>

<details>
<summary>Fix Diamond-Shaped Gaps at Block Connections (2025-12-28)</summary>

> Note there are diamond-shaped small gaps at cube connection points.

**Issue:** Small diamond-shaped gaps appeared at corners where adjacent blocks meet in the heap.

**Root Cause:** In `createBlockGeometryFromMask()`, when a face is exterior but a perpendicular face has a neighbor:
- The inner flat area extended to `sExt` (overlapping with neighbor)
- But the bevel edge outer corners still used fixed `outer` values
- This created a mismatch at corners where the inner area extends beyond the bevel edge

**Fix Applied in `TetrisRenderer.ts`:**

1. **Added extended outer coordinates** (lines 88-95):
   ```typescript
   const outerExt = outer + 0.02;  // Extended outer to match sExt overlap
   const oxMin = exterior["-x"] ? outer : outerExt;
   const oxMax = exterior["+x"] ? outer : outerExt;
   const oyMin = exterior["-y"] ? outer : outerExt;
   const oyMax = exterior["+y"] ? outer : outerExt;
   const ozMin = exterior["-z"] ? outer : outerExt;
   const ozMax = exterior["+z"] ? outer : outerExt;
   ```

2. **Updated all bevel edge outer corners** to use `oxMin/oxMax`, `oyMin/oyMax`, `ozMin/ozMax` instead of fixed `outer` values

**Technical Details:**
- When a perpendicular face has a neighbor, both the inner flat area AND the bevel edge outer corners extend to ensure overlap
- This eliminates the diamond-shaped gaps at corners where blocks meet
- The fix applies to all 6 face directions and their bevel edges

**Result:** ✅ Blocks now connect seamlessly without diamond-shaped gaps at corners

</details>

<details>
<summary>Heap-Aware FaceMask Update (2025-12-28)</summary>

> Fix seams between adjacent blocks from different pieces. Overlapping faces cause Z-fighting flickering.

**Issue:** When blocks from different pieces were adjacent in the heap, they both rendered their shared face because faceMask was only calculated based on neighbors within the original piece, not heap neighbors. This caused visible seams and Z-fighting flickering.

**Root Cause Analysis:**
- `TetrisPiece.getWorldBlocks()` calculates faceMask based on neighbors within the same piece only
- When pieces lock into the heap, adjacent blocks from different pieces don't know about each other
- Both blocks render their shared face, causing overlap and Z-fighting

**Solution:** Update faceMask when blocks lock into the heap, considering ALL neighbors (not just piece-internal).

**Changes in `TetrisGame.ts:lockPiece()`:**
1. After adding new blocks to the board, iterate through each new block
2. For each new block, check all 6 directions for existing neighbors in the heap
3. If a neighbor exists:
   - Hide the corresponding face on the new block (remove bit from faceMask)
   - Hide the opposite face on the existing neighbor (update neighbor's faceMask)

**Code Added:**
```typescript
// Face direction mappings: direction -> {mask, opposite mask, offset}
const faceDirections: Array<{mask: number; oppositeMask: number; dx: number; dy: number; dz: number}> = [
    {mask: FACE_MASK.POS_X, oppositeMask: FACE_MASK.NEG_X, dx: 1, dy: 0, dz: 0},
    {mask: FACE_MASK.NEG_X, oppositeMask: FACE_MASK.POS_X, dx: -1, dy: 0, dz: 0},
    // ... (all 6 directions)
];

// Update faceMasks based on heap neighbors
for (const {point, data} of newBlocks) {
    let faceMask = data.faceMask ?? FACE_MASK.ALL;
    for (const dir of faceDirections) {
        const neighbor = this.board.get(point.x + dir.dx, point.y + dir.dy, point.z + dir.dz);
        if (neighbor) {
            faceMask &= ~dir.mask;  // Hide this face
            neighbor.faceMask = (neighbor.faceMask ?? FACE_MASK.ALL) & ~dir.oppositeMask;  // Hide neighbor's opposite face
        }
    }
    data.faceMask = faceMask;
}
```

**Also Created:** `cube-tetris-test.vue` - Test page for debugging block mesh geometry with interactive faceMask controls.

**Result:** ✅ Blocks from different pieces now connect seamlessly without seams or Z-fighting

</details>

<details>
<summary>Fix Corner Gaps Between Adjacent Blocks (2025-12-28)</summary>

> Fix remaining diamond-shaped gaps at block corners where bevel edges meet flat extensions.

**Issue:** Even with faceMask-based face hiding, small diamond-shaped gaps appeared at corners where adjacent blocks met. The gaps were visible where bevel edges and flat extension strips didn't properly meet.

**Root Cause Analysis:**
- When a face is hidden (neighbor exists), bevel edges are not rendered
- The flat area extends to `inner` (~0.411) but needs to extend to the grid midpoint
- Bevel outer corners used fixed `outer` (~0.456) values that didn't match flat extension
- Adjacent blocks at positions 0 and 1 need to meet exactly at x=0.5

**Solution:** Set `sExt = 0.5` (exactly half the grid spacing) so adjacent blocks meet edge-to-edge without gaps.

**Changes in `TetrisRenderer.ts:createBlockGeometryFromMask()`:**

1. **Changed `sExt` to exact grid midpoint:**
   ```typescript
   const sExt = 0.5;  // Extend exactly to half the grid spacing (0.5) when meeting neighbor
   ```

2. **Extended bevel outer corners to match:**
   ```typescript
   const oxMin = exterior["-x"] ? outer : sExt;
   const oxMax = exterior["+x"] ? outer : sExt;
   const oyMin = exterior["-y"] ? outer : sExt;
   const oyMax = exterior["+y"] ? outer : sExt;
   const ozMin = exterior["-z"] ? outer : sExt;
   const ozMax = exterior["+z"] ? outer : sExt;
   ```

3. **Added flat extension strips for all 6 faces:**
   - When a perpendicular face has a neighbor, replace bevel edge with flat strip
   - Example for +Y face when +X neighbor exists:
   ```typescript
   if (exterior["+x"]) {
       // Bevel edge
       addFace([inner, s, -zMin], [inner, s, zMax],
           [outer, outer, ozMax], [outer, outer, -ozMin],
           [0.716, 0.698, 0]);
   } else {
       // Flat extension strip when +X neighbor exists
       addFace([inner, s, -zMin], [inner, s, zMax],
           [sExt, s, zMax], [sExt, s, -zMin],
           [0, 1, 0]);
   }
   ```

**Technical Details:**
- Block at position 0 extends its +X face to x=0.5
- Block at position 1 extends its -X face to x=0.5
- Both blocks meet exactly at the midpoint with no gap or overlap
- Same logic applies to all 6 face directions

**Result:** ✅ Adjacent blocks now connect perfectly without any gaps or seams at corners

</details>

<details>
<summary>Remove Automatic Heap Neighbor Face Merging (2025-12-28)</summary>

> Why are landed blocks automatically joining at their contact faces? This behavior is incorrect!

**Issue:** When pieces landed and locked into the heap, blocks from different pieces were visually merging at their contact faces, hiding shared faces between adjacent blocks.

**Root Cause:** The `lockPiece()` function in `TetrisGame.ts` was updating faceMasks for ALL adjacent neighbors in the heap, not just neighbors within the same piece. This caused blocks from different pieces to hide their shared faces.

**Fix Applied in `TetrisGame.ts:lockPiece()`:**

Removed the heap-neighbor faceMask update code. Now blocks from different pieces maintain their individual geometry/appearance:

```typescript
private lockPiece(): void {
    if (!this._currentPiece) return;

    // Get blocks from piece with their piece-internal faceMask
    // (faceMask already handles same-piece adjacency from getWorldBlocks())
    const newBlocks = this._currentPiece.getWorldBlocks();

    // Add all blocks to the board with their piece-internal faceMasks intact
    // Blocks from different pieces keep their individual geometry/appearance
    for (const {point, data} of newBlocks) {
        this.board.set(point.x, point.y, point.z, data);
    }
    // ... rest of function
}
```

Also removed the unused `FACE_MASK` import from constants.

**Result:** ✅ Blocks from different pieces no longer merge visually - each piece retains its distinct appearance in the heap

</details>

<details>
<summary>Fix Unified Piece Geometry Based on Original Mesh Files (2025-12-28)</summary>

> Can you just reference the original implementation instead of guessing randomly?

**Issue:** Previous fix attempt caused Z-fighting flickering and overlapping geometry in complex 3D pieces like Brick4_7.

**Root Cause:** Incorrect approach of using fixed `inner` bounds for all inner flat areas, then adding separate extension strips. This created overlapping geometry where extension strips overlapped with the inner quad.

**Solution Based on Original Mesh Analysis:**
Analyzed original CubeTetris mesh files (`cube1.mesh.xml`, `cube2.mesh.xml`) to understand proper geometry construction:
- Key insight: Inner flat area directly extends to `s` when perpendicular face has neighbor
- No separate extension strips needed - the inner quad itself extends to meet neighbors
- Bevel edges only appear when perpendicular face is EXTERIOR

**Fix Applied in `TetrisRenderer.ts:createUnifiedPieceGeometry()` and `cube-tetris-test.vue`:**

Changed from (WRONG):
```typescript
const xMin = inner;
const xMax = inner;
const yMin = inner;
const yMax = inner;
const zMin = inner;
const zMax = inner;
```

To (CORRECT - matching original mesh):
```typescript
// Inner flat area extends to 's' when perpendicular face has neighbor (like original mesh)
// This eliminates the need for separate extension strips
const xMin = exterior["-x"] ? inner : s;
const xMax = exterior["+x"] ? inner : s;
const yMin = exterior["-y"] ? inner : s;
const yMax = exterior["+y"] ? inner : s;
const zMin = exterior["-z"] ? inner : s;
const zMax = exterior["+z"] ? inner : s;
```

**Result:** ✅ Brick4_7 and other complex 3D pieces now render with seamless connections, no gaps or Z-fighting

</details>

<details>
<summary>Fix Inner Corner Gaps in Unified Piece Geometry (2025-12-28)</summary>

> Now there's still a gap at the inner corners of the blocks (within the falling piece)

**Issue:** Inner corners of falling pieces showed small gaps where bevel edges meet, even with `createBlockGeometryFromMask()` fixed.

**Root Cause:** The `createUnifiedPieceGeometry()` function (used for falling pieces) only rendered bevel edges when both the main face AND perpendicular face were exterior. When a perpendicular face had a neighbor within the piece, no geometry was rendered for that edge, leaving a gap.

**Fix Applied in `TetrisRenderer.ts:createUnifiedPieceGeometry()`:**

Added `else` branches with flat extension strips for all 6 faces. When a perpendicular face has a neighbor, instead of a bevel edge, add a flat strip extending from `inner` to `s`:

```typescript
// Example for +Y face when +X neighbor exists
if (exterior["+x"]) {
    // Bevel edge
    addFace([ox + inner, oy + s, oz - zMin], [ox + inner, oy + s, oz + zMax],
        [ox + outer, oy + outer, oz + ozMax], [ox + outer, oy + outer, oz - ozMin],
        [0.716, 0.698, 0]);
} else {
    // Flat extension strip when +X neighbor exists
    addFace([ox + inner, oy + s, oz - zMin], [ox + inner, oy + s, oz + zMax],
        [ox + s, oy + s, oz + zMax], [ox + s, oy + s, oz - zMin],
        [0, 1, 0]);
}
```

**Faces Updated:**
- +Y face: Added else branches for ±X, ±Z directions
- -Y face: Added else branches for ±X, ±Z directions
- +Z face: Added else branches for ±X, ±Y directions
- -Z face: Added else branches for ±X, ±Y directions
- +X face: Added else branches for ±Y, ±Z directions
- -X face: Added else branches for ±Y, ±Z directions

**Result:** ✅ Falling pieces now render with seamless inner corners matching the original CubeTetris mesh geometry

</details>

<details>
<summary>Fix sExt Consistency Between Geometry Functions (2025-12-28)</summary>

> 修复app\cubeTetris\TetrisRenderer.ts，让他们保持一致

**Issue:** The two geometry functions `createBlockGeometryFromMask()` and `createUnifiedPieceGeometry()` used different values for neighbor extension coordinates, causing subtle inconsistencies in block geometry.

**Root Cause:**
- `createBlockGeometryFromMask()` used `sExt = 0.5` (exact grid midpoint)
- `createUnifiedPieceGeometry()` used `s ≈ 0.5015` (half cube size from cubeSize=1.003)
- This caused blocks to not meet exactly at the grid midpoint when adjacent

**Fix Applied in `TetrisRenderer.ts:createUnifiedPieceGeometry()`:**

1. **Added `sExt` constant** (line 636):
   ```typescript
   const sExt = 0.5;  // Extend exactly to half the grid spacing (0.5) when meeting neighbor
   ```

2. **Updated inner extension variables** to use `sExt` instead of `s`:
   ```typescript
   const xMin = exterior["-x"] ? inner : sExt;
   const xMax = exterior["+x"] ? inner : sExt;
   const yMin = exterior["-y"] ? inner : sExt;
   const yMax = exterior["+y"] ? inner : sExt;
   const zMin = exterior["-z"] ? inner : sExt;
   const zMax = exterior["+z"] ? inner : sExt;
   ```

3. **Updated outer bevel corner extensions** to use `sExt`:
   ```typescript
   const oxMin = exterior["-x"] ? outer : sExt;
   const oxMax = exterior["+x"] ? outer : sExt;
   const oyMin = exterior["-y"] ? outer : sExt;
   const oyMax = exterior["+y"] ? outer : sExt;
   const ozMin = exterior["-z"] ? outer : sExt;
   const ozMax = exterior["+z"] ? outer : sExt;
   ```

4. **Fixed all else branches** in all 6 faces (-Y, +Z, -Z, +X, -X) to use `sExt` instead of `s` for flat extension strips

**Technical Details:**
- Face position: `s ≈ 0.5015` (from cubeSize=1.003, used for face surface)
- Extension to neighbors: `sExt = 0.5` (exact grid midpoint, ensures blocks meet exactly)
- Blocks at grid positions 0 and 1 now meet exactly at x/y/z = 0.5

**Result:** ✅ Both geometry functions now use consistent `sExt = 0.5` for neighbor extensions, ensuring unified pieces and locked blocks have identical geometry at connection points

</details>

<details>
<summary>Remove Corner Triangles to Match Original Mesh (2025-12-28)</summary>

> 仍然存在大量重叠和缺口，你确定你的实现与cube*.mesh.xml完全一致吗？ (There are still many overlaps and gaps, are you sure your implementation is exactly consistent with cube*.mesh.xml?)

**Issue:** Despite previous fixes, there were still overlapping geometry and gaps in the rendered blocks.

**Root Cause Analysis from Original Mesh Files:**
Analyzed `cube0.mesh.xml` structure in detail:
- Each face has exactly 10 triangles (1 inner quad = 2 triangles + 4 bevel strips = 8 triangles)
- 6 faces × 10 triangles = 60 total triangles per isolated cube
- **NO corner triangles** in the original mesh
- Bevel strips share vertices at corners, naturally filling the gaps without additional geometry

My implementation incorrectly added corner triangles (8 corners × 3 triangles each = 24 extra triangles per cube), creating overlapping/duplicate geometry at corners.

**Fix Applied in `TetrisRenderer.ts`:**

1. **Removed `addTriangle` helper function** from `createUnifiedPieceGeometry()`:
   - Was defined at lines 534-540 with comment "for corners"
   - No longer needed since corner triangles are removed

2. **Removed `diagNorm` constant**:
   - `const diagNorm = 0.577` (1/√3) was only used for corner triangle normals
   - No longer needed

3. **Removed all corner triangle code from `createUnifiedPieceGeometry()`**:
   - Removed ~130 lines of code covering all 8 corner conditions
   - Each corner had 3 triangles checking `exterior["+x"] && exterior["+y"] && exterior["+z"]` etc.
   - Replaced with explanatory comment matching original mesh behavior

**Code Removed:**
```typescript
// Removed from createUnifiedPieceGeometry():

// Helper to add a triangle face (for corners)
const addTriangle = (v0: number[], v1: number[], v2: number[], normal: number[]) => { ... };

// Diagonal normal for corner triangles: 1/sqrt(3) ≈ 0.577
const diagNorm = 0.577;

// Corner (+x, +y, +z)
if (exterior["+x"] && exterior["+y"] && exterior["+z"]) {
    addTriangle(...);
    addTriangle(...);
    addTriangle(...);
}
// ... (all 8 corner conditions removed)
```

**Added Comment:**
```typescript
// Note: Original CubeTetris mesh does NOT have corner triangles.
// The bevel strips share vertices at corners, naturally filling the gaps.
// Adding corner triangles would create overlapping/duplicate geometry.
```

**Result:** ✅ Block geometry now matches original CubeTetris mesh exactly - no overlapping geometry at corners

</details>

<details>
<summary>Sync Test Page Geometry Code with Main Renderer (2025-12-28)</summary>

> 问题仍存在，你可以尝试在cube-tetris-test页面中放置一个gost brick，能清楚看到重叠和缺口问题

**Issue:** User reported overlaps/gaps still visible on the cube-tetris-test page even after the corner triangle fix.

**Root Cause:** The `cube-tetris-test.vue` file has its own duplicate copy of `createUnifiedPieceGeometry()` that was out of sync with the fixes in `TetrisRenderer.ts`. Specifically:
- `TetrisRenderer.ts` uses `sExt = 0.5` (exact grid midpoint) for extension coordinates
- `cube-tetris-test.vue` was using `s ≈ 0.5015` (half cube size from cubeSize=1.003)

This mismatch caused blocks to not meet exactly at grid midpoints, creating visible gaps.

**Fix Applied in `cube-tetris-test.vue:createUnifiedPieceGeometry()`:**

1. **Added `sExt` constant** (line 62):
   ```typescript
   const sExt = 0.5;  // Extend exactly to half the grid spacing (0.5) when meeting neighbor
   ```

2. **Updated inner extension variables** (lines 102-107):
   ```typescript
   const xMin = exterior["-x"] ? inner : sExt;
   const xMax = exterior["+x"] ? inner : sExt;
   const yMin = exterior["-y"] ? inner : sExt;
   const yMax = exterior["+y"] ? inner : sExt;
   const zMin = exterior["-z"] ? inner : sExt;
   const zMax = exterior["+z"] ? inner : sExt;
   ```

3. **Updated outer bevel corner extensions** (lines 109-114):
   ```typescript
   const oxMin = exterior["-x"] ? outer : sExt;
   const oxMax = exterior["+x"] ? outer : sExt;
   // ... (all 6 directions)
   ```

4. **Updated all flat extension strips** in else branches for all 6 faces to use `sExt` instead of `s`

**Technical Details:**
- `s = cubeSize / 2 ≈ 0.5015` (face surface position)
- `sExt = 0.5` (exact grid midpoint for neighbor connections)
- Adjacent blocks at positions 0 and 1 now meet exactly at x/y/z = 0.5

**Result:** ✅ Brick4_7 and other complex 3D pieces now render with seamless connections, no gaps at block connection points

</details>

<details>
<summary>Eliminate Diamond-Shaped Gaps at Block Connections (2025-12-28)</summary>

> Fix diamond-shaped gaps at cube connection points visible in ghost mesh.

**Issue:** Small diamond-shaped gaps appeared at corners where adjacent blocks meet, particularly visible in the ghost (semi-transparent) mesh due to overlapping geometry causing bright horizontal lines.

**Root Cause Analysis:**
- Inner quad used fixed `inner` bounds, and extension strips also overlapped the same area when perpendicular face had a neighbor
- Bevel edges and extension strips didn't extend properly into perpendicular directions to cover corners
- This left small diamond-shaped gaps at the intersections of edges

**Solution:** Added extended bounds variables (exMin, exMax, eyMin, eyMax, ezMin, ezMax) that extend bevel edges and extension strips in perpendicular directions when a perpendicular face has a neighbor.

**Changes in `TetrisRenderer.ts:createUnifiedPieceGeometry()` and `cube-tetris-test.vue`:**

1. **Added extended bounds variables** after inner bounds:
   ```typescript
   // Extended bounds for extension strips - extend to sExt when perpendicular face has neighbor
   // This ensures extension strips cover corners properly
   const exMin = exterior["-x"] ? inner : sExt;
   const exMax = exterior["+x"] ? inner : sExt;
   const eyMin = exterior["-y"] ? inner : sExt;
   const eyMax = exterior["+y"] ? inner : sExt;
   const ezMin = exterior["-z"] ? inner : sExt;
   const ezMax = exterior["+z"] ? inner : sExt;
   ```

2. **Updated all 6 face edge coordinates** to use extended bounds for perpendicular directions:
   - +Y face: ±X edges use `ezMin/ezMax` for z, ±Z edges use `exMin/exMax` for x
   - -Y face: Same pattern
   - +Z face: ±X edges use `eyMin/eyMax` for y, ±Y edges use `exMin/exMax` for x
   - -Z face: Same pattern
   - +X face: ±Y edges use `ezMin/ezMax` for z, ±Z edges use `eyMin/eyMax` for y
   - -X face: Same pattern

**Example for +Y face -X edge:**
```typescript
if (exterior["-x"]) {
    addFace(
        [ox - inner, oy + s, oz + ezMax], [ox - inner, oy + s, oz - ezMin],
        [ox - outer, oy + outer, oz - ozMin], [ox - outer, oy + outer, oz + ozMax],
        [-0.716, 0.698, 0]
    );
} else {
    addFace(
        [ox - inner, oy + s, oz + ezMax], [ox - inner, oy + s, oz - ezMin],
        [ox - sExt, oy + s, oz - ezMin], [ox - sExt, oy + s, oz + ezMax],
        [0, 1, 0]
    );
}
```

**Result:** ✅ All pieces now render with seamless connections - no diamond-shaped gaps at corners, no overlapping geometry causing bright lines in ghost mesh

</details>

<details>
<summary>Nine-Grid Geometry System Refactoring (2025-12-30)</summary>

> Redesign block geometry using a nine-grid (九宫格) system for proper corner handling.

**Issue:** Previous geometry code had many ad-hoc fixes for corner handling, leading to complex and hard-to-maintain code with potential edge cases.

**Solution:** Implemented a systematic nine-grid approach where each face is divided into 9 parts (3×3 grid):

```
┌────────┬────────┬────────┐
│ Corner │  Edge  │ Corner │
│(-A,-B) │  -B    │(+A,-B) │
├────────┼────────┼────────┤
│  Edge  │ Center │  Edge  │
│  -A    │(fixed) │  +A    │
├────────┼────────┼────────┤
│ Corner │  Edge  │ Corner │
│(-A,+B) │  +B    │(+A,+B) │
└────────┴────────┴────────┘
```

**Key Components:**

1. **Center quad**: Always fixed, flat face at `inner` bounds
2. **Edge strips**: Bevel (chamfer) when exterior, flat extension when neighbor exists
3. **Corner triangles**: Dynamic based on adjacent edge states:
   - Both edges exterior: Outer convex corner at `(outer, outer, outer)`
   - One edge has neighbor: Side extension
   - Both edges have neighbors: Inner concave corner (three-way junction)

**Implementation:**

1. **Created per-face geometry builders** (6 pairs of functions):
   - `buildFaceYPositive/buildCornerYPositive` for +Y face
   - `buildFaceYNegative/buildCornerYNegative` for -Y face
   - `buildFaceZPositive/buildCornerZPositive` for +Z face
   - `buildFaceZNegative/buildCornerZNegative` for -Z face
   - `buildFaceXPositive/buildCornerXPositive` for +X face
   - `buildFaceXNegative/buildCornerXNegative` for -X face

2. **Created inner face functions** (6 pairs for closing geometry):
   - `buildInnerFaceYPositive/buildInnerCornerYPositive`
   - `buildInnerFaceYNegative/buildInnerCornerYNegative`
   - `buildInnerFaceZPositive/buildInnerCornerZPositive`
   - `buildInnerFaceZNegative/buildInnerCornerZNegative`
   - `buildInnerFaceXPositive/buildInnerCornerXPositive`
   - `buildInnerFaceXNegative/buildInnerCornerXNegative`

3. **Dynamic d-point coordinates** for inner face corners:
   - Default (both perpendicular exterior): `d = (outer, outer, ext)`
   - One side has neighbor: `d = (inner, ext, ext)` or `(ext, inner, ext)`
   - Both sides have neighbors: `d = (outer, outer, outer)` (true 3D corner)

4. **Three-way junction corners** in `createUnifiedPieceGeometry`:
   - When all 3 perpendicular directions have neighbors, draw corners from ALL 3 inner faces
   - Point `a` moves from `(inner, inner, ext)` to `(outer, outer, ext)` for three-way junctions
   - These corners close the geometry at the `(outer, outer, outer)` position where exterior bevels meet

**Technical Details:**
- Each corner uses 2 triangles with computed normals
- Winding order determined by sign product of axis directions
- Normal direction enforced to face outward based on face direction
- `GeometryBuilder` class handles vertex/normal/index accumulation

**Result:** ✅ Systematic and maintainable geometry generation with proper corner handling for all configurations

</details>

<details>
<summary>DRY Refactoring: Canonical Axis Transform System (2025-12-30)</summary>

> 观察到很多逻辑都是重复了三个轴向，以及正负方向，它们之间的区别只在于坐标轴的置换。想办法合并这些逻辑的处理，进一步减小代码量。

**Issue:** The nine-grid geometry system had 24 nearly identical functions (6 faces × 2 types × 2 for inner/outer) with logic repeated for each axis direction.

**Solution:** Introduced a canonical coordinate system with axis transforms:

1. **AxisConfig interface** with full basis specification:
   ```typescript
   interface AxisConfig {
       wAxis: number;  // Main axis (perpendicular to face): 0=X, 1=Y, 2=Z
       uAxis: number;  // First tangent axis
       vAxis: number;  // Second tangent axis
       wSign: number;  // Direction along wAxis: +1 or -1
       uSign: number;  // Direction for basis handedness
       vSign: number;  // Direction for basis handedness
   }
   ```

2. **Permutation parity calculation** for correct winding:
   ```typescript
   function permutationParity(a: number, b: number, c: number): number {
       // Returns +1 for even permutation of [0,1,2], -1 for odd
   }

   function isMirrored(cfg: AxisConfig): boolean {
       const signProduct = cfg.uSign * cfg.vSign * cfg.wSign;
       const parity = permutationParity(cfg.uAxis, cfg.vAxis, cfg.wAxis);
       return signProduct * parity < 0;
   }
   ```

3. **Canonical emit methods** in GeometryBuilder:
   - `emitQuadCanonical()` - transforms (u,v,w) to world, flips winding for mirrored bases
   - `emitTriCanonical()` - same for triangles

4. **Four unified canonical builders** replace 24 individual functions:
   - `buildFaceCanonical()` - exterior face with center + 4 edges + 4 corners
   - `buildCornerCanonical()` - corner triangles with dynamic geometry
   - `buildInnerFaceCanonical()` - inner face for closing geometry
   - `buildInnerCornerCanonical()` - inner corner with three-way junction support

5. **Helper functions** for flag extraction:
   - `getPerpDirs(face)` - get perpendicular face directions
   - `getExteriorFlags(face, exterior)` - convert to (extU, extV) tuples
   - `getNeighborFlags(face, exterior)` - convert to (neighborU, neighborV) tuples

**Code Reduction:**
- Before: ~2800 lines with 24 duplicate functions
- After: ~1500 lines with 4 canonical builders
- **~46% reduction in code size**

**gpt-5.2 Review Feedback:**
- Identified permutation parity bug in `isMirrored` - **Fixed**
- Suggested module separation (axisTransform.ts, canonicalBuilders.ts)
- Suggested unit tests for axis transforms
- Suggested avoiding per-vertex allocations in hot paths

**Result:** ✅ Significantly reduced code duplication while maintaining correct geometry generation

</details>

<details>
<summary>Level Formula Update - Based on Layers (2025-12-30)</summary>

> 隐藏Pieces UI，定义level=floor(log2(layers+1))，下落间隔定义为1000/(level+1)^0.5

**Changes Made:**

1. **Hidden Pieces UI** (`cube-tetris.vue`):
   - Commented out the Pieces stat display

2. **Level calculation** (`TetrisGame.ts:completeClearingAnimation()`):
   - Old: `level = max(0, floor(log2(piecesDropped)) - 2)` (based on pieces)
   - New: `level = floor(log2(linesCleared + 1))` (based on layers)
   - Moved level update from `lockPiece()` to `completeClearingAnimation()`

**Level Progression Table:**

| Layers | Level | Drop Interval | Score Multiplier |
|--------|-------|---------------|------------------|
| 0 | 0 | 1000ms | ×1 |
| 1-2 | 1 | 707ms | ×2 |
| 3-6 | 2 | 577ms | ×3 |
| 7-14 | 3 | 500ms | ×4 |
| 15-30 | 4 | 447ms | ×5 |
| 31-62 | 5 | 408ms | ×6 |
| 63-126 | 6 | 378ms | ×7 |
| 127-254 | 7 | 354ms | ×8 |
| 255+ | 8+ | ~333ms+ | ×9+ |

**Characteristics:**
- Level 0 until first layer cleared
- Layers required to level up doubles each time (exponential growth)
- More intuitive: level progression tied to visible achievement (cleared layers)

**Result:** ✅ Level progression now based on layers cleared with logarithmic scaling

</details>

<details>
<summary>Fix Block Loss During Layer Clearing (2025-12-30)</summary>

> 现在有个现象我想不通。我们每个砖块是4单位，每一层是16单位，消层的时候以16增倍数减小单元数。但为什么有时候能观察到残留的单位数量不是4的整倍数？

**Issue:** After clearing layers, remaining block count was sometimes not a multiple of 4, which is mathematically impossible (each piece = 4 blocks, each layer = 16 blocks).

**Root Cause Analysis (via Puppeteer monitoring):**
Console logs revealed:
```
[BUG] Block count changed during shift! After remove: 28, After shift: 26, Shifted: 28
[BUG] Removed 18 blocks, expected 16! Before: 44, After: 26
```

The `removeLayerAndShift()` function was losing blocks during the shift operation. The `toShift` array was processed in Map iteration order (effectively random), causing this scenario:

1. Block B at (0, 2, 0) processed first → moves to (0, 1, 0)
2. Block A at (0, 1, 0) still in original position → gets OVERWRITTEN by Block B!
3. Block A then processed → moves to (0, 0, 0), but its data was already lost

**Fix Applied in `CubeGrid.ts:removeLayerAndShift()`:**

Added sort before processing to ensure lower Y blocks are moved first:

```typescript
// Shift blocks above down by 1
// IMPORTANT: Sort by Y ascending so we process lower blocks first
// This prevents overwriting blocks that haven't been moved yet
toShift.sort((a, b) => a.point.y - b.point.y);

for (const {key, data, point} of toShift) {
    this.blocks.delete(key);
    const newY = point.y - 1;
    this.set(point.x, newY, point.z, {...data, position: {x: point.x, y: newY, z: point.z}});
}
```

**Verification:** Ran game with 14+ layer clears via Puppeteer automation - zero warnings, block count always multiple of 4.

**Result:** ✅ Layer clearing now correctly preserves all blocks during shift operation

</details>


## 2025/12/31


<summary>AI Camera Enhancement - Centroid-Based Targeting (2025-12-31)</summary>

> Enhance AI playing camera scheduling. Cancel the constant rotation setting. Calculate the brick's center of gravity (x, z) coordinates, set the camera's target viewing angle to align with the vector from origin to the centroid, rotation speed proportional to the distance from centroid to origin. The first 0.4s for every dropping brick, keep inertial rotation instead of centroid targeting.

<details>
**Implementation:**

1. **TetrisRenderer.ts - New properties and methods:**
   - `pieceCentroid: {x: number; z: number} | null` - Current piece center of gravity
   - `pieceSpawnTime: number` - Timestamp when piece spawned (for camera delay)
   - `setPieceCentroid(centroid)` - Set current piece centroid for camera targeting
   - `onPieceSpawned()` - Reset camera control delay timer

2. **Modified auto-rotate logic in `render()`:**
   ```typescript
   const timeSinceSpawn = performance.now() - this.pieceSpawnTime;
   if (this.pieceCentroid && timeSinceSpawn > 400) {
       // Vector from board center to piece centroid
       const dx = this.pieceCentroid.x - this.boardCenter.x;
       const dz = this.pieceCentroid.z - this.boardCenter.z;

       // Target angle aligns with centroid direction
       const targetAngle = Math.atan2(dz, dx);

       // Rotation speed proportional to distance from center
       const distance = Math.sqrt(dx * dx + dz * dz);
       const rotateSpeed = Math.max(0.3, distance * 0.8);

       // Smooth transition to target angle
       let angleDiff = targetAngle - this.autoRotateAngle;
       // Normalize to [-PI, PI]
       while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
       while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

       this.autoRotateAngle += angleDiff * rotateSpeed * 0.02;
   } else {
       // Inertial rotation during pause period
       this.autoRotateAngle += this.autoRotateSpeed * 0.005;
   }
   ```

3. **cube-tetris.vue - Centroid calculation:**
   - In `updateVisuals()`: Calculate centroid from `getWorldBlocks()` and pass to renderer
   - In `pieceSpawned` event: Call `renderer.onPieceSpawned()` to reset delay timer

**Behavior:**
- Camera no longer rotates at constant speed
- Camera angle aligns with vector from board center to piece centroid
- Rotation speed increases when piece is further from center
- First 0.4s after piece spawn: slow inertial rotation (gives player time to see new piece)
- After 0.4s: smooth transition to centroid-targeting mode

**Result:** ✅ Camera dynamically follows piece position with smooth transitions

</details>

<details>
<summary>Fix Block Geometry Change After Layer Clearing (2025-12-31)</summary>

> It seems block's geometry changed after clearing

**Issue:** After clearing layers, block geometry would change incorrectly. Faces that should become visible remained hidden.

**Root Cause:** When layers are cleared and blocks shift down:
- Each block's `faceMask` (which controls which faces are rendered) was calculated based on same-piece neighbors
- After clearing, some same-piece neighbors may be removed (they were in the cleared layer)
- But the `faceMask` was not updated, so faces that should now be visible remained hidden

**Fix Applied in `TetrisGame.ts`:**

Added `updateFaceMasksAfterClearing()` method called after `removeLayerAndShift()`:
```typescript
private updateFaceMasksAfterClearing(): void {
    const faceDirections = [
        {mask: FACE_MASK.POS_X, dx: 1, dy: 0, dz: 0},
        {mask: FACE_MASK.NEG_X, dx: -1, dy: 0, dz: 0},
        {mask: FACE_MASK.POS_Y, dx: 0, dy: 1, dz: 0},
        {mask: FACE_MASK.NEG_Y, dx: 0, dy: -1, dz: 0},
        {mask: FACE_MASK.POS_Z, dx: 0, dy: 0, dz: 1},
        {mask: FACE_MASK.NEG_Z, dx: 0, dy: 0, dz: -1},
    ];

    for (const {point, data} of this.board.toPointList()) {
        let faceMask = data.faceMask ?? FACE_MASK.ALL;
        for (const dir of faceDirections) {
            // If face is hidden but no neighbor exists, show it
            if ((faceMask & dir.mask) === 0) {
                const neighbor = this.board.get(point.x + dir.dx, point.y + dir.dy, point.z + dir.dz);
                if (!neighbor) {
                    faceMask |= dir.mask;
                }
            }
        }
        data.faceMask = faceMask;
    }
}
```

Also removed debug logging that was added during investigation.

**Result:** ✅ Block geometry is correctly updated after layer clearing - faces that lose their neighbors become visible

</details>

<details>
<summary>Fix Block Color Change After Multi-Layer Clearing (2025-12-31)</summary>

> Still has bug, it seems some blocks color changed after clearing

**Issue:** When multiple layers were cleared simultaneously, some blocks would end up with wrong colors.

**Root Cause (identified by GPT-5.2):** The `completeClearingAnimation()` was calling `removeLayerAndShift()` sequentially for each layer with ORIGINAL Y values:
```typescript
// BUG: Sequential calls with original Y values
for (const y of this._clearingLayers) {
    this.board.removeLayerAndShift(y);
}
```

When clearing layers [1, 0]:
1. `removeLayerAndShift(1)` shifts blocks above y=1 down by 1
2. `removeLayerAndShift(0)` then shifts blocks above y=0 down by 1

This can cause destination collisions where two blocks end up being written to the same position, with the later write overwriting the earlier one (including color data).

**Fix Applied:**

Added new method `removeLayersAndShift()` in `CubeGrid.ts` that clears all layers in one pass:
```typescript
removeLayersAndShift(layers: number[]): void {
    const sortedLayers = [...layers].sort((a, b) => a - b);
    const layerSet = new Set(sortedLayers);

    for (const [key, data] of this.blocks) {
        const point = parseCoordKey(key);
        if (layerSet.has(point.y)) {
            // Block in cleared layer - remove it
            toRemove.push(key);
        } else {
            // Count cleared layers below this block
            let dropDistance = 0;
            for (const layerY of sortedLayers) {
                if (layerY < point.y) dropDistance++;
            }
            if (dropDistance > 0) {
                toShift.push({key, data, point, dropDistance});
            }
        }
    }
    // Remove all cleared, then shift remaining by their drop distance
}
```

Updated `TetrisGame.ts`:
```typescript
// Before (BUG):
for (const y of this._clearingLayers) {
    this.board.removeLayerAndShift(y);
}

// After (FIXED):
this.board.removeLayersAndShift(this._clearingLayers);
```

**Result:** ✅ Block colors are preserved correctly after multi-layer clearing

</details>

<details>
<summary>Fix Renderer Not Detecting Block Data Changes (2025-12-31)</summary>

> Color changed bug still exist.

**Issue:** Block colors still changed incorrectly after layer clearing, even with the multi-layer fix.

**Root Cause:** The renderer's `updateBoard()` method skipped creating a new mesh if one already existed at that position:
```typescript
if (this.boardBlockMeshes.has(key)) continue;  // BUG: doesn't check if data changed!
```

After layer clearing, when Block B shifts into position (0,2,0) that was previously occupied by Block A:
- The old mesh (Block A's red color) still exists at that key
- The code skips because mesh exists
- Result: Block B shows Block A's color!

**Fix Applied in `TetrisRenderer.ts:updateBoard()`:**

Now checks if the existing mesh's color/faceMask matches the current block data:
```typescript
updateBoard(board: CubeGrid): void {
    const currentBlocks = new Map<string, {point: Point3D; data: BlockData}>();
    for (const {point, data} of board.toPointList()) {
        currentBlocks.set(coordKey(point.x, point.y, point.z), {point, data});
    }

    for (const [key, mesh] of this.boardBlockMeshes) {
        if (this.clearingBlocks.has(key)) continue;

        const blockData = currentBlocks.get(key);
        if (!blockData) {
            // Remove: block no longer exists
            this.boardBlockMeshes.delete(key);
        } else {
            // Check if color or faceMask changed
            const material = mesh.material as THREE.MeshStandardMaterial;
            const currentColor = new THREE.Color(blockData.data.color);
            const storedFaceMask = mesh.userData.faceMask ?? FACE_MASK.ALL;

            if (!material.color.equals(currentColor) || storedFaceMask !== currentFaceMask) {
                // Data changed, recreate mesh
                this.boardBlockMeshes.delete(key);
            }
        }
    }

    // Create meshes for blocks that need one
    for (const [key, {point, data}] of currentBlocks) {
        if (this.boardBlockMeshes.has(key)) continue;
        const mesh = this.createBlockMesh(data.color, faceMask);
        mesh.userData = {faceMask};  // Store for future change detection
        this.boardBlockMeshes.set(key, mesh);
    }
}
```

**Result:** ✅ Renderer now detects when a different block occupies a position and recreates the mesh with correct color

</details>


## 2025/01/27


<details>
<summary>Cube3-Player Rendering Enhancement (2025-01-27)</summary>

> Optimize the rendering effect of cube3-player to match the reference gist demo.

**Reference:** https://gist.github.com/k-l-lambda/2d1ab02201ec147e9a427f4e278bcd53

**Issue:** The cube3-player component used basic materials without proper lighting or rounded corners.

**Changes Made:**

1. **RoundedBoxGeometry for rounded corners** (`app/cubeMesh.js`):
   - Replaced BoxGeometry with RoundedBoxGeometry (radius 0.08, segments 4)
   - Provides smooth beveled edges matching reference demo

2. **Custom ShaderMaterial with normal-based face coloring**:
   - Created `createNormalColorMaterial()` function
   - Colors faces based on fragment normal direction (dominant axis)
   - Solves RoundedBoxGeometry's material group issues where beveled edges showed wrong colors
   - Each cubie gets its own shader with face colors based on its position in the 3x3x3 grid

3. **Object-space vs view-space normal fix**:
   - Initial bug: Shader used view-space normals for face color, causing colors to change when cube rotated
   - Fix: Pass object-space normals (`vObjectNormal`) for face color determination
   - Continue using view-space normals (`vNormal`) for lighting calculations

4. **Enhanced specular highlights**:
   - Two-light setup: main light (top-right-front) + back fill light
   - Higher specular intensity (0.8) and shininess (64)
   - Fresnel rim effect for edge glow

5. **Highlight system update** (`app/components/cube3.vue`):
   - Changed from material swapping to shader uniform toggle
   - Each mesh has `setHighlight(bool)` method
   - Highlight boosts brightness via shader uniform

6. **Materials update** (`app/components/cube3.vue`):
   - Changed from MeshBasicMaterial to MeshStandardMaterial
   - Added 3-point lighting (ambient + directional + backlight)
   - Gradient background on cube3-player view

**Files Modified:**
- `app/cubeMesh.js` - New shader-based mesh generation
- `app/components/cube3.vue` - Materials, lighting, highlight system
- `app/views/cube3-player.vue` - Background gradient

**Result:** ✅ Cube now has rounded corners, correct face colors, proper lighting with specular highlights

</details>

<details>
<summary>Dependabot Branch Merges (2025-01-27)</summary>

**Merged into develop branch:**
- `dependabot/npm_and_yarn/lodash-4.17.23` - lodash 4.17.21 → 4.17.23
- `dependabot/npm_and_yarn/vite-5.4.21` - vite 5.4.11 → 5.4.21

**Result:** ✅ Dependencies updated, dev server running without errors

</details>

## 2026-07-17 Hexagon Blocks recognition geometry transform

- Fixed recognitionCv centroid matching to use rendered `placementCenter` geometry instead of packed grid coordinates.
- Added practical source-image transform metadata and transformed matched placement triangle polygons to `RecognitionResult`.
- Updated the photo overlay with block-colored matched polygons while retaining contour wireframes and Apply/Discard.
- Added focused transform assertions; recognition test, focused lint, diff check, and production build passed.
- Preserved `app/home.vue` and `Changelog.txt`.
