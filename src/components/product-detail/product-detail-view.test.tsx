import { describe, expect, it } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CartProvider } from "@/lib/cart-context";
import { TradeAccountProvider } from "@/lib/trade-account-context";
import { rpcMock } from "@/test/supabase-mock";
import { ProductDetailView } from "./product-detail-view";
import type { GalleryImage } from "./product-gallery";
import type { ProductVariant } from "./variant-selector";
import type { NewArrivalProductCard } from "@/components/home/new-arrivals-grid";

const BREADCRUMB = [
  { label: "Home", href: "/" },
  { label: "Furniture", href: "/furniture" },
  { label: "Kano Upholstered Storage Bed" },
];

const SINGLE_IMAGE: GalleryImage[] = [
  { url: "/images/bed-taupe.jpg", alt: "Kano Upholstered Storage Bed" },
];

const MULTI_IMAGE: GalleryImage[] = [
  { url: "/images/bed-taupe.jpg", alt: "Kano bed, front" },
  { url: "/images/bed-grey-wing.jpg", alt: "Kano bed, side" },
];

const SINGLE_VARIANT: ProductVariant[] = [
  {
    id: "variant-1",
    finish: null,
    color: null,
    size: null,
    priceKobo: 54000000,
    isDefault: true,
    inStock: true,
  },
];

const MULTI_VARIANT: ProductVariant[] = [
  {
    id: "variant-1",
    finish: "Taupe",
    color: null,
    size: null,
    priceKobo: 54000000,
    isDefault: true,
    inStock: true,
  },
  {
    id: "variant-2",
    finish: "Charcoal",
    color: null,
    size: null,
    priceKobo: 61000000,
    isDefault: false,
    inStock: true,
  },
];

const RELATED: NewArrivalProductCard[] = [
  {
    id: "product-2",
    slug: "asaba-bed",
    variantId: "variant-3",
    categoryLabel: "Dining",
    name: "Asaba Bed",
    spec: null,
    priceKobo: 39000000,
    requiresQuote: false,
    imageUrl: "/images/bed-taupe.jpg",
    imageAlt: "Asaba Bed",
  },
];

function renderView(overrides: Partial<Parameters<typeof ProductDetailView>[0]> = {}) {
  return render(
    <CartProvider>
      <TradeAccountProvider>
        <ProductDetailView
          productId="product-1"
          breadcrumb={BREADCRUMB}
          categoryName="Bedroom"
          styleName={null}
          name="Kano Upholstered Storage Bed"
          description="Faux leather upholstered bed frame with gas-lift storage."
          warrantyYears={null}
          origin={null}
          videoUrl={null}
          images={SINGLE_IMAGE}
          variants={SINGLE_VARIANT}
          defaultVariantId="variant-1"
          related={RELATED}
          {...overrides}
        />
      </TradeAccountProvider>
    </CartProvider>,
  );
}

describe("ProductDetailView", () => {
  it("renders the breadcrumb with links on ancestors and plain text on the current page", () => {
    renderView();
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Furniture" })).toHaveAttribute(
      "href",
      "/furniture",
    );
    expect(screen.getAllByText("Kano Upholstered Storage Bed").length).toBeGreaterThan(0);
  });

  it("renders name, price, category and description", () => {
    renderView();
    expect(
      screen.getByRole("heading", { name: "Kano Upholstered Storage Bed" }),
    ).toBeInTheDocument();
    expect(screen.getByText("₦540,000")).toBeInTheDocument();
    expect(screen.getByText("Bedroom")).toBeInTheDocument();
    expect(screen.getByText(/gas-lift storage/)).toBeInTheDocument();
  });

  it("shows the style tag only when styleName is set", () => {
    renderView({ styleName: "Villa" });
    expect(screen.getByText(/Villa/)).toBeInTheDocument();
  });

  it("shows a single real photo with no thumbnail strip when only one image exists", () => {
    renderView();
    expect(screen.queryByRole("button", { name: /Show photo/ })).toBeNull();
  });

  it("shows an honest placeholder instead of a broken image when a product has zero photos", () => {
    const { container } = renderView({ images: [] });
    expect(container.querySelector('img[alt=""]')).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Show photo/ })).toBeNull();
  });

  it("renders a thumbnail strip and switches the main image when a product has multiple photos", () => {
    renderView({ images: MULTI_IMAGE });
    const thumbs = screen.getAllByRole("button", { name: /Show photo/ });
    expect(thumbs).toHaveLength(2);
    fireEvent.click(thumbs[1]);
    expect(thumbs[1]).toHaveAttribute("aria-current", "true");
  });

  it("hides the variant selector entirely when the product has only one variant", () => {
    renderView();
    expect(screen.queryByText("Finish")).toBeNull();
  });

  it("shows finish pills and updates the selected price when a product has real variant options", () => {
    renderView({ variants: MULTI_VARIANT, defaultVariantId: "variant-1" });
    expect(screen.getByText("₦540,000")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Charcoal" }));
    expect(screen.getByText("₦610,000")).toBeInTheDocument();
  });

  it("steps quantity up and down, never below 1 or above 99", () => {
    renderView();
    const decrease = screen.getByRole("button", { name: "Decrease quantity" });
    const increase = screen.getByRole("button", { name: "Increase quantity" });
    expect(screen.getByText("1")).toBeInTheDocument();
    fireEvent.click(decrease);
    expect(screen.getByText("1")).toBeInTheDocument();
    fireEvent.click(increase);
    fireEvent.click(increase);
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("shows Out of Stock as a disabled state instead of Add to Cart when the variant is unavailable", () => {
    renderView({
      variants: [{ ...SINGLE_VARIANT[0], inStock: false }],
    });
    expect(screen.getByRole("button", { name: "Out of Stock" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Add to Cart" })).toBeNull();
  });

  it("adds the selected variant and quantity to the cart via the atomic RPC, then shows transient confirmation", async () => {
    renderView({ variants: MULTI_VARIANT, defaultVariantId: "variant-2" });
    const addButton = screen.getByRole("button", { name: "Add to Cart" });
    await waitFor(() => expect(addButton).not.toBeDisabled());

    fireEvent.click(screen.getByRole("button", { name: "Increase quantity" }));
    fireEvent.click(addButton);

    await waitFor(() =>
      expect(rpcMock).toHaveBeenCalledWith("add_to_cart", {
        p_variant_id: "variant-2",
        p_quantity: 2,
      }),
    );
    expect(await screen.findByRole("button", { name: "Added ✓" })).toBeInTheDocument();
  });

  it("shows a link to book a showroom viewing", () => {
    renderView();
    expect(
      screen.getByRole("link", { name: "Book a viewing at the showroom" }),
    ).toHaveAttribute("href", "/#showroom");
  });

  it("renders real related products with working product links, not fabricated ones", () => {
    renderView();
    expect(screen.getByText("You might also like")).toBeInTheDocument();
    expect(screen.getByText("Asaba Bed")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Asaba Bed/ })).toHaveAttribute(
      "href",
      "/products/asaba-bed",
    );
  });

  it("shows no related-products section at all when there are none yet", () => {
    renderView({ related: [] });
    expect(screen.queryByText("You might also like")).toBeNull();
  });

  it("shows 'Price on request' instead of a price when the selected variant has no price_kobo", () => {
    renderView({
      variants: [{ ...SINGLE_VARIANT[0], priceKobo: null }],
    });
    expect(screen.getByText("Price on request")).toBeInTheDocument();
  });

  it("shows the showroom editorial banner with the real phone number", () => {
    renderView();
    expect(screen.getByText("See this piece in person before you commit.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /\+234 \(0\) 803 311 7302/ })).toHaveAttribute(
      "href",
      "tel:+2348033117302",
    );
  });
});

// Bajgio/Lagos footer-only placement is verified for every real route's
// actual rendered HTML by scripts/check-brand-guardrails.mjs (runs
// automatically after every `npm run build`), not per-component here.
