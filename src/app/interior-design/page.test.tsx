import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import InteriorDesignPage from "./page";

vi.mock("@/components/site-nav-section", () => ({
  SiteNavSection: () => <div>Nav (stubbed in tests)</div>,
}));
vi.mock("@/components/site-footer-section", () => ({
  SiteFooterSection: () => <footer>Footer (stubbed in tests)</footer>,
}));

describe("InteriorDesignPage", () => {
  it("renders the hero heading and the three service pillars", () => {
    render(<InteriorDesignPage />);
    expect(screen.getByRole("heading", { name: "Design services, end to end." })).toBeInTheDocument();
    expect(screen.getByText("Concept & Planning")).toBeInTheDocument();
    expect(screen.getByText("Sourcing & Supply")).toBeInTheDocument();
    expect(screen.getByText("Delivery & Install")).toBeInTheDocument();
  });

  it("renders the project enquiry contact form", () => {
    render(<InteriorDesignPage />);
    expect(screen.getByLabelText("Full name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Phone number")).toBeInTheDocument();
    expect(screen.getByLabelText("Project type")).toBeInTheDocument();
    expect(screen.getByLabelText("Budget range")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send enquiry" })).toBeInTheDocument();
  });
});
