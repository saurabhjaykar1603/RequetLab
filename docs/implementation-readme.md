# Implementation README

This document describes the current SaaS-style implementation added to RequestLab.

## Goals Implemented

- Added product pricing model with `Free` and `Business` plans.
- Added organization workflow for team creation and user assignment.
- Added user profile update section.
- Added public SaaS pages (home + pricing) while preserving the existing API dashboard.
- Added backend APIs and route tests for profile and organization flows.

## Pricing Model

Two plans are supported in backend and frontend:

- `free`
  - intended for common users
  - organization seat limit: `3`
- `business`
  - intended for organizations
  - organization seat limit: `25`

Payment integration is intentionally not included. Plan selection and upgrades are product-side controls only.

## Backend Changes

### Database schema updates (`server/db.ts`)

- `users` table extended with:
  - `jobTitle`
  - `company`
  - `bio`
- `workspaces` table extended with:
  - `plan` (`free` or `business`)
- new tables:
  - `organizations`
  - `organization_members`

### New backend modules

- `server/interfaces/organization/Organization.ts`
- `server/repositories/organizationRepository.ts`
- `server/controllers/organizationController.ts`
- `server/routes/organizationRoutes.ts`

### New/updated APIs

Auth:

- `PUT /api/auth/profile` updates current user profile.

Organizations:

- `POST /api/organizations` create organization with plan.
- `GET /api/organizations` list organizations for current user.
- `GET /api/organizations/:id/members` list members.
- `POST /api/organizations/:id/members` assign member by email.
- `PATCH /api/organizations/:id/plan` change plan.

Workspaces:

- `POST /api/workspaces` now accepts optional `plan`.

## Frontend Changes

### Routes

- `/` public home page
- `/pricing` public pricing page
- `/app` authenticated API dashboard
- `/profile` authenticated profile + organization management

### New frontend components

- `client/src/components/marketing/HomePage.jsx`
- `client/src/components/marketing/PricingPage.jsx`
- `client/src/components/settings/ProfilePage.jsx`

### Dashboard updates

- Added quick navigation to Home, Pricing, and Profile.
- Workspace creation modal now includes plan selection.

### API client updates (`client/src/api.js`)

- `updateProfile`
- `getOrganizations`
- `createOrganization`
- `getOrganizationMembers`
- `addOrganizationMember`
- `updateOrganizationPlan`
- `createWorkspace` now includes plan parameter

## Tests Added/Updated

- Added `server/tests/routes/organization.test.ts`
- Updated `server/tests/routes/auth.test.ts` with profile update test
- Updated workspace-related tests to match workspace plan column

## Notes

- Organization member assignment requires existing user email.
- Organization seat limits are enforced at API layer.
- Only one organization can be created per owner account.
- If an owner already has duplicate organizations from older data, extras are auto-removed and one latest organization is kept.
- Organization plan defaults to `free` and can be switched to `business` from profile settings.
- No Stripe/payment workflow is required for this release.
