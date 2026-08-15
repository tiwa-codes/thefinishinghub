import { vi } from "vitest";

// Shared with vitest.setup.ts's global client mock and importable by any
// test file that needs to assert on an RPC call.
export const rpcMock = vi.fn(async () => ({ data: null, error: null }));

export function makeQueryStub(result: { data: unknown; error: unknown }) {
  const stub: {
    select: () => typeof stub;
    eq: () => typeof stub;
    order: () => typeof stub;
    limit: () => typeof stub;
    update: () => typeof stub;
    returns: () => typeof stub;
    insert: () => Promise<typeof result>;
    maybeSingle: () => Promise<typeof result>;
    then: (resolve: (value: typeof result) => void) => void;
  } = {
    select: () => stub,
    eq: () => stub,
    order: () => stub,
    limit: () => stub,
    update: () => stub,
    returns: () => stub,
    insert: () => Promise.resolve(result),
    maybeSingle: () => Promise.resolve(result),
    then: (resolve) => resolve(result),
  };
  return stub;
}
