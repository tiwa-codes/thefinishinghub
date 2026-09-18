import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import CheckoutCallbackPage from "./page";

// SiteNavSection/SiteFooterSection are async Server Components that query
// Supabase — RTL/jsdom can't render a Promise-returning component, same
// reasoning as src/app/page.test.tsx for the homepage. The page itself is
// also async, but calling it directly and rendering the resolved element
// (rather than <CheckoutCallbackPage .../> synchronously) sidesteps that.
vi.mock("@/components/site-nav-section", () => ({
  SiteNavSection: () => <div>Nav (stubbed in tests)</div>,
}));
vi.mock("@/components/site-footer-section", () => ({
  SiteFooterSection: () => <footer>Footer (stubbed in tests)</footer>,
}));

const maybeSingleMock = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: maybeSingleMock,
        }),
      }),
    }),
  }),
}));

vi.mock("@/lib/paystack", () => ({
  confirmPayment: vi.fn(),
}));

async function renderCallback(reference?: string) {
  const element = await CheckoutCallbackPage({
    searchParams: reference ? { reference } : {},
  });
  return render(element);
}

describe("CheckoutCallbackPage", () => {
  it("shows a 'not found' state when no order matches the reference", async () => {
    maybeSingleMock.mockResolvedValueOnce({ data: null, error: null });
    await renderCallback("TFH-does-not-exist");
    expect(screen.getByText("We couldn't find that order.")).toBeInTheDocument();
  });

  it("shows a generic error when no reference is provided at all", async () => {
    await renderCallback();
    expect(screen.getByText("Something went wrong.")).toBeInTheDocument();
    expect(screen.getByText("No payment reference was provided.")).toBeInTheDocument();
  });

  it("shows payment confirmed when the order is already paid", async () => {
    maybeSingleMock.mockResolvedValueOnce({
      data: { order_number: "TFH-123", status: "paid" },
      error: null,
    });
    await renderCallback("TFH-123-abcd");
    expect(screen.getByText("Payment confirmed.")).toBeInTheDocument();
    expect(screen.getByText("TFH-123")).toBeInTheDocument();
  });
});
