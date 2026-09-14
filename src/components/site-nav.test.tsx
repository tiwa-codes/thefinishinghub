import { describe, expect, it } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
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

  it("opens the mega-menu with real subcategory names on click, and only one dropdown is open at a time", () => {
    renderNav();
    const furnitureLink = screen.getByRole("link", { name: /^Furniture/ });
    expect(screen.queryByText("Sofas")).toBeNull();
    fireEvent.click(furnitureLink);
    expect(screen.getByText("Sofas")).toBeInTheDocument();
    expect(screen.getByText("Beds & Bedroom Sets")).toBeInTheDocument();

    const tilesLink = screen.getByRole("link", { name: /^Tiles/ });
    fireEvent.click(tilesLink);
    expect(screen.getByText("Floor Tiles")).toBeInTheDocument();
    expect(screen.queryByText("Sofas")).toBeNull();
  });

  it("clicking an open dropdown's trigger again closes it", () => {
    renderNav();
    const furnitureLink = screen.getByRole("link", { name: /^Furniture/ });
    fireEvent.click(furnitureLink);
    expect(screen.getByText("Sofas")).toBeInTheDocument();

    fireEvent.click(furnitureLink);
    expect(screen.queryByText("Sofas")).toBeNull();
  });

  it("closes the open dropdown when clicking outside the nav", () => {
    renderNav();
    fireEvent.click(screen.getByRole("link", { name: /^Furniture/ }));
    expect(screen.getByText("Sofas")).toBeInTheDocument();

    fireEvent.click(document.body);
    expect(screen.queryByText("Sofas")).toBeNull();
  });

  it("closes the open dropdown on Escape", () => {
    renderNav();
    fireEvent.click(screen.getByRole("link", { name: /^Furniture/ }));
    expect(screen.getByText("Sofas")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByText("Sofas")).toBeNull();
  });

  it("opens the Shop by dropdown with Space and Style columns", () => {
    renderNav();
    const shopByButton = screen.getByRole("button", { name: /Shop by/ });
    fireEvent.click(shopByButton);
    expect(screen.getByText("Shop by Space")).toBeInTheDocument();
    expect(screen.getByText("Bathroom")).toBeInTheDocument();
    expect(screen.getByText("Shop by Style")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View all styles →" })).toHaveAttribute("href", "/styles");
    expect(screen.getByRole("link", { name: /^Villa/ })).toHaveAttribute("href", "/styles/villa");
    expect(screen.getByRole("link", { name: /^Contemporary/ })).toHaveAttribute("href", "/styles/contemporary");
  });

  it("opens the Design Resources dropdown as a 2x2 grid of 4 editorial image tiles", () => {
    renderNav();
    const designResourcesLink = screen.getByRole("link", { name: /^Design Resources/ });
    fireEvent.click(designResourcesLink);

    const dropdown = within(screen.getByText("Gallery").closest("div")!.parentElement!.parentElement!);
    const tileLinks = [
      dropdown.getByRole("link", { name: /Gallery/ }),
      dropdown.getByRole("link", { name: /Design Services/ }),
      dropdown.getByRole("link", { name: /Our Showroom/ }),
      dropdown.getByRole("link", { name: /Trade Program/ }),
    ];
    expect(tileLinks).toHaveLength(4);
    tileLinks.forEach((link) => {
      expect(link.querySelector("img")).toBeInTheDocument();
    });

    expect(dropdown.getByRole("link", { name: /Trade Program/ })).toHaveAttribute(
      "href",
      "/trade/apply",
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

describe("SiteNav — search bar", () => {
  it("renders a static, centred search bar in row 1 with the specified placeholder (no functionality yet)", () => {
    renderNav();
    const input = screen.getByRole("searchbox", {
      name: "Search by product, category, or style",
    });
    expect(input).toHaveAttribute(
      "placeholder",
      "Search by product, category, or style",
    );
    expect(input).toBeDisabled();
  });
});
