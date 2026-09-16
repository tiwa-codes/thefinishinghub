import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ResourcesPage from "./page";

// SiteNavSection/SiteFooterSection are async Server Components that query
// Supabase — RTL/jsdom can't render a Promise-returning component, same
// reasoning as src/app/page.test.tsx for the homepage.
vi.mock("@/components/site-nav-section", () => ({
  SiteNavSection: () => <div>Nav (stubbed in tests)</div>,
}));
vi.mock("@/components/site-footer-section", () => ({
  SiteFooterSection: () => <footer>Footer (stubbed in tests)</footer>,
}));

describe("ResourcesPage", () => {
  it("renders without error, with a heading and all four resource tiles", () => {
    render(<ResourcesPage />);
    expect(screen.getByRole("heading", { name: "Design Resources" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Gallery/ })).toHaveAttribute("href", "/gallery");
    expect(screen.getByRole("link", { name: /Design Services/ })).toHaveAttribute(
      "href",
      "/interior-design",
    );
    expect(screen.getByRole("link", { name: /Our Showroom/ })).toHaveAttribute("href", "/#showroom");
    expect(screen.getByRole("link", { name: /Trade Program/ })).toHaveAttribute(
      "href",
      "/trade/apply",
    );
  });
});
