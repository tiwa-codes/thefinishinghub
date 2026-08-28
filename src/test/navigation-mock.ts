import { vi } from "vitest";

// Shared with vitest.setup.ts's global next/navigation mock — real
// next/navigation hooks require an actual Next.js App Router context,
// which RTL/jsdom doesn't provide; components like FilterBar that call
// useRouter()/usePathname() would otherwise crash on render in tests.
export const routerPushMock = vi.fn();
export const pathnameMock = vi.fn(() => "/furniture/living");
