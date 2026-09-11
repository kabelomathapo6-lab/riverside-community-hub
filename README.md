# Riverside Community Hub

A full-stack membership, booking, and donations platform for a fictional
non-profit community centre. This is my Company Project 3 capstone for the
Melsoft Academy AI Software Development Programme.

Riverside Community Hub runs youth programmes, a community gym, event rooms, and
a food-parcel donation drive. Before this app they tracked everything on paper
and WhatsApp. This platform brings three things into one place: a membership
portal, a booking system with staff approval, and a donation platform with
reporting.

## What it does

- **Public visitors** can browse facilities, see availability, view the donation
  drive progress, and donate (no account needed).
- **Members** can sign up, manage their profile, book resources, and cancel
  their own bookings.
- **Staff** can approve or reject bookings, manage resources, and view the
  member directory.
- **Admins** can do everything staff can, plus view the donation report, export
  it to CSV, and manage campaigns.

## Tech stack

- **Frontend:** React + TypeScript + Vite, React Router, Tailwind CSS.
- **Backend:** Node.js + Express + TypeScript.
- **Database and auth:** Supabase (PostgreSQL, Supabase Auth, Row Level Security).
- **Shared:** a single `shared/types.ts` describes the API shapes, so the
  frontend and backend agree on every contract.

## Repository structure

```
riverside-community-hub/
  backend/          Express + TypeScript API
    src/
      lib/          Supabase clients (admin + per-user)
      middleware/   auth, requireStaff, logger, errorHandler
      routes/       profiles, resources, bookings, donations,
                    campaigns, notifications
      server.ts     app entry point
  frontend/         Vite + React + TypeScript app
    src/
      lib/          Supabase client, API helper, auth context
      components/   RequireAuth route guard
      pages/        Home, Login, Dashboard, Facilities, BookResource,
                    MyBookings, Donate, Admin
      types/        frontend copy of the shared types
  shared/
    types.ts        single source of truth for API shapes
  docs/             design docs (user stories, ERD, wireframes,
                    API contract) and this phase's reference docs
```

## Architecture overview

The frontend never talks to the database directly for protected data. It talks
to the Express API, which talks to Supabase. Two ideas keep this secure:

1. **Two Supabase clients on the backend.** An admin client (service-role key)
   for trusted server actions, and a per-request client that carries the logged
   in user's token so Row Level Security still applies. The service-role key
   never leaves the backend.
2. **Row Level Security on every table.** Even if the frontend had a bug, the
   database itself refuses to return rows a user is not allowed to see. This is
   enforced with policies built around `auth.uid()`, not with hidden UI.

Double-booking is prevented at the database level with a PostgreSQL exclusion
constraint, not just in the UI, so two overlapping bookings for the same
resource can never both exist.

## Running it locally

You need Node.js (v20 or newer) and a Supabase project.

### 1. Backend

```
cd backend
npm install
```

Create `backend/.env` from the example and fill in your Supabase values:

```
PORT=4000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-keep-secret
SUPABASE_ANON_KEY=your-anon-key
```

Then:

```
npm run build
npm start
```

The API runs on http://localhost:4000. Check http://localhost:4000/health.

### 2. Frontend

```
cd frontend
npm install
```

Create `frontend/.env.local`:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=http://localhost:4000
```

Then:

```
npm run dev
```

The app runs on http://localhost:5173.

### 3. Database

The SQL that creates the schema, the double-booking constraint, the
auto-profile trigger, Row Level Security policies, and seed data is documented
in `docs/`. Run it in the Supabase SQL editor to set up a fresh project.

## Environment variables

| Variable | Where | Secret? | Purpose |
|----------|-------|---------|---------|
| SUPABASE_URL | backend | no | Supabase project URL |
| SUPABASE_SERVICE_ROLE_KEY | backend only | YES | trusted server actions, bypasses RLS |
| SUPABASE_ANON_KEY | backend | no | public key for user-scoped clients |
| VITE_SUPABASE_URL | frontend | no | same project URL |
| VITE_SUPABASE_ANON_KEY | frontend | no | public key, safe in the browser |
| VITE_API_URL | frontend | no | where the backend API lives |

The service-role key is the only true secret. It lives only in `backend/.env`,
which is gitignored and never committed.

## Demo logins

Three demo accounts show the app from each role (password `Demo1234!`):

| Email | Role |
|-------|------|
| member@riverside.demo | Member |
| staff@riverside.demo | Staff |
| admin@riverside.demo | Admin |

## Known limitations

- The types live in two places (`shared/types.ts` and a copy in
  `frontend/src/types/shared.ts`). They are kept in sync by hand. A cleaner
  setup would have the frontend import the root file directly.
- Recurring donations are recorded as an intention only. There is no real
  recurring billing, which the brief allows.
- Notifications are in-app only, not email.
- No real payment gateway. Donations record an amount only.

## Project status

Built stage by stage following the brief's own timeline: design docs, then
schema and auth, then core features, then donations and reporting, then polish,
and finally deployment. Every stage was committed with a clear history.
