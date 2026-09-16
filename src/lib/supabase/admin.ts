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
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // The old `!` non-null assertions were compile-time only — with the key
  // actually missing at runtime (e.g. not set in Vercel's Production
  // environment), supabase-js's own constructor throws a generic
  // "supabaseKey is required." with no indication of *which* env var or
  // *where* to fix it, and an uncaught throw here crashes the whole page
  // with Next's opaque digest error. This throws something a Vercel log
  // reader can actually act on; callers that can render a smaller failure
  // (a redirect to /admin/login, a JSON 500) should catch it instead of
  // letting the page crash — see src/app/admin/(gated)/page.tsx.
  if (!url || !serviceRoleKey) {
    const missing = [
      !url && "NEXT_PUBLIC_SUPABASE_URL",
      !serviceRoleKey && "SUPABASE_SERVICE_ROLE_KEY",
    ]
      .filter(Boolean)
      .join(" and ");
    throw new Error(
      `createAdminClient: missing required env var(s): ${missing}. Set ${missing} in the Vercel project's Environment Variables (Production) and redeploy — admin pages cannot run without the service-role key.`,
    );
  }

  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}
