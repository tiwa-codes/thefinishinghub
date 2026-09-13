import { describe, expect, it } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { SiteNav } from "@/components/site-nav";
import { CartProvider } from "@/lib/cart-context";
import type { TopLevelCategory } from "@/lib/categories";

// Matches NAV_CATEGORY_ORDER in lib/mega-menu-data.ts — Sanitaryware sits
// before Lighting here, unlike the categories table's display_order.
const CATEGORIES: TopLevelCategory[] = [
  { id: "cat-furniture", slug: "furniture", name: "Furniture & Furnishings", navLabel: "Furniture", href: "/furniture", subcategories: [] },
  { id: "cat-tiles", slug: "tiles-wall-finishes", name: "Tiles & Wall Finishes", navLabel: "Tiles", href: "/tiles-wall-finishes", subcategories: [] },
  { id: "cat-bath", slug: "sanitaryware-bath", name: "Sanitarywares & Bath Accessories", navLabel: "Sanitaryware", href: "/sanitaryware-bath", subcategories: [] },
  { id: "cat-lighting", slug: "lighting", name: "Lighting & Automation", navLabel: "Lighting", href: "/lighting", subcategories: [] },
  { id: "cat-doors", slug: "doors-windows-joinery", name: "Doors, Windows & Joinery", navLabel: "Doors", href: "/doors-windows-joinery", subcategories: [] },
  { id: "cat-kitchens", slug: "kitchens", name: "Kitchens", navLabel: "Kitchens", href: "/kitchens", subcategories: [] },
  { id: "cat-outdoor", slug: "outdoor", name: "Outdoor", navLabel: "Outdoor", href: "/outdoor", subcategories: [] },
  { id: "cat-decor", slug: "decor", name: "Decor", navLabel: "Decor", href: "/decor", subcategories: [] },
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

  it("renders exactly the eight locked categories in order, by their short nav_label (not the full name), plus a Shop by trigger", () => {
    renderNav();
    const nav = screen.getByRole("navigation", { name: "Product categories" });
    const links = Array.from(nav.querySelectorAll("a")).map((a) => a.querySelector("span")?.textContent?.trim());
    expect(links).toEqual([
      "Furniture",
      "Tiles",
      "Sanitaryware",
      "Lighting",
      "Doors",
      "Kitchens",
      "Outdoor",
      "Decor",
    ]);
    expect(links).not.toContain("Interior Design");
    expect(within(nav).getByRole("button", { name: /Shop by/ })).toBeInTheDocument();
  });

  it("falls back to the full name when a category has no nav_label set", () => {
    const categoriesWithoutNavLabel: TopLevelCategory[] = CATEGORIES.map((cat) => ({
      ...cat,
      navLabel: cat.name,
    }));
    renderNav(categoriesWithoutNavLabel);
    expect(screen.getByText("Furniture & Furnishings")).toBeInTheDocument();
  });

  it("shows the gold Visit the Showroom CTA linking to the homepage showroom section", () => {
    renderNav();
    expect(screen.getByRole("link", { name: "Visit the Showroom" })).toHaveAttribute(
      "href",
      "/#showroom",
    );
  });

  it("renders the right-zone service links: Design Resources, New Arrivals, Trade Program", () => {
    renderNav();
    expect(screen.getByRole("link", { name: /^Design Resources/ })).toHaveAttribute("href", "/resources");
    expect(screen.getByRole("link", { name: "New Arrivals" })).toHaveAttribute("href", "/#new-arrivals");
    expect(screen.getByRole("link", { name: "Trade Program" })).toHaveAttribute("href", "/trade/apply");
  });

  it("renders account, wishlist, and cart icon links, with a cart count badge when the cart has items", () => {
    renderNav();
    expect(screen.getByRole("link", { name: "Account" })).toHaveAttribute("href", "/account");
    expect(screen.getByRole("link", { name: "Wishlist" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^Cart, 0 items/ })).toBeInTheDocument();
  });

  it("opens the mega-menu with real subcategory names 100ms after hovering a category, and only one dropdown is open at a time", async () => {
    renderNav();
    const furnitureLink = screen.getByRole("link", { name: /^Furniture/ });
    fireEvent.mouseEnter(furnitureLink);
    expect(screen.queryByText("Sofas")).toBeNull();
    await waitFor(() => expect(screen.getByText("Sofas")).toBeInTheDocument(), { timeout: 300 });
    expect(screen.getByText("Beds & Bedroom Sets")).toBeInTheDocument();

    const tilesLink = screen.getByRole("link", { name: /^Tiles/ });
    fireEvent.mouseEnter(tilesLink);
    await waitFor(() => expect(screen.getByText("Floor Tiles")).toBeInTheDocument(), { timeout: 300 });
    expect(screen.queryByText("Sofas")).toBeNull();
  });

  it("closes the open dropdown 150ms after the mouse leaves the nav entirely", async () => {
    const { container } = renderNav();
    const header = container.querySelector("header") as HTMLElement;
    const furnitureLink = screen.getByRole("link", { name: /^Furniture/ });
    fireEvent.mouseEnter(furnitureLink);
    await waitFor(() => expect(screen.getByText("Sofas")).toBeInTheDocument(), { timeout: 300 });

    fireEvent.mouseLeave(header);
    await waitFor(() => expect(screen.queryByText("Sofas")).toBeNull(), { timeout: 300 });
  });

  it("opens the Shop by dropdown with Space and Style columns", async () => {
    renderNav();
    const shopByButton = screen.getByRole("button", { name: /Shop by/ });
    fireEvent.mouseEnter(shopByButton);
    await waitFor(() => expect(screen.getByText("Shop by Space")).toBeInTheDocument(), { timeout: 300 });
    expect(screen.getByText("Bathroom")).toBeInTheDocument();
    expect(screen.getByText("Shop by Style")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View all styles →" })).toHaveAttribute("href", "/styles");
    expect(screen.getByRole("link", { name: /^Villa/ })).toHaveAttribute("href", "/styles/villa");
    expect(screen.getByRole("link", { name: /^Contemporary/ })).toHaveAttribute("href", "/styles/contemporary");
  });

  it("opens the Design Resources dropdown with its four columns", async () => {
    renderNav();
    const designResourcesLink = screen.getByRole("link", { name: /^Design Resources/ });
    fireEvent.mouseEnter(designResourcesLink);
    await waitFor(() => expect(screen.getByText("Discover")).toBeInTheDocument(), { timeout: 300 });
    expect(screen.getByText("Buying Guides")).toBeInTheDocument();
    expect(screen.getByText("Care & Installation")).toBeInTheDocument();
    expect(screen.getByText("About")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "How to Choose Tiles" })).toHaveAttribute(
      "href",
      "/resources/how-to-choose-tiles",
    );
  });
});

describe("SiteNav — mobile drawer", () => {
  it("opens a full-screen drawer from the hamburger button", () => {
    renderNav();
    fireEvent.click(screen.getByRole("button", { name: "Menu" }));
    expect(screen.getByRole("button", { name: "Close menu" })).toBeInTheDocument();
  });

  it("expands a category accordion to show its flat subcategory list", () => {
    renderNav();
    fireEvent.click(screen.getByRole("button", { name: "Menu" }));
    fireEvent.click(screen.getByRole("button", { name: /Furniture & Furnishings/ }));
    expect(screen.getByRole("link", { name: "Sofas" })).toBeInTheDocument();
  });

  it("has separate Shop by Space and Shop by Style accordion items", () => {
    renderNav();
    fireEvent.click(screen.getByRole("button", { name: "Menu" }));
    fireEvent.click(screen.getByRole("button", { name: "Shop by Space" }));
    expect(screen.getByRole("link", { name: "Bathroom" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Shop by Style" }));
    expect(screen.getByRole("link", { name: "Villa" })).toBeInTheDocument();
  });

  it("shows the right-zone links and Visit the Showroom CTA at the bottom of the drawer", () => {
    renderNav();
    fireEvent.click(screen.getByRole("button", { name: "Menu" }));
    const drawer = within(screen.getByRole("dialog", { name: "Mobile menu" }));
    expect(drawer.getByRole("link", { name: "Trade Program" })).toBeInTheDocument();
    expect(drawer.getByRole("link", { name: "Visit the Showroom" })).toBeInTheDocument();
  });

  it("closes via the close button", () => {
    renderNav();
    fireEvent.click(screen.getByRole("button", { name: "Menu" }));
    fireEvent.click(screen.getByRole("button", { name: "Close menu" }));
    expect(screen.queryByRole("button", { name: "Close menu" })).toBeNull();
  });
});

describe("SiteNav — search", () => {
  it("reveals a real search input on click, submitting to /search?q=<value>", () => {
    renderNav();
    fireEvent.click(screen.getByRole("button", { name: "Search" }));

    const input = screen.getByRole("searchbox", { name: "Search products" });
    expect(input.closest("form")).toHaveAttribute("action", "/search");
    expect(input).toHaveAttribute("name", "q");

    fireEvent.change(input, { target: { value: "brass pendant" } });
    expect(input).toHaveValue("brass pendant");
  });

  it("closes the search input via the close button, clearing the query", () => {
    renderNav();
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    fireEvent.change(screen.getByRole("searchbox", { name: "Search products" }), {
      target: { value: "tiles" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Close search" }));
    expect(screen.queryByRole("searchbox", { name: "Search products" })).toBeNull();
    expect(screen.getByRole("button", { name: "Search" })).toBeInTheDocument();
  });

  it("closes the search input on Escape", () => {
    renderNav();
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    const input = screen.getByRole("searchbox", { name: "Search products" });

    fireEvent.keyDown(input, { key: "Escape" });
    expect(screen.queryByRole("searchbox", { name: "Search products" })).toBeNull();
  });
});
