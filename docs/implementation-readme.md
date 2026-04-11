# Implementation README

This document describes the current SaaS-style implementation in RequestLab.

## Goals Implemented

- Added product pricing model with `Free` and `Business` plans.
- Added user profile update section.
- Added public SaaS pages (home + pricing) while preserving the existing API dashboard.
- Added backend profile update API and route test coverage.

## Pricing Model

Two plans are supported in backend and frontend:

- `free`
- `business`

Payment integration is intentionally not included.

## Backend Changes

### Database schema updates (`server/db.ts`)

- `users` table extended with:
  - `jobTitle`
  - `company`
  - `bio`
- `workspaces` table extended with:
  - `plan` (`free` or `business`)

### Active APIs

Auth:

- `PUT /api/auth/profile` updates current user profile.

Workspaces:

- `POST /api/workspaces` supports optional `plan`.

## Frontend Changes

### Routes

- `/` public home page
- `/pricing` public pricing page
- `/app` authenticated API dashboard
- `/profile` authenticated profile update page

### New frontend components

- `client/src/components/marketing/HomePage.jsx`
- `client/src/components/marketing/PricingPage.jsx`
- `client/src/components/settings/ProfilePage.jsx`

### Dashboard updates

- Added quick navigation to Home, Pricing, and Profile.
- Workspace creation modal includes plan selection.

### API client updates (`client/src/api.js`)

- `updateProfile`
- `createWorkspace` includes plan parameter

## Tests Added/Updated

- Updated `server/tests/routes/auth.test.ts` with profile update test.
- Updated workspace-related tests to match workspace plan behavior.

## Notes

- Profile is now the only settings workflow exposed on `/profile`.
- No Stripe/payment workflow is required for this release.
