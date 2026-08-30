import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { CartProvider } from "@/lib/cart-context";
import { TradeAccountProvider } from "@/lib/trade-account-context";
import { CategoryView } from "./category-view";
import type { SubcategoryTile } from "./subcategory-tiles";
import type { FeaturedProduct } from "./featured-products-grid";

const SUBCATEGORIES: SubcategoryTile[] = [
  { slug: "sanitaryware-shower", name: "Shower", href: "#" },
  { slug: "sanitaryware-bathtub", name: "Bath", href: "#" },
  { slug: "sanitaryware-toilet", name: "Toilet", href: "#" },
];

const PRODUCTS: FeaturedProduct[] = [
  {
    id: "product-1",
    slug: "carrara-porcelain-60x120",
    name: "Carrara Porcelain, 60×120",
    categoryLabel: "Tiles & Wall Finishes",
    priceKobo: 1850000,
    requiresQuote: false,
    imageUrl: null,
    imageAlt: "Carrara Porcelain, 60×120",
  },
];

function renderView(overrides: Partial<Parameters<typeof CategoryView>[0]> = {}) {
  return render(
    <CartProvider>
      <TradeAccountProvider>
        <CategoryView
          title="Sanitarywares & Bath Accessories"
          heroDescription="Showers, baths and fittings for a finished bathroom."
          heroImageAlt="Sanitarywares & Bath Accessories"
          subcategories={SUBCATEGORIES}
          featuredTitle="Featured pieces from Sanitarywares & Bath Accessories"
          viewAllHref="/sanitaryware-bath/all"
          products={PRODUCTS}
          designerTitle="Book a designer for your bathroom project."
          designerDescription="Bring a plan or a photo. We'll help you specify pieces from the showroom for your space."
          {...overrides}
        />
      </TradeAccountProvider>
    </CartProvider>,
  );
}

describe("CategoryView — hero", () => {
  it("renders the real category name and description", () => {
    renderView();
    expect(
      screen.getByRole("heading", { level: 1, name: "Sanitarywares & Bath Accessories" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Showers, baths and fittings for a finished bathroom."),
    ).toBeInTheDocument();
  });

  it("shows an honest placeholder instead of a broken image when no hero photo exists yet", () => {
    renderView({ heroImageSrc: undefined });
    expect(screen.getByText("[ photography coming soon ]")).toBeInTheDocument();
  });

  it("renders the real hero photo when one exists", () => {
    renderView({ heroImageSrc: "/images/category-tiles.jpg" });
    expect(screen.queryByText("[ photography coming soon ]")).toBeNull();
  });
});

describe("CategoryView — subcategories", () => {
  it("renders subcategory tiles by real name when the category has them", () => {
    renderView();
    expect(screen.getByText("Shower")).toBeInTheDocument();
    expect(screen.getByText("Bath")).toBeInTheDocument();
    expect(screen.getByText("Toilet")).toBeInTheDocument();
  });

  it("uses a custom subcategories heading when given one", () => {
    renderView({ subcategoriesTitle: "Shop Sanitarywares by type" });
    expect(screen.getByText("Shop Sanitarywares by type")).toBeInTheDocument();
  });

  it("skips the subcategories section entirely for a category with none yet, instead of an empty grid", () => {
    renderView({ subcategories: [] });
    expect(screen.queryByText("Shower")).toBeNull();
    expect(screen.queryByText(/Shop .* by type/)).toBeNull();
  });
});

describe("CategoryView — featured products", () => {
  it("renders exactly the real products it's given — no padded/fake products", () => {
    renderView();
    expect(screen.getByText("Carrara Porcelain, 60×120")).toBeInTheDocument();
    expect(screen.getByText("₦18,500")).toBeInTheDocument();
  });

  it("shows an honest empty state instead of fake products for a category with none published yet", () => {
    renderView({ products: [] });
    expect(
      screen.getByText("No published products in this category yet."),
    ).toBeInTheDocument();
  });

  it("shows 'Request a Quote' instead of price for a requires_quote product", () => {
    renderView({ products: [{ ...PRODUCTS[0], requiresQuote: true, priceKobo: null }] });
    expect(screen.getByText("Request a Quote")).toBeInTheDocument();
    expect(screen.queryByText("₦18,500")).toBeNull();
  });

  it("links 'View all' to the real per-category page it's given, not a dead '#'", () => {
    renderView();
    expect(
      screen.getByRole("link", { name: "View all sanitarywares & bath accessories" }),
    ).toHaveAttribute("href", "/sanitaryware-bath/all");
  });
});

describe("CategoryView — book a designer", () => {
  it("renders the designer CTA pointing back at the homepage showroom section", () => {
    renderView();
    expect(screen.getByText("Book a designer for your bathroom project.")).toBeInTheDocument();
    const cta = screen.getByRole("link", { name: "Book a designer" });
    expect(cta).toHaveAttribute("href", "/#showroom");
  });
});
