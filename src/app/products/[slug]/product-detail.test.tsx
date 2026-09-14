import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { CartProvider } from "@/lib/cart-context";
import { TradeAccountProvider } from "@/lib/trade-account-context";
import { ProductDetailView } from "@/components/product-detail/product-detail-view";
import type { ProductVariant } from "@/components/product-detail/variant-selector";

// The page itself (src/app/products/[slug]/page.tsx) is an async Server
// Component that fetches from Supabase — RTL/jsdom can't render that
// directly (same reasoning as page.test.tsx for the homepage). These
// tests exercise ProductDetailView, the presentational component the
// page hands fully-fetched, plain data to.

const DEFAULT_VARIANT: ProductVariant = {
  id: "variant-1",
  finish: null,
  color: null,
  size: null,
  priceKobo: 175000000,
  isDefault: true,
  inStock: true,
};

function renderProduct(overrides: Partial<Parameters<typeof ProductDetailView>[0]> = {}) {
  return render(
    <CartProvider>
      <TradeAccountProvider>
        <ProductDetailView
          productId="product-1"
          breadcrumb={[
            { label: "Home", href: "/" },
            { label: "Furniture", href: "/furniture" },
            { label: "Positano Sofa" },
          ]}
          categoryName="Sofas"
          styleName={null}
          name="Positano Sofa"
          description={null}
          warrantyYears={null}
          origin={null}
          videoUrl={null}
          images={[{ url: "/images/positano-sofa.jpg", alt: "Positano Sofa" }]}
          variants={[DEFAULT_VARIANT]}
          defaultVariantId="variant-1"
          related={[]}
          {...overrides}
        />
      </TradeAccountProvider>
    </CartProvider>,
  );
}

describe("Product detail page", () => {
  it("renders product name", () => {
    renderProduct();
    expect(screen.getByRole("heading", { name: "Positano Sofa" })).toBeInTheDocument();
  });

  it('renders "Price on request" when price_kobo is null', () => {
    renderProduct({ variants: [{ ...DEFAULT_VARIANT, priceKobo: null }] });
    expect(screen.getByText("Price on request")).toBeInTheDocument();
  });

  it("renders warranty badge when warranty_years is set", () => {
    renderProduct({ warrantyYears: 10 });
    expect(screen.getByText("10-Year Warranty")).toBeInTheDocument();
  });

  it("renders origin badge when origin is set", () => {
    renderProduct({ origin: "Italy" });
    expect(screen.getByText("Made in Italy")).toBeInTheDocument();
  });

  it("add to cart button exists and is not disabled when variant in_stock", async () => {
    renderProduct({ variants: [{ ...DEFAULT_VARIANT, inStock: true }] });
    const addButton = screen.getByRole("button", { name: "Add to Cart" });
    // Disabled until the cart's anonymous-session bootstrap resolves
    // (useCart().ready) — not an in_stock check failing.
    await waitFor(() => expect(addButton).not.toBeDisabled());
  });

  it("renders breadcrumb with category and product name", () => {
    renderProduct();
    expect(screen.getByRole("link", { name: "Furniture" })).toHaveAttribute(
      "href",
      "/furniture",
    );
    expect(screen.getAllByText("Positano Sofa").length).toBeGreaterThan(0);
  });

  it("renders placeholder when no images exist", () => {
    const { container } = renderProduct({ images: [] });
    // The TFH monogram placeholder image, not a broken-image state.
    expect(container.querySelector('img[src*="tfh-monogram"]')).toBeInTheDocument();
  });
});
