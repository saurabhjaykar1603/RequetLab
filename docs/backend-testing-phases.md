# Backend Testing Phases

This file turns the current backend into a practical delivery plan for API coverage, workflow, and quality gates.

## Current Status

What exists now:

- working Fastify backend
- working PostgreSQL persistence
- route schemas on several endpoints
- reusable Fastify app factory for tests
- startup split from app construction
- initial automated backend route tests
- initial mocked repository tests
- no CI workflow in this repository
- repo-level Husky hooks

That means the correct next step is still not "claim 100% coverage". The correct next step is to extend coverage in layers and make each phase enforceable.

## Completed So Far

Already implemented:

- `server/app.ts` now builds a reusable Fastify instance
- `server/server.ts` owns process startup
- root `npm run check` runs backend-safe validation
- first-pass route tests cover auth, workspaces, collections, requests, environments, activity logs, and proxy behavior
- first-pass route tests cover profile-update flows in addition to core API routes
- first-pass repository tests cover core SQL orchestration without a real database

Big remaining gap:

- there are still no real database-backed integration tests against a dedicated PostgreSQL test database

## Target Outcome

The target is:

- stable backend test architecture
- reliable API regression coverage
- measurable coverage reports
- commit hooks for fast local feedback
- a workflow that can later be moved into CI without rework

## Phase 0: Stabilize Testability

Goal:

- make the backend easy to test without changing business behavior

Status:

- mostly complete

Work:

1. Extract app creation from `server/app.ts` into a reusable factory such as `buildApp()`.
2. Move `fastify.listen()` into a thin startup file so tests can instantiate Fastify directly.
3. Make database initialization callable and controllable in tests.
4. Decide test DB strategy:
   - PostgreSQL test database
   - Dockerized Postgres for integration tests
   - or a dedicated local database per run

Definition of done:

- tests can boot the app with `fastify.inject()`
- tests do not require the dev server to be running manually

## Phase 1: Add the Backend Test Foundation

Recommended stack:

- test runner: Vitest
- HTTP integration: Fastify `inject`
- coverage: built-in V8 coverage through Vitest
- test helpers: shared factories for users, workspaces, collections, folders, requests, environments

Work:

1. Add dev dependencies for the backend test runner.
2. Add scripts such as:
   - `test`
   - `test:watch`
   - `test:coverage`
3. Add a `tests/` layout for:
   - `tests/routes`
   - `tests/repositories`
   - `tests/helpers`
4. Add setup and teardown helpers for the test database.

Definition of done:

- one route test passes
- one repository test passes
- coverage reporting is generated locally

Status:

- route test foundation is done
- initial repository coverage is done
- database-backed integration coverage is still pending

## Phase 2: Auth and Workspace Coverage

Why first:

- these flows gate access to almost everything else

Minimum cases:

- signup success
- signup duplicate email
- login success
- login invalid email
- login invalid password
- logout success
- protected route without cookie returns `401`
- workspace creation for authenticated user
- workspace listing for authenticated user
- team workspace invite flow
- invitation accept flow
- invitation reject flow
- non-admin invite blocked
- non-admin remove member blocked
- admin self-removal blocked
- workspace delete blocked for non-admin

Definition of done:

- all auth and workspace branches are covered
- role-based authorization behavior is locked down with tests

## Phase 3: Collections, Folders, and Requests

Minimum cases:

- collection list with workspace header
- collection create, update, delete
- collection import with:
   - no workspace header and no existing workspace
   - no workspace header and existing workspace
   - folders plus root requests
- folder list for all folders in workspace
- folder list filtered by collection
- folder create, update, delete
- request list by workspace
- request list by collection root only
- request list by folder
- request create with serialized JSON fields
- request update for partial fields
- request delete

Important assertions:

- activity logs are written for mutations
- JSON fields are stored correctly and returned parsed
- workspace scoping is enforced

## Phase 4: Environments, Activity Logs, and Proxy Execution

Minimum cases:

- environment get/create/update/delete
- environment access denied outside workspace membership
- missing `x-workspace-id` rejected on environment routes
- activity log listing with pagination
- activity log filtering by `userId`
- activity log filtering by `action`
- activity log filtering by `entityType`
- proxy executes GET request
- proxy executes POST JSON request
- proxy interpolates `{{ENV_VAR}}`
- proxy returns structured failure payload on upstream error

Important risk:

- `POST /api/proxy` is currently unauthenticated, so tests should document current behavior and support a future hardening change

## Phase 5: Repository and Transaction Hardening

Focus:

- direct repository coverage for SQL-heavy behavior

Priority targets:

- `workspaceRepository.createInvitation`
- `workspaceRepository.updateInvitationStatus`
- `importRepository.importCollectionTree`
- `requestRepository.updateRequest`
- `activityRepository.getActivityLogs`
- `db.withTransaction`

Why this phase matters:

- repository tests catch regressions that route tests miss
- transaction behavior needs explicit rollback coverage

## Phase 6: Coverage Gates and CI Readiness

After the suite is stable, enforce numbers.

Recommended initial gates:

- statements: 80%
- branches: 75%
- functions: 80%
- lines: 80%

Only move toward true 100% after:

- flaky tests are removed
- app factory/test database setup is stable
- low-value coverage holes are identified and intentionally handled

Realistic note:

- forcing 100% too early usually creates brittle tests around framework noise instead of business value

## Local Workflow

Suggested daily workflow:

1. implement or update backend code
2. run fast checks locally
3. run targeted backend tests
4. run coverage before merging larger changes

Suggested commands after the test suite exists:

```bash
npm run check
npm --prefix server run test
npm --prefix server run test:coverage
```

## Husky Workflow

Current intended hook behavior:

- `pre-commit`: run backend-safe checks only
- `post-commit`: print the recommended full verification command

Once backend tests exist, expand `pre-commit` carefully:

- keep it fast for normal commits
- move slower coverage checks to pre-push or CI

Recommended future quality gates:

- `pre-commit`: lint + typecheck + changed-file tests if you add that logic later
- `pre-push`: full backend test suite
- CI: full test suite + coverage thresholds + production build

Current repository note:

- frontend lint already has existing violations, so it should be fixed first before being moved into a blocking commit hook

## File Ownership Plan

Suggested order of implementation:

1. `server/app.ts`
2. new backend test setup files
3. auth and workspace tests
4. collections/folders/requests tests
5. environments/activity/proxy tests
6. repository transaction tests

## Success Criteria

You can call the backend testing workflow healthy when:

- every API area has automated regression coverage
- auth and workspace authorization paths are covered
- repository side effects are covered
- coverage is measured automatically
- hooks and CI enforce the agreed baseline
