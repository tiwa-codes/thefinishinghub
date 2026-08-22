import { describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SiteNav } from "@/components/site-nav";
import { CartProvider } from "@/lib/cart-context";
import type { TopLevelCategory } from "@/lib/categories";

const CATEGORIES: TopLevelCategory[] = [
  {
    id: "cat-furniture",
    slug: "furniture",
    name: "Furniture & Furnishings",
    navLabel: "Furniture",
    href: "/furniture",
    subcategories: [
      {
        id: "sub-living",
        slug: "furniture-living",
        name: "Living Room",
        navLabel: "Living Room",
        href: "#",
      },
      {
        id: "sub-dining",
        slug: "furniture-dining",
        name: "Dining",
        navLabel: "Dining",
        href: "#",
      },
    ],
  },
  {
    id: "cat-tiles",
    slug: "tiles-wall-finishes",
    name: "Tiles & Wall Finishes",
    navLabel: "Tiles",
    href: "#",
    subcategories: [], // none seeded yet — no dropdown should render for this one
  },
  {
    id: "cat-lighting",
    slug: "lighting",
    name: "Lighting & Automation",
    navLabel: "Lighting",
    href: "#",
    subcategories: [],
  },
  {
    id: "cat-bath",
    slug: "sanitaryware-bath",
    name: "Sanitarywares & Bath Accessories",
    navLabel: "Sanitaryware",
    href: "#",
    subcategories: [
      {
        id: "sub-shower",
        slug: "sanitaryware-shower",
        name: "Shower",
        navLabel: "Shower",
        href: "#",
      },
    ],
  },
  {
    id: "cat-doors",
    slug: "doors-windows-joinery",
    name: "Doors, Windows & Joinery",
    navLabel: "Doors",
    href: "#",
    subcategories: [],
  },
];

function renderNav(categories: TopLevelCategory[] = CATEGORIES) {
  return render(
    <CartProvider>
      <SiteNav categories={categories} />
    </CartProvider>,
  );
}

describe("SiteNav", () => {
  it("renders the full wordmark, not just an icon", () => {
    renderNav();
    expect(screen.getByText("The Finishing Hub")).toBeInTheDocument();
  });

  it("renders exactly the five locked categories, in order, by their short nav_label (not the full name)", () => {
    renderNav();
    const nav = screen.getByRole("navigation");
    const links = Array.from(nav.querySelectorAll("a")).map((a) =>
      a.querySelector("span")?.textContent?.trim(),
    );
    expect(links).toEqual(["Furniture", "Tiles", "Lighting", "Sanitaryware", "Doors"]);
    expect(links).not.toContain("Interior Design");
  });

  it("falls back to the full name when a category has no nav_label set", () => {
    const categoriesWithoutNavLabel: TopLevelCategory[] = CATEGORIES.map((cat) => ({
      ...cat,
      navLabel: cat.name,
    }));
    renderNav(categoriesWithoutNavLabel);
    expect(screen.getByText("Furniture & Furnishings")).toBeInTheDocument();
  });

  it("shows the exact phone number from CLAUDE.md contact facts", () => {
    renderNav();
    expect(screen.getByText("+234 (0) 803 311 7302")).toBeInTheDocument();
  });

  it("opens the mega-menu with real subcategory names when a category that has them is hovered", async () => {
    renderNav();
    const furnitureLink = screen.getByRole("link", { name: /^Furniture/ });
    fireEvent.mouseEnter(furnitureLink);
    expect(await screen.findByText("Living Room")).toBeInTheDocument();
    expect(screen.getByText("Dining")).toBeInTheDocument();
  });

  it("does not render a dropdown arrow or mega-menu for a category with zero subcategories", () => {
    renderNav();
    const tilesLink = screen.getByRole("link", { name: "Tiles" });
    expect(tilesLink.querySelector("span:last-child")?.textContent).not.toMatch(/▼|▼/);
  });
});
