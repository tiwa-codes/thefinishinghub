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

// Same as createPublicClient, but for routes that need a real-time-accurate
// read on every request — the filtered/sorted listing pages (subcategory
// pages, category "all" pages, /search). `dynamic = "force-dynamic"` on
// those routes stops the *rendered HTML response* from being cached, but
// verified live: the underlying Supabase fetch() call was still returning
// a stale response after a real data change on an already-warm `next
// start` server process — some layer beneath route-level config was still
// caching it. Passing cache: "no-store" directly on the fetch call itself
// removes any ambiguity about which layer is responsible.
export function createUncachedPublicClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
      },
    },
  );
}
