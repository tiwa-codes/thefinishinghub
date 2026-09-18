import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import PrivacyPage from "./page";

vi.mock("@/components/site-nav-section", () => ({
  SiteNavSection: () => <div>Nav (stubbed in tests)</div>,
}));
vi.mock("@/components/site-footer-section", () => ({
  SiteFooterSection: () => <footer>Footer (stubbed in tests)</footer>,
}));

describe("PrivacyPage", () => {
  it("renders the NDPA rights section with the real contact details", () => {
    render(<PrivacyPage />);
    expect(screen.getByRole("heading", { name: "Your rights (NDPA 2023)" })).toBeInTheDocument();
    expect(screen.getByText(/Nigeria Data Protection Act 2023/)).toBeInTheDocument();
    expect(screen.getAllByText(/thefinishinghubng@gmail.com/).length).toBeGreaterThan(0);
  });

  it("renders the Payments section mentioning Paystack", () => {
    render(<PrivacyPage />);
    expect(screen.getByText(/Payments are processed by Paystack/)).toBeInTheDocument();
  });

  it("never mentions Bajgio outside the (stubbed) footer — CLAUDE.md restricts it to the footer trademark line", () => {
    render(<PrivacyPage />);
    expect(screen.queryByText(/Bajgio/)).toBeNull();
  });
});
