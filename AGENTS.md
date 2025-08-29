# Repository Guidelines

## Project Structure & Module Organization
- `src/`: TypeScript source (ESM). Key areas: `openapi/`, `toolsets/`, `modules/`, `utils/`, `benchmark/`. Do not edit `dist/`.
- Tests: colocated under `src/**/tests` using `*.spec.ts` with snapshots in `__snapshots__/`.
- `examples/`: runnable usage examples. `scripts/`: maintenance and generation scripts. `benchmarks/`: evaluation tools and reports.
- Assets/data: `data/`, `mocks/`. Generated OpenAPI may live in `src/openapi/generated/`.

## Build, Test, and Development Commands
- `bun run build`: build library via `tsdown` to `dist/`.
- `bun run test`: run unit, examples, and scripts tests.
- `bun test src` / `examples` / `scripts`: run a subset.
- `bun run fetch:specs`: fetch/update API specs and format outputs.
- Docs: `bun run docs:serve` (local), `docs:build`, `docs:deploy`.
- Quality: `bun run lint`, `bun run format`, `bun run typecheck`.

## Coding Style & Naming Conventions
- Language: TypeScript (strict), ESM only. No CommonJS.
- Formatting: Biome; 2‑space indent; run `bun run format` before pushing.
- Files: source names in `camelCase` (e.g., `requestBuilder.ts`); tests as `<name>.spec.ts`.
- Exports: prefer named exports; avoid default exports unless there's a single primary API.
- Keep public types and `index.ts` stable; avoid breaking changes without a major bump.

## Testing Guidelines
- Runner: Bun test. Mock HTTP with MSW where applicable.
- Place tests near code under `src/**/tests`. Name as `<feature>.spec.ts`.
- Snapshots belong in `__snapshots__/`. Update intentionally with `-u` when behavior changes.
- Run `bun run test` locally; ensure examples still pass.

## Commit & Pull Request Guidelines
- Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`, optional scopes (e.g., `feat(benchmark): ...`).
- PRs: include description, rationale, linked issues, and screenshots/logs for UX/CLI changes. Note breaking changes explicitly.
- Keep diffs focused; update docs and examples when APIs change.

## Security & Configuration Tips
- Env: copy `.env_example` to `.env` locally; never commit `.env`.
- Generated code: prefer `bun run fetch:specs` and related scripts; don’t hand‑edit `dist/` or generated OpenAPI files.
- Validate builds with `bun run rebuild` before publishing.
