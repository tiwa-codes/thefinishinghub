import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import AboutPage from "./page";

vi.mock("@/components/site-nav-section", () => ({
  SiteNavSection: () => <div>Nav (stubbed in tests)</div>,
}));
vi.mock("@/components/site-footer-section", () => ({
  SiteFooterSection: () => <footer>Footer (stubbed in tests)</footer>,
}));

describe("AboutPage", () => {
  it("renders the real showroom address, hours and phone verbatim", () => {
    render(<AboutPage />);
    expect(
      screen.getByText(
        "Suites 2B–2E, AA Lukoro Plaza, Plot 1120, Oladipo Diya Way, Gudu District, Abuja",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Mon–Sat, 9am–6pm")).toBeInTheDocument();
    expect(screen.getByText("+234 (0) 803 311 7302")).toBeInTheDocument();
  });

  it("renders the hero heading and story sections", () => {
    render(<AboutPage />);
    expect(
      screen.getByRole("heading", { name: "Where the Room Comes Together" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/most people building or furnishing a home/)).toBeInTheDocument();
  });

  it("never mentions NBH anywhere on the page", () => {
    render(<AboutPage />);
    expect(screen.queryByText(/NBH/)).toBeNull();
  });

  it("links Book a visit to the real phone number", () => {
    render(<AboutPage />);
    expect(screen.getByRole("link", { name: "Book a visit" })).toHaveAttribute(
      "href",
      "tel:+2348033117302",
    );
  });

  it("never mentions Bajgio outside the (stubbed) footer — CLAUDE.md restricts it to the footer trademark line", () => {
    render(<AboutPage />);
    expect(screen.queryByText(/Bajgio/)).toBeNull();
  });
});
