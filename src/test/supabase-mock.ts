import { vi } from "vitest";

// Shared with vitest.setup.ts's global client mock and importable by any
// test file that needs to assert on an RPC call.
export const rpcMock = vi.fn(async () => ({ data: null, error: null }));

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
