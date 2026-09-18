import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import TradeApplyPage from "./page";

vi.mock("@/components/site-nav-section", () => ({
  SiteNavSection: () => <div>Nav (stubbed in tests)</div>,
}));
vi.mock("@/components/site-footer-section", () => ({
  SiteFooterSection: () => <footer>Footer (stubbed in tests)</footer>,
}));

describe("TradeApplyPage", () => {
  it("renders the hero heading and benefit cards without requiring sign-in", () => {
    render(<TradeApplyPage />);
    expect(screen.getByRole("heading", { name: "Trade Program" })).toBeInTheDocument();
    expect(screen.getByText("Members-only pricing")).toBeInTheDocument();
    expect(screen.getByText("Priority access")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Sign in" })).toBeNull();
  });

  it("renders the trade application form", () => {
    render(<TradeApplyPage />);
    expect(screen.getByLabelText("Full name")).toBeInTheDocument();
    expect(screen.getByLabelText("Company name")).toBeInTheDocument();
    expect(screen.getByLabelText("Business type")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Apply now" })).toBeInTheDocument();
  });
});
