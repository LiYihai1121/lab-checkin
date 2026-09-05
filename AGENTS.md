# AGENTS.md

## Project map

- This repository contains two independent Node.js packages: `server/` (Express API) and `web/` (Vue 3/Vite SPA). There is no root `package.json` or root build command. Both packages are written in TypeScript: the backend runs via Node's native type stripping (no build step), and the frontend type-checks with `vue-tsc`.
- Read [README.md](README.md) for the user-facing feature list, complete API table, setup steps, and deployment notes before changing cross-layer behavior.
- Backend route ownership is split under `server/src/routes/`; registration, rate limiting, and global middleware live in `server/src/index.ts`. Database setup, indexes, and the default administrator live in `server/src/db/database.ts`; shared backend helpers (password hashing, pagination, LIKE escaping, constraint-error detection) live in `server/src/utils/helpers.ts`; shared row/request types live in `server/src/types.ts`.
- Frontend pages are under `web/src/views/`; shared HTTP behavior is in `web/src/api/request.ts` (use the `silent: true` request config when a caller handles its own errors), authentication state is in `web/src/stores/user.ts`, access control is in `web/src/router/index.ts`, and shared API row types live in `web/src/types.ts`.

## Local commands

- Backend development: `cd server` then `npm install` and `npm run dev`.
- Backend production: from `server/`, run `npm start`.
- Frontend development: `cd web` then `npm install` and `npm run dev`.
- Frontend verification/build: from `web/`, run `npm run build`.
- Both packages define `npm test` (Vitest, one-shot run), `npm run typecheck`, `npm run lint`, and `npm run lint:fix`. Backend integration tests live in `server/tests/` and run against an in-memory SQLite database via `tests/setup.ts` (`DB_PATH=:memory:`); never point them at the real database under `server/data/`.
- Code style is enforced by Prettier (root `.prettierrc.json`) and ESLint per package. Local git hooks (typecheck + lint pre-commit, Conventional Commits commit-msg) live in `.githooks/`; activate with `git config core.hooksPath .githooks` after cloning. CI runs the same gates on push/PR.
- Node.js 22.18 or newer is required: the backend uses Node's built-in `node:sqlite` and runs `.ts` files directly via native type stripping (`node src/index.ts`). Only erasable TS syntax is allowed on the server (no enums, namespaces, or parameter properties). Do not add a separate SQLite service or driver without a concrete compatibility reason.

## Change conventions

- Preserve the existing ES module style (`"type": "module"`), the current TypeScript strictness, and the current Vue single-file component patterns (`<script setup lang="ts">`). Keep changes localized to the owning package unless an API contract genuinely crosses the boundary.
- Backend API changes must update the owning route and any affected frontend request/call site. Keep `/api` as the frontend Axios base URL and use the existing request interceptor for bearer-token injection and 401 handling.
- Protected backend routes use `authenticate`; administrator-only routes additionally use `requireAdmin`. Do not rely on frontend route metadata as a substitute for server authorization.
- Keep password handling through `bcryptjs`, tokens through the existing JWT middleware, and database access through the shared database module. Never log passwords, JWTs, or other credentials.
- The SQLite database is created under `server/data/` at runtime. Treat that directory as local runtime state and avoid committing generated database files.
- For UI changes, preserve Element Plus and the existing router/store structure. Add loading, empty, and error states when changing data-fetching views.
- After a change, run the narrowest available validation first: `npm run typecheck` for the changed package, `npm test` for touched logic, and `npm run build` for frontend changes; run both packages' checks when changing a shared API contract. Check the resulting diff for unrelated changes.

## Environment notes

- The default JWT secret is development-only. Production deployments must set `JWT_SECRET` (the server refuses to start without it when `NODE_ENV=production`); `PORT`, `CORS_ORIGIN`, `DB_PATH`, `ADMIN_PASSWORD`, `CREATE_DEFAULT_ADMIN`, and `TRUST_PROXY` are also environment-controlled. See [README.md](README.md) for the full list and deployment examples.
- The three environments (development / test / production) differ by `NODE_ENV` and have per-environment defaults (port, SQLite file name) centralized in `server/src/config/environment.ts` and frontend identity in `web/src/config/env.ts` — dev 5173→3000, test 5174→3100, production same-origin. `server/.env.development` and `server/.env.test` are committed (no secrets); production config goes in git-ignored `server/.env`. Keep new environment-specific behavior in those modules, not scattered at call sites.
- The default administrator is intended for first-run setup only and should change the password after login. The login page must not display default credentials.