# RequestLab

RequestLab is a full-stack API workspace with a SaaS-style product flow:

- public home + pricing pages
- authentication and profile settings
- personal/team workspaces for API requests
- organization/team assignment with plan-based seat limits

## Product Features

- API client experience (collections, folders, requests, environments, activity log)
- Pricing model with two plans:
  - `Free`
  - `Business`
- Organization management:
  - create one organization per owner account
  - assign users by email
  - default plan is `Free`; switch to `Business` in-app (no payment integration)
- User profile update flow

## Project Structure

- `client/`: React + Vite frontend
- `server/`: Fastify + TypeScript backend
- `docs/`: implementation and backend testing docs

## Documentation

- [Server README](/Users/sj/Desktop/RequestLab/server/README.md)
- [Implementation README](/Users/sj/Desktop/RequestLab/docs/implementation-readme.md)
- [Backend Testing Phases](/Users/sj/Desktop/RequestLab/docs/backend-testing-phases.md)

## Quick Start

1. Install dependencies:

```bash
cd client && npm install
cd ../server && npm install
```

2. Configure env files (`client/.env`, `server/.env`) based on samples.

3. Start development from `server/`:

```bash
cd server
npm run dev
```

Frontend: `http://localhost:3000`
Backend: `http://localhost:5000`

## Quality Commands

From repo root:

- `npm run check`
- `npm run verify`

## Docker

Run the full stack (app + postgres):

```bash
docker compose up --build
```
