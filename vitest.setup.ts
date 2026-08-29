import "@testing-library/jest-dom/vitest";
import { vi, beforeEach } from "vitest";
import {
  fromMock,
  rpcMock,
  signInWithPasswordMock,
  signOutMock,
  onAuthStateChangeMock,
  updateUserMock,
  signUpMock,
  resetPasswordForEmailMock,
} from "@/test/supabase-mock";
import { routerPushMock, pathnameMock } from "@/test/navigation-mock";

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
      signInWithPassword: signInWithPasswordMock,
      signOut: signOutMock,
      onAuthStateChange: onAuthStateChangeMock,
      updateUser: updateUserMock,
      signUp: signUpMock,
      resetPasswordForEmail: resetPasswordForEmailMock,
    },
    from: fromMock,
    rpc: rpcMock,
  }),
}));

// Real next/navigation hooks need an actual App Router context, which
// RTL/jsdom doesn't provide — FilterBar (useRouter/usePathname) and the
// admin pages that use useRouter would otherwise crash on render.
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: routerPushMock,
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => pathnameMock(),
}));

beforeEach(() => {
  rpcMock.mockClear();
  fromMock.mockClear();
  signInWithPasswordMock.mockClear();
  signOutMock.mockClear();
  onAuthStateChangeMock.mockClear();
  updateUserMock.mockClear();
  signUpMock.mockClear();
  resetPasswordForEmailMock.mockClear();
  routerPushMock.mockClear();
  pathnameMock.mockClear();
});
