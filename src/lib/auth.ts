// Phase 1: no auth. Every entry is owned by the single static user
// "owner". If/when we add real auth back, replace with a lookup that
// reads the SWA client principal and update existing rows in a migration.
const OWNER_USER_ID = "owner";

export type Principal = { userId: string };

export async function getPrincipal(): Promise<Principal> {
  return { userId: OWNER_USER_ID };
}
