import { vi } from "vitest";

// Shared with vitest.setup.ts's global client mock and importable by any
// test file that needs to assert on an RPC call. Typed broadly (args as
// unknown[], return as `unknown` data / `{ message }` error) so individual
// tests can call it with any RPC name/params and override the resolved
// value per-call (e.g. create_order's real order row, or a PostgREST
// exception message) without fighting inference from a single narrow
// default implementation.
export const rpcMock = vi.fn<
  (...args: unknown[]) => Promise<{ data: unknown; error: { message: string } | null }>
>(async () => ({ data: null, error: null }));

export function makeQueryStub(result: { data: unknown; error: unknown }) {
  const stub: {
    select: (...args: unknown[]) => typeof stub;
    eq: (...args: unknown[]) => typeof stub;
    order: (...args: unknown[]) => typeof stub;
    limit: (...args: unknown[]) => typeof stub;
    update: (...args: unknown[]) => typeof stub;
    delete: (...args: unknown[]) => typeof stub;
    returns: (...args: unknown[]) => typeof stub;
    insert: (...args: unknown[]) => Promise<typeof result>;
    maybeSingle: (...args: unknown[]) => Promise<typeof result>;
    then: (resolve: (value: typeof result) => void) => void;
  } = {
    select: vi.fn(() => stub),
    eq: vi.fn(() => stub),
    order: vi.fn(() => stub),
    limit: vi.fn(() => stub),
    update: vi.fn(() => stub),
    delete: vi.fn(() => stub),
    returns: vi.fn(() => stub),
    insert: vi.fn(() => Promise.resolve(result)),
    maybeSingle: vi.fn(() => Promise.resolve(result)),
    then: (resolve) => resolve(result),
  };
  return stub;
}

// Shared with vitest.setup.ts's global client mock — lets any test assert
// which table a mutation targeted (e.g. cart-context's setItemQuantity/
// removeItem going through "cart_items"), same way rpcMock covers add().
export const fromMock = vi.fn(() => makeQueryStub({ data: [], error: null }));

// Shared with vitest.setup.ts's global client mock — for the admin login
// form (signInWithPassword) and logout button (signOut). Typed broadly
// (error as `{ message: string } | null`) so individual tests can
// override with mockResolvedValueOnce to simulate a failed sign-in.
export const signInWithPasswordMock = vi.fn(
  async (): Promise<{
    data: { user: null; session: null };
    error: { message: string } | null;
  }> => ({
    data: { user: null, session: null },
    error: null,
  }),
);
export const signOutMock = vi.fn(async () => ({ error: null }));

type MockSession = {
  user: { id: string; is_anonymous?: boolean; email?: string | null };
} | null;

// CartProvider (auth-state-reactive since the checkout feature) and
// ResetPasswordForm (listens for "PASSWORD_RECOVERY") both subscribe via
// onAuthStateChange — every test rendering either would otherwise throw on
// `supabase.auth.onAuthStateChange is not a function`. Keeps the most
// recently registered callback so a test can simulate a real event (signup/
// login/logout/PASSWORD_RECOVERY) via emitAuthStateChange below.
let latestAuthStateChangeCallback: ((event: string, session: MockSession) => void) | null = null;

export const onAuthStateChangeMock = vi.fn(
  (callback: (event: string, session: MockSession) => void) => {
    latestAuthStateChangeCallback = callback;
    return { data: { subscription: { unsubscribe: vi.fn() } } };
  },
);

export function emitAuthStateChange(event: string, session: MockSession) {
  latestAuthStateChangeCallback?.(event, session);
}

export const updateUserMock = vi.fn(
  async (): Promise<{ data: unknown; error: { message: string } | null }> => ({
    data: { user: null },
    error: null,
  }),
);
export const signUpMock = vi.fn(
  async (): Promise<{ data: unknown; error: { message: string } | null }> => ({
    data: { user: null, session: null },
    error: null,
  }),
);
export const resetPasswordForEmailMock = vi.fn(
  async (): Promise<{ data: unknown; error: { message: string } | null }> => ({
    data: {},
    error: null,
  }),
);
