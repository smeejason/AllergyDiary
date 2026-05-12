-- Allergy Diary — initial schema
-- Run this in the Supabase SQL editor for a new project.
-- Region recommended: ap-southeast-2 (Sydney).

create extension if not exists "uuid-ossp";

create table if not exists entries (
  id uuid primary key default uuid_generate_v4(),
  user_id text,
  created_at timestamptz not null default now(),
  entry_date date not null default current_date,
  overall_score int not null check (overall_score between 1 and 5),
  symptoms jsonb not null default '{}'::jsonb,
  notes text,
  medications_taken text[] not null default '{}',
  environmental_snapshot jsonb,
  local_events jsonb
);

create index if not exists entries_entry_date_idx on entries (entry_date desc);
create index if not exists entries_user_id_idx on entries (user_id);

-- RLS is left off in Phase 1 (no auth yet). Phase 2 will turn it on once
-- Microsoft Entra ID is wired through Azure Static Web Apps and we have a
-- stable user_id to key off.
alter table entries disable row level security;
