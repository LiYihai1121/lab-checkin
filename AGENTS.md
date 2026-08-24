# AGENTS.md

## Project map

- This repository contains two independent Node.js packages: `server/` (Express API) and `web/` (Vue 3/Vite SPA). There is no root `package.json` or root build command.
- Read [README.md](README.md) for the user-facing feature list, complete API table, setup steps, and deployment notes before changing cross-layer behavior.
- Backend route ownership is split under `server/src/routes/`; registration and global middleware live in `server/src/index.js`. Database setup and the default administrator live in `server/src/db/database.js`.
- Frontend pages are under `web/src/views/`; shared HTTP behavior is in `web/src/api/request.js`, authentication state is in `web/src/stores/user.js`, and access control is in `web/src/router/index.js`.

## Local commands

- Backend development: `cd server` then `npm install` and `npm run dev`.
- Backend production: from `server/`, run `npm start`.
- Frontend development: `cd web` then `npm install` and `npm run dev`.
- Frontend verification/build: from `web/`, run `npm run build`.
- Neither package currently defines a test or lint script. For backend syntax-only checks, use `node --check` on the changed `.js` file; do not invent a test command.
- Node.js 22.5 or newer is required because the backend uses Node's built-in `node:sqlite`; do not add a separate SQLite service or driver without a concrete compatibility reason.

## Change conventions

- Preserve the existing ES module style (`"type": "module"`) and the current Vue single-file component patterns. Keep changes localized to the owning package unless an API contract genuinely crosses the boundary.
- Backend API changes must update the owning route and any affected frontend request/call site. Keep `/api` as the frontend Axios base URL and use the existing request interceptor for bearer-token injection and 401 handling.
- Protected backend routes use `authenticate`; administrator-only routes additionally use `requireAdmin`. Do not rely on frontend route metadata as a substitute for server authorization.
- Keep password handling through `bcryptjs`, tokens through the existing JWT middleware, and database access through the shared database module. Never log passwords, JWTs, or other credentials.
- The SQLite database is created under `server/data/` at runtime. Treat that directory as local runtime state and avoid committing generated database files.
- For UI changes, preserve Element Plus and the existing router/store structure. Add loading, empty, and error states when changing data-fetching views.
- After a change, run the narrowest available validation first: `node --check` for a changed backend module, `npm run build` for frontend changes, and both when changing a shared API contract. Check the resulting diff for unrelated changes.

## Environment notes

- The default JWT secret is development-only. Production deployments must set `JWT_SECRET`; `PORT` and `CORS_ORIGIN` are also environment-controlled. See [README.md](README.md) for deployment examples.
- The default administrator is intended for first-run setup only and should change the password after login.