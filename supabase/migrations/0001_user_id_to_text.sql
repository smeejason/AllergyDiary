-- Session 2: switch entries.user_id from uuid to text.
-- Azure Static Web Apps' x-ms-client-principal.userId is a stable hash
-- string but not a UUID, so we widen the column to text.
-- Run this in Supabase SQL Editor.

alter table entries
  alter column user_id type text using user_id::text;

create index if not exists entries_user_id_created_idx
  on entries (user_id, created_at desc);
