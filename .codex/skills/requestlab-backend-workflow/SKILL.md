---
name: requestlab-backend-workflow
description: Use when working on the RequestLab backend, especially Fastify routes/controllers/repositories, PostgreSQL behavior, backend documentation, Husky workflow, or phased API test coverage for this repository.
---

# RequestLab Backend Workflow

Use this skill when the task touches the backend in this repository.

## Load These Files First

- `server/README.md`
- `docs/backend-testing-phases.md`
- `server/app.ts`
- the route, controller, and repository files related to the feature you are changing

## Architecture Rules

- Keep the existing flow: route -> controller -> repository -> database
- Put SQL in `server/repositories/`
- Keep HTTP-specific logic in `server/controllers/`
- Keep Fastify route schemas in `server/routes/`
- Preserve the current cookie-based auth model unless the task explicitly changes it

## RequestLab Backend Constraints

- Protected routes depend on the JWT stored in the `token` cookie
- Workspace-scoped data uses the `x-workspace-id` header
- Several database fields are stored as JSON strings and parsed in controllers
- `server/db.ts` currently bootstraps schema on startup, so changes there affect app startup behavior directly

## Documentation Rules

- When backend behavior changes, update `server/README.md`
- If the change affects testing strategy or delivery sequencing, update `docs/backend-testing-phases.md`
- Prefer documenting real current behavior over ideal future behavior

## Quality Workflow

Before finishing backend work, run:

```bash
npm run check
```

If frontend bundling could be affected, also run:

```bash
npm run verify
```

## Testing Direction

- Do not claim 100% coverage unless the suite actually measures it
- Favor layered coverage: repository, route/controller, then integration
- Add Fastify inject-based tests once the app is extracted into a reusable factory
