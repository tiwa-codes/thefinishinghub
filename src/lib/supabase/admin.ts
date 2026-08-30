import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// Service-role client — bypasses RLS entirely. There is deliberately no
// UPDATE policy on `orders` (see 20260813180000_v1_schema.sql: "writes
// happen server-side"), so this is the only way anything can mark an order
// paid. Only ever call this from trusted server-only code (Route Handlers,
// Server Components) that never runs in a context reachable from a
// customer's own session input — the payment webhook has no user session
// at all, which is exactly why this exists. Never import this into a
// "use client" file; never send SUPABASE_SERVICE_ROLE_KEY to the browser.
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}
