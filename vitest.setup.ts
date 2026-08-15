import "@testing-library/jest-dom/vitest";
import { vi, beforeEach } from "vitest";
import { makeQueryStub, rpcMock } from "@/test/supabase-mock";

// Every test that renders <CartProvider> (SiteNav, Home) triggers its
// mount effect, which otherwise calls the real Supabase project — slow,
// network-dependent, and it would create a throwaway anonymous user on
// every test run. Mock the browser client globally instead.
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      signInAnonymously: async () => ({
        data: {
          user: { id: "test-anon-user" },
          session: { access_token: "test-token" },
        },
        error: null,
      }),
    },
    from: () => makeQueryStub({ data: [], error: null }),
    rpc: rpcMock,
  }),
}));

beforeEach(() => {
  rpcMock.mockClear();
});
