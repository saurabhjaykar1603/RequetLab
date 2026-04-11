# RequestLab Server Backend

This document describes the current backend in `server/` so you can maintain it, test it, and extend it without reverse-engineering the code each time.

## Overview

The backend is a Fastify + TypeScript server with PostgreSQL persistence. It exposes authentication, workspace management, collections, folders, requests, environments, proxy execution, and activity logs.

At runtime the server also serves the built React app from `client/dist`, so production can run as a single process.

## Stack

- Runtime: Node.js 18+ recommended
- Web framework: Fastify
- Language: TypeScript with ESM
- Database: PostgreSQL via `pg`
- Auth: JWT stored in an HTTP-only `token` cookie
- Logging: Winston plus a Fastify request logger hook
- Frontend hosting: `@fastify/static`

## Current Backend Architecture

Request flow:

1. `server/server.ts` is the thin startup entrypoint.
2. `server/app.ts` builds a Fastify instance, registers plugins/routes, and can be reused in tests.
3. `server/routes/*.ts` defines the public API shape and some request schemas.
4. `server/controllers/*.ts` handles HTTP-level concerns and orchestration.
5. `server/repositories/*.ts` owns SQL, persistence, and activity logging side effects.
6. `server/db.ts` initializes PostgreSQL on startup and exposes query helpers.

Directory map:

- `server/server.ts`: runtime startup entrypoint
- `server/app.ts`: reusable Fastify app builder
- `server/db.ts`: PostgreSQL connection, bootstrap, transaction helper
- `server/plugins/auth.ts`: cookie/JWT auth guard
- `server/plugins/env-watcher.ts`: reloads `.env` on file change during runtime
- `server/plugins/request-logger.ts`: logs every request
- `server/routes/`: Fastify route registration
- `server/controllers/`: route handlers
- `server/repositories/`: SQL and data access logic
- `server/interfaces/`: TypeScript entity shapes

## Environment Variables

The backend reads from `server/.env` during local development. The current code supports both local and Docker-oriented variable names.

Important variables:

- `PORT`: server port, default `5000`
- `JWT_SECRET`: JWT signing secret; if missing the code falls back to `supersecret`
- `DB_HOST` or `PG_HOST_DEV`
- `DB_PORT` or `PG_PORT_DEV`
- `DB_USER` or `PG_USER_DEV`
- `DB_PASSWORD` or `PG_PASSWORD_DEV`
- `DB_NAME`
- `TEST_VAR`: present in `server/.env.sample`, currently not used by the backend logic

Recommended local `server/.env`:

```env
PORT=5000
JWT_SECRET=replace-this-in-real-environments
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=requestlab
```

## Local Development

Install dependencies:

```bash
cd client && npm install
cd ../server && npm install
```

Run full-stack development from `server/`:

```bash
cd server
npm run dev
```

What this does:

- `npm run dev:server`: runs Fastify with `tsx --watch`
- `npm run dev:client`: runs Vite in the `client/` folder
- `npm run dev`: runs both with `concurrently`

Default local URLs:

- Frontend: `http://localhost:3000`
- API server: `http://localhost:5000`

## Production Flow

Build:

```bash
cd server
npm run build
```

Run production:

```bash
cd server
npm run prod
```

Production behavior:

- the React app is built from `client/`
- the backend serves `client/dist`
- all non-`/api` unknown routes return `index.html`

## Docker Flow

The repository includes `Dockerfile` and `docker-compose.yml`.

Start everything:

```bash
docker compose up --build
```

Services:

- `app`: Node image serving the backend and built frontend
- `db`: PostgreSQL 15 Alpine with a persisted Docker volume

## Database Bootstrap

Database initialization is triggered during startup before the server listens.

The current bootstrap behavior:

- connects to the default `postgres` database
- creates `DB_NAME` if it does not already exist
- creates tables if they are missing
- applies a few inline schema migrations with `DO $$ ... $$`

Current tables:

- `users`
- `workspaces`
- `workspace_members`
- `collections`
- `folders`
- `requests`
- `environments`
- `workspace_invitations`
- `activity_logs`

Important note:

- schema management is currently startup-driven, not handled through a separate migration system

## Authentication Model

Authentication is cookie-based.

Flow:

1. `POST /api/auth/signup` creates a user and sets a `token` cookie.
2. `POST /api/auth/login` validates credentials and sets a `token` cookie.
3. Protected routes use `fastify.authenticate`, which verifies the JWT from `request.cookies.token`.
4. `POST /api/auth/logout` clears the `token` cookie.

Cookie settings:

- `httpOnly: true`
- `sameSite: 'strict'`
- `secure: true` only in production
- `maxAge`: 2 days

## Workspace Header Requirement

Many backend features are scoped to a workspace through the `x-workspace-id` request header.

This header is used by:

- collections
- folders
- requests
- environments
- activity logs

Without a valid workspace context, some routes return all rows, some return empty data, and some correctly reject the request. This should be normalized during the testing/hardening phase.

## API Surface

### Auth

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/logout`

### Workspaces

- `POST /api/workspaces`
- `GET /api/workspaces`
- `GET /api/workspaces/:id/members`
- `POST /api/workspaces/:id/members`
- `PUT /api/workspaces/:id`
- `DELETE /api/workspaces/:id/members/:userId`
- `DELETE /api/workspaces/:id`
- `GET /api/workspaces/invitations`
- `POST /api/workspaces/invitations/:id/respond`

### Collections

- `GET /api/collections`
- `POST /api/collections`
- `POST /api/collections/import`
- `PUT /api/collections/:id`
- `DELETE /api/collections/:id`

### Folders

- `GET /api/folders`
- `POST /api/folders`
- `PUT /api/folders/:id`
- `DELETE /api/folders/:id`

### Requests

- `GET /api/requests`
- `POST /api/requests`
- `PUT /api/requests/:id`
- `DELETE /api/requests/:id`

### Environments

- `GET /api/environments`
- `POST /api/environments`
- `PUT /api/environments/:id`
- `DELETE /api/environments/:id`

### Proxy Execution

- `POST /api/proxy`

Behavior:

- executes outbound HTTP requests with `fetch`
- interpolates `{{ENV_NAME}}` tokens from `process.env`
- appends query parameters from the request payload
- returns response status, headers, body, time, and size

### Activity Logs

- `GET /api/activity`

Supported query params:

- `limit`
- `offset`
- `userId`
- `action`
- `entityType`

## Activity Logging

The repositories log most important mutations through `activityRepository.logActivity`.

Current event coverage includes:

- user signup, login, logout
- workspace create, update, delete
- workspace invite, accept, reject, remove member
- collection create, update, delete
- folder create, update, delete
- request create, update, delete
- environment create, update, delete

## Data Handling Notes

Several entity fields are stored as JSON strings in PostgreSQL and parsed in controllers:

- request `headers`
- request `params`
- request `body`
- request `auth`
- environment `variables`

This means tests should verify both persistence format and response format.

## Known Gaps To Track

These are real codebase gaps worth documenting before adding strict automation:

- initial automated backend route and repository tests now exist
- no dedicated server lint script exists yet
- `JWT_SECRET` has an insecure default fallback
- database schema changes are mixed into application startup
- some read endpoints rely on `x-workspace-id` but do not enforce authorization consistently
- `POST /api/proxy` is currently unauthenticated
- `server/tsconfig.json` uses `"noEmit": true`, so `build:server` is effectively a typecheck step
- database-backed integration tests and deeper repository coverage still need to be added

## Recommended Backend Testing Strategy

Do not try to reach 100% coverage with only end-to-end tests. Split coverage into layers:

1. Repository tests for SQL behavior and side effects.
2. Controller and route tests for auth, headers, validation, and HTTP responses.
3. Integration tests for major user flows.
4. A smaller number of end-to-end smoke tests across the running app.

Current automated coverage in the repository:

- reusable `buildApp()` test bootstrap
- mocked Fastify route tests for auth, workspaces, collections, requests, environments, activity logs, and proxy behavior
- mocked repository tests for auth, workspace, collection, folder, request, environment, activity, and import flows

Current backend test commands:

- `npm --prefix server run test`
- `npm --prefix server run test:coverage`

Current measured baseline after this setup:

- 33 passing backend tests
- roughly 60% total statement coverage
- the biggest uncovered areas are `db.ts`, startup wiring, and real database-backed integration paths

The phased plan lives here:

- [docs/backend-testing-phases.md](/Users/saurabh/Desktop/RequetLab/docs/backend-testing-phases.md)

## Husky Workflow

Repo-level Husky hooks are intended to protect the current project without slowing it down too much:

- `pre-commit`: run backend-safe checks that currently pass in this repository
- `post-commit`: print the next validation step so commits are followed by a consistent workflow

Current root commands:

- `npm run check`: server typecheck plus backend tests
- `npm run verify`: server typecheck plus frontend production build
- `npm run lint:client`: available manually, but not enforced yet because the current client has existing lint errors

If you add a real backend test suite, wire it into the shared root scripts so Husky can enforce it.

## Codex Skill Folder

A project-local Codex skill is included so future Codex runs can quickly load the backend workflow, documentation, and testing expectations:

- [requestlab-backend-workflow](/Users/saurabh/Desktop/RequetLab/.codex/skills/requestlab-backend-workflow/SKILL.md)

## Suggested Next Implementation Steps

1. Add a real backend test runner and coverage tool.
2. Extract a Fastify app factory so tests can use `fastify.inject()` without starting the server process.
3. Add a dedicated test database strategy for local and CI runs.
4. Move startup schema creation into explicit migrations.
