import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { SiteFooter } from "@/components/site-footer";
import type { CategoryNode } from "@/lib/categories";

const SHOP_CATEGORIES: Pick<CategoryNode, "id" | "slug" | "name" | "href">[] = [
  { id: "cat-furniture", slug: "furniture", name: "Furniture & Furnishings", href: "/furniture" },
  { id: "cat-tiles", slug: "tiles-wall-finishes", name: "Tiles & Wall Finishes", href: "/tiles-wall-finishes" },
];

describe("SiteFooter", () => {
  it("mentions Bajgio only in the trademark line and badge", () => {
    render(<SiteFooter shopCategories={SHOP_CATEGORIES} />);
    expect(screen.getAllByText(/A trademark of/).length).toBeGreaterThan(0);
    expect(screen.getByRole("img", { name: "Bajgio" })).toBeInTheDocument();
  });

  it("shows the Paystack payments line", () => {
    render(<SiteFooter shopCategories={SHOP_CATEGORIES} />);
    expect(screen.getByText("Paystack")).toBeInTheDocument();
  });

  it("renders the Shop column from real category data, plus the static New arrivals link", () => {
    render(<SiteFooter shopCategories={SHOP_CATEGORIES} />);
    expect(screen.getByText("Furniture & Furnishings")).toBeInTheDocument();
    expect(screen.getByText("Tiles & Wall Finishes")).toBeInTheDocument();
    expect(screen.getByText("New arrivals")).toBeInTheDocument();
  });

  it("shows an empty Shop column gracefully when no categories are given, without crashing", () => {
    render(<SiteFooter shopCategories={[]} />);
    expect(screen.getByText("New arrivals")).toBeInTheDocument();
  });

  it("links Interior Design, Projects, About and Contact to their real pages", () => {
    render(<SiteFooter shopCategories={SHOP_CATEGORIES} />);
    expect(screen.getByRole("link", { name: "Interior Design" })).toHaveAttribute(
      "href",
      "/interior-design",
    );
    expect(screen.getByRole("link", { name: "Projects" })).toHaveAttribute("href", "/gallery");
    expect(screen.getByRole("link", { name: "About" })).toHaveAttribute("href", "/about");
    expect(screen.getByRole("link", { name: "Contact" })).toHaveAttribute("href", "/#showroom");
  });

  it("links Privacy and Terms to their real policy pages", () => {
    render(<SiteFooter shopCategories={SHOP_CATEGORIES} />);
    expect(screen.getByRole("link", { name: "Privacy" })).toHaveAttribute("href", "/privacy");
    expect(screen.getByRole("link", { name: "Terms" })).toHaveAttribute("href", "/terms");
    expect(screen.getByRole("link", { name: "Delivery & Returns" })).toHaveAttribute(
      "href",
      "/terms",
    );
  });

  it("has no remaining dead '#' links", () => {
    render(<SiteFooter shopCategories={SHOP_CATEGORIES} />);
    const hrefs = screen.getAllByRole("link").map((link) => link.getAttribute("href"));
    expect(hrefs).not.toContain("#");
  });
});
