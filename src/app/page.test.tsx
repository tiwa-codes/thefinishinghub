import { describe, expect, it, vi } from "vitest";
import { render, within } from "@testing-library/react";
import Home from "@/app/page";
import { CartProvider } from "@/lib/cart-context";

// NewArrivalsSection, SiteNavSection, and SiteFooterSection are all async
// Server Components that query Supabase — RTL/jsdom's plain client
// renderer can't await a Promise-returning component (that's RSC-runtime
// machinery Next.js provides, not something @testing-library/react
// reproduces), so they're stubbed out here. Their real content is covered
// by dedicated tests instead: new-arrivals-grid.test.tsx,
// site-nav.test.tsx, site-footer.test.tsx (all rendering the real
// presentational component with fixture props).
vi.mock("@/components/home/new-arrivals-section", () => ({
  NewArrivalsSection: () => <section>New arrivals (stubbed in tests)</section>,
}));
vi.mock("@/components/site-nav-section", () => ({
  SiteNavSection: () => <div>Nav (stubbed in tests)</div>,
}));
vi.mock("@/components/site-footer-section", () => ({
  SiteFooterSection: () => <footer>Footer (stubbed in tests)</footer>,
}));

function renderHome() {
  return render(
    <CartProvider>
      <Home />
    </CartProvider>,
  );
}

describe("Home page", () => {
  it("has no product carousel anywhere", () => {
    const { container } = renderHome();
    expect(
      container.querySelector('[aria-roledescription="carousel"]'),
    ).toBeNull();
    expect(container.querySelector('[class*="carousel" i]')).toBeNull();
    expect(container.querySelector('[class*="slider" i]')).toBeNull();
  });

  it("shows the real contact facts verbatim in the Visit section", () => {
    renderHome();
    const showroom = document.getElementById("showroom");
    expect(showroom).not.toBeNull();
    const scoped = within(showroom as HTMLElement);
    expect(
      scoped.getByText(
        "Suites 2B–2E, AA Lukoro Plaza, Plot 1120, Oladipo Diya Way, Gudu District, Abuja",
      ),
    ).toBeInTheDocument();
    expect(scoped.getByText("+234 (0) 803 311 7302")).toBeInTheDocument();
    expect(scoped.getByText(/9am–6pm/)).toBeInTheDocument();
  });

  it("renders a footer landmark", () => {
    // Real Bajgio-placement coverage (footer-only, not elsewhere on the
    // page) lives in site-footer.test.tsx against the real component —
    // SiteFooterSection is stubbed here, so this is just structural.
    const { container } = renderHome();
    expect(container.querySelector("footer")).not.toBeNull();
  });
});
