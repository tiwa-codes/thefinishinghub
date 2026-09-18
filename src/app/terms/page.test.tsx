import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import TermsPage from "./page";

vi.mock("@/components/site-nav-section", () => ({
  SiteNavSection: () => <div>Nav (stubbed in tests)</div>,
}));
vi.mock("@/components/site-footer-section", () => ({
  SiteFooterSection: () => <footer>Footer (stubbed in tests)</footer>,
}));

describe("TermsPage", () => {
  it("renders the returns policy with the 7-day window and contact details", () => {
    render(<TermsPage />);
    expect(screen.getByRole("heading", { name: "Returns and exchanges" })).toBeInTheDocument();
    expect(screen.getByText(/returns within 7 days of delivery/)).toBeInTheDocument();
    expect(screen.getByText(/Custom or made-to-order items are non-returnable/)).toBeInTheDocument();
  });

  it("renders the warranty section", () => {
    render(<TermsPage />);
    expect(screen.getByText(/10-year warranty against manufacturing defects/)).toBeInTheDocument();
  });

  it("never mentions Bajgio outside the (stubbed) footer — CLAUDE.md restricts it to the footer trademark line", () => {
    render(<TermsPage />);
    expect(screen.queryByText(/Bajgio/)).toBeNull();
  });
});
