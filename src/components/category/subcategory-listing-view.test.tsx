import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { CartProvider } from "@/lib/cart-context";
import { TradeAccountProvider } from "@/lib/trade-account-context";
import { SubcategoryListingView } from "./subcategory-listing-view";
import type { SubcategoryProductCard } from "@/lib/subcategory-page-data";

const SIBLINGS = [
  { name: "Floor Tiles", slug: "floor-tiles", href: "/tiles-wall-finishes/floor-tiles" },
  { name: "Wall Tiles", slug: "wall-tiles", href: "/tiles-wall-finishes/wall-tiles" },
];

const PRODUCTS: SubcategoryProductCard[] = [
  {
    id: "p1",
    slug: "carrara-porcelain-60x120",
    variantId: "v1",
    categoryLabel: "Floor Tiles",
    name: "Carrara Porcelain 60x120",
    collection: null,
    spec: "Polished porcelain slab",
    priceKobo: 1850000,
    requiresQuote: false,
    imageUrl: "/images/tile.jpg",
    imageAlt: "Carrara Porcelain",
    secondaryImageUrl: null,
    isNew: false,
    isBestseller: true,
    attributes: { type: "Floor", material: "Porcelain", finish: "Polished", look: "Marble" },
  },
];

function renderView(props: Parameters<typeof SubcategoryListingView>[0]) {
  return render(
    <CartProvider>
      <TradeAccountProvider>
        <SubcategoryListingView {...props} />
      </TradeAccountProvider>
    </CartProvider>,
  );
}

describe("SubcategoryListingView", () => {
  it("renders the product grid when products exist", () => {
    renderView({
      parentName: "Tiles & Wall Finishes",
      parentSlug: "tiles-wall-finishes",
      subcategoryName: "Floor Tiles",
      siblings: SIBLINGS,
      activeSlug: "floor-tiles",
      showAttributeFilters: true,
      products: PRODUCTS,
    });
    expect(screen.getByText("Carrara Porcelain 60x120")).toBeInTheDocument();
    expect(screen.getByText("1 piece")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Floor Tiles" })).toBeInTheDocument();
  });

  it("shows the holding message and contact/showroom links when there are no products", () => {
    renderView({
      parentName: "Tiles & Wall Finishes",
      parentSlug: "tiles-wall-finishes",
      subcategoryName: "Mosaic Tiles",
      siblings: SIBLINGS,
      activeSlug: "mosaic-tiles",
      showAttributeFilters: true,
      products: [],
    });
    expect(screen.getByText("No products in this category yet.")).toBeInTheDocument();
    expect(
      screen.getByText("Visit our showroom or contact us — we may have what you need."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Contact us/ })).toHaveAttribute(
      "href",
      "tel:+2348033117302",
    );
    expect(screen.getByRole("link", { name: "Visit showroom" })).toHaveAttribute(
      "href",
      "/#showroom",
    );
  });

  it("renders sibling pill tabs with the active one distinguished", () => {
    renderView({
      parentName: "Tiles & Wall Finishes",
      parentSlug: "tiles-wall-finishes",
      subcategoryName: "Floor Tiles",
      siblings: SIBLINGS,
      activeSlug: "floor-tiles",
      showAttributeFilters: false,
      products: PRODUCTS,
    });
    expect(screen.getByRole("link", { name: "Floor Tiles" })).toHaveAttribute(
      "href",
      "/tiles-wall-finishes/floor-tiles",
    );
    expect(screen.getByRole("link", { name: "Wall Tiles" })).toHaveAttribute(
      "href",
      "/tiles-wall-finishes/wall-tiles",
    );
  });

  it("shows attribute filter dropdowns only for keys with real options", () => {
    renderView({
      parentName: "Tiles & Wall Finishes",
      parentSlug: "tiles-wall-finishes",
      subcategoryName: "Floor Tiles",
      siblings: SIBLINGS,
      activeSlug: "floor-tiles",
      showAttributeFilters: true,
      products: PRODUCTS,
    });
    expect(screen.getByLabelText("Material")).toBeInTheDocument();
    expect(screen.getByLabelText("Finish")).toBeInTheDocument();
    expect(screen.getByLabelText("Type")).toBeInTheDocument();
    expect(screen.getByLabelText("Look")).toBeInTheDocument();
  });

  it("hides attribute filters entirely when every product has null attributes", () => {
    renderView({
      parentName: "Furniture & Furnishings",
      parentSlug: "furniture",
      subcategoryName: "Sofas",
      siblings: [],
      activeSlug: "sofas",
      showAttributeFilters: false,
      products: [{ ...PRODUCTS[0], attributes: null }],
    });
    expect(screen.queryByLabelText("Material")).toBeNull();
    expect(screen.queryByLabelText("Type")).toBeNull();
  });
});
