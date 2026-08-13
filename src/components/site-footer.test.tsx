import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { SiteFooter } from "@/components/site-footer";

describe("SiteFooter", () => {
  it("mentions Bajgio only in the trademark line and badge", () => {
    render(<SiteFooter />);
    expect(screen.getAllByText(/A trademark of/).length).toBeGreaterThan(0);
    expect(screen.getByRole("img", { name: "Bajgio" })).toBeInTheDocument();
  });

  it("shows the Paystack payments line", () => {
    render(<SiteFooter />);
    expect(screen.getByText("Paystack")).toBeInTheDocument();
  });
});
