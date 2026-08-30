import { describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CartProvider } from "@/lib/cart-context";
import { TradeAccountProvider } from "@/lib/trade-account-context";
import { ListingView } from "./listing-view";
import type { ListingProduct } from "./listing-product-grid";
import { DEFAULT_LISTING_FILTERS } from "@/lib/listing-filters";

const BREADCRUMB = [
  { label: "Home", href: "/" },
  { label: "Furniture", href: "/furniture" },
  { label: "Living Room" },
];

function makeProducts(count: number): ListingProduct[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `product-${i}`,
    slug: `test-sofa-${i}`,
    variantId: `variant-${i}`,
    name: `Test Sofa ${i}`,
    priceKobo: (i + 1) * 10000000,
    requiresQuote: false,
    imageUrl: null,
    imageAlt: `Test Sofa ${i}`,
    inShowroom: i % 2 === 0,
  }));
}

function renderListing(products: ListingProduct[]) {
  return render(
    <CartProvider>
      <TradeAccountProvider>
        <ListingView
          breadcrumb={BREADCRUMB}
          title="Living Room Furniture"
          description="Sofas, seating, coffee and side tables, and media units."
          products={products}
          emptyMessage="No Living Room pieces published yet — check back soon."
          filterOptions={{ finishes: [], colors: [], sizes: [] }}
          activeFilters={DEFAULT_LISTING_FILTERS}
        />
      </TradeAccountProvider>
    </CartProvider>,
  );
}

describe("ListingView", () => {
  it("renders the breadcrumb with links on ancestors and plain text on the current page", () => {
    renderListing(makeProducts(2));
    const homeLink = screen.getByRole("link", { name: "Home" });
    expect(homeLink).toHaveAttribute("href", "/");
    const furnitureLink = screen.getByRole("link", { name: "Furniture" });
    expect(furnitureLink).toHaveAttribute("href", "/furniture");
    expect(screen.getByText("Living Room")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Living Room" })).toBeNull();
  });

  it("shows the real, unpadded product count — no fake data", () => {
    renderListing(makeProducts(3));
    expect(screen.getByText("3 pieces")).toBeInTheDocument();
    expect(screen.getByText("Test Sofa 0")).toBeInTheDocument();
    expect(screen.queryByText(/Linen Three-Seat Sofa|Bouclé Curved Sofa/)).toBeNull();
  });

  it("shows an honest empty state instead of fake products when the category has none yet", () => {
    renderListing([]);
    expect(
      screen.getByText("No Living Room pieces published yet — check back soon."),
    ).toBeInTheDocument();
    expect(screen.getByText("0 pieces")).toBeInTheDocument();
  });

  it("shows the In Showroom badge only on products flagged is_showroom_display", () => {
    renderListing(makeProducts(2)); // product 0: inShowroom true, product 1: false
    expect(screen.getAllByText("In Showroom")).toHaveLength(1);
  });

  it("hides Load more when everything already fits on one page", () => {
    renderListing(makeProducts(3));
    expect(screen.getByText("Showing 3 of 3")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Load more" })).toBeNull();
  });

  it("reveals more products in steps of 4 when Load more is clicked", () => {
    renderListing(makeProducts(10));
    expect(screen.getByText("Showing 8 of 10")).toBeInTheDocument();
    const loadMore = screen.getByRole("button", { name: "Load more" });

    fireEvent.click(loadMore);
    expect(screen.getByText("Showing 10 of 10")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Load more" })).toBeNull();
  });
});
