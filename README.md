# Riverside Community Hub

Full-stack membership, booking, and donations platform for a community NPO.
Built with React + TypeScript (frontend), Node + Express + TypeScript (backend),
and Supabase (Postgres, Auth, Row Level Security, Storage).

## Monorepo structure

```
riverside-hub/
├── backend/          Express + TypeScript API
│   └── src/
│       ├── server.ts       entry point, middleware, route mounting
│       ├── routes/         feature routes (auth, bookings, donations, admin)
│       ├── middleware/     logger + centralized error handler
│       ├── lib/            supabase clients (admin + per-user)
│       └── types/          backend-local types
├── frontend/         Vite + React + TypeScript + Tailwind
│   └── src/
│       ├── App.tsx         routed app shell
│       ├── lib/            browser supabase client (anon key only)
│       └── types/          shared domain types (copied from /shared)
└── shared/
    └── types.ts      single source of truth for API contract types
```

## Running locally

Backend:
```bash
cd backend
cp .env.example .env      # fill in your Supabase keys
npm install
npm run dev               # http://localhost:4000
```

Frontend:
```bash
cd frontend
cp .env.example .env.local  # fill in Supabase URL + anon key
npm install
npm run dev                 # http://localhost:5173
```

## Security notes (brief checkpoints)

- The Supabase **service-role key lives only in the backend** (`backend/.env`),
  never in frontend code.
- The frontend uses only the **public anon key**; data is protected by
  **Row Level Security** policies in Supabase, not by hidden UI.
- All secrets are in environment variables and git-ignored.

## Build status

This repo is being built in phases following the project brief timeline:
design → schema + RLS → core features → donations + reporting → polish → deploy.
