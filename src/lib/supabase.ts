import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Server-only Supabase client. The service-role key MUST NOT leak to the
// browser, so this module is imported from API routes / server components
// only. Phase 1 has no auth, so we use the service role to write entries.
// Phase 2 will switch to RLS + anon key + Entra-authenticated user_id.
let cached: SupabaseClient | null = null;

export function getSupabaseServerClient(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. " +
        "Copy .env.example to .env.local and fill in your Supabase project values."
    );
  }

  cached = createClient(url, key, {
    auth: { persistSession: false },
  });
  return cached;
}
