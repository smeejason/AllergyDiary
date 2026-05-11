# Allergy Diary

A personal allergy and health diary for Whenuapai, Auckland. See
[`PLAN.md`](./PLAN.md) for the full design and roadmap. This README only
covers what's needed to run what currently exists.

## Current status

**Phase 1, Session 1 — Scaffold and prove the loop.**

What works:

- Next.js 16 + TypeScript + Tailwind app
- Daily log screen: 1–5 overall score, six symptom sliders, medications
  toggles, free-text notes
- `POST /api/entries` writes to Supabase; `GET /api/entries` returns the
  50 most recent entries (used in Session 3 for the history view)
- SQL schema for the `entries` table in [`supabase/schema.sql`](./supabase/schema.sql)

Not yet built (planned phases):

- Microsoft Entra ID auth (Session 2)
- Pollen / weather / wind enrichment (Session 2)
- PWA + Apple Shortcuts mobile capture (Session 3)
- Apple Health bridge (Session 4)
- Scheduled environmental snapshots (Session 5)

## Prerequisites

- Node.js 20+
- A Supabase project (free tier, recommended region: ap-southeast-2 Sydney)

## Setup

1. Create a Supabase project at <https://supabase.com>.
2. In Supabase → SQL Editor, paste and run [`supabase/schema.sql`](./supabase/schema.sql).
3. Copy environment variables:

   ```bash
   cp .env.example .env.local
   ```

   Fill in `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from
   Supabase → Project Settings → API.

4. Install and run:

   ```bash
   npm install
   npm run dev
   ```

   Open <http://localhost:3000>.

## Verifying the loop

1. Fill in the form and click **Save entry**.
2. In Supabase → Table Editor → `entries`, confirm a row appears.

## Scripts

- `npm run dev` — Next.js dev server
- `npm run build` — production build
- `npm run start` — run the production build
- `npm run lint` — ESLint

## Notes on auth and RLS

Phase 1 has no auth. The API route uses the service-role key server-side
and RLS is disabled on `entries`. Don't expose this deployment publicly
until Session 2 lands Entra ID + RLS.
