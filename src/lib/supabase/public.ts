import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// For public, unauthenticated, cacheable reads only (e.g. the published
// product catalog) — deliberately does NOT touch cookies()/next/headers.
// Calling cookies() anywhere in a route's render path forces that route
// into fully dynamic rendering regardless of a `revalidate` export; this
// client exists so catalog reads can stay ISR-eligible. Never use this
// for cart/auth/anything user-specific — use server.ts for that.
export function createPublicClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
