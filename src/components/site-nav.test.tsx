import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { SiteNav } from "@/components/site-nav";
import { CartProvider } from "@/lib/cart-context";

function renderNav() {
  return render(
    <CartProvider>
      <SiteNav />
    </CartProvider>,
  );
}

describe("SiteNav", () => {
  it("renders the full wordmark, not just an icon", () => {
    renderNav();
    expect(screen.getByText("The Finishing Hub")).toBeInTheDocument();
  });

  it("renders exactly the five locked categories, in order, with no Interior Design entry", () => {
    renderNav();
    const nav = screen.getByRole("navigation");
    const links = Array.from(nav.querySelectorAll("a")).map((a) =>
      a.querySelector("span")?.textContent?.trim(),
    );
    expect(links).toEqual([
      "Furniture",
      "Tiles & Finishes",
      "Lighting",
      "Bath",
      "Doors & Joinery",
    ]);
    expect(links).not.toContain("Interior Design");
  });

  it("shows the exact phone number from CLAUDE.md contact facts", () => {
    renderNav();
    expect(screen.getByText("+234 (0) 803 311 7302")).toBeInTheDocument();
  });
});
