# Repository Guidelines

## Project Structure & Module Organization
- `app/` Vue 2 source (Vue SFCs + TypeScript). Entrypoints: `app/home.ts`, `app/common-viewer.ts`, `app/embed.ts`.
- `inc/` shared TS modules; `tools/` data generators; `static/` generated assets.
- `public/` static root; build output in `docs/` (served by Express in `main.ts`).
- `vue.config.js` configures multi-page build; `main.ts` starts the server.
- `tests/` lightweight TS tests using `console.assert`.

## Build, Test, and Development Commands
- `npm run serve` — start Vue dev server.
- `npm run build` — build pages into `docs/`.
- `npm run lint` — run ESLint per `.eslintrc.js`.
- `npm run start` — serve `docs/` via Express (`HOST`, `PORT`, `HTTPS`).
- `npm run dev` / `npm run dev:inspect` — Express with hot reload/inspect.
- Data tools: `npm run cube3-gentable6`, `cube3-gensolvermap`, `cube3-genhash` (outputs under `static/`).

## Coding Style & Naming Conventions
- TypeScript + Vue 2. Use tabs for indentation, double quotes, and semicolons.
- Brace style: `stroustrup`; prefer `const`; allow camelCase and PascalCase for classes/components.
- Vue component files use kebab-case (e.g., `common-viewer.vue`); TS modules use camelCase.

## Testing Guidelines
- Tests live in `tests/` (e.g., `tests/cube.ts`) and use `console.assert`.
- Run a test file: `npx ts-node --project ./tsconfig.node.json tests/cube.ts`.
- Keep tests deterministic and fast; cover core logic in `inc/`.

## Commit & Pull Request Guidelines
- Commit messages: concise, file‑scoped prefix + change, e.g., `lotus.vue: refined onSystemShift.`
- PRs include: summary, linked issue, steps to verify, and screenshots for UI changes.
- Ensure `npm run build` and `npm run lint` pass; update docs when structure or commands change.

## Security & Configuration Tips
- Use `.env` for `HOST`, `PORT`, `HTTPS`. HTTPS needs `certificates/key.pem` and `cert.pem`.
- Node version: `.nvmrc` → `14.21.3`. Do not commit secrets; respect `.gitignore`.


## Meta-Instructions

**Important constraints to remember**:
1. Learn the development history from `Changelog.txt` & `agentlog.md` firstly.
1. Update `agentlog.md` when a mini-milestone is accomplished.
1. Use tabs for indentation for all code file formats.
