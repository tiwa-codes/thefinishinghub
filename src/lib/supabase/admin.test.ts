import { describe, expect, it, afterEach } from "vitest";
import { createAdminClient } from "./admin";

// createAdminClient's old `!` non-null assertions were compile-time only —
// with the service-role key actually missing at runtime (e.g. not set in
// Vercel's Production environment), it must throw a descriptive error
// instead of letting supabase-js's own generic "supabaseKey is required."
// crash the page with no indication of which env var or where to fix it.
const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("createAdminClient", () => {
  it("throws a descriptive error naming the missing var when SUPABASE_SERVICE_ROLE_KEY is unset", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    expect(() => createAdminClient()).toThrowError(/SUPABASE_SERVICE_ROLE_KEY/);
  });

  it("throws a descriptive error naming the missing var when NEXT_PUBLIC_SUPABASE_URL is unset", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";

    expect(() => createAdminClient()).toThrowError(/NEXT_PUBLIC_SUPABASE_URL/);
  });

  it("constructs a client without throwing when both env vars are present", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";

    expect(() => createAdminClient()).not.toThrow();
  });
});
