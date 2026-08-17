import { describe, expect, it } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CartProvider } from "@/lib/cart-context";
import { rpcMock } from "@/test/supabase-mock";
import { ProductDetailView } from "./product-detail-view";
import type { GalleryImage } from "./product-gallery";
import type { ProductVariantOption } from "./variant-picker";
import type { FeaturedProduct } from "@/components/category/featured-products-grid";

const BREADCRUMB = [
  { label: "Home", href: "/" },
  { label: "Furniture", href: "/furniture" },
  { label: "Bedroom" },
  { label: "Kano Upholstered Storage Bed" },
];

const SINGLE_IMAGE: GalleryImage[] = [
  { url: "/images/bed-taupe.jpg", alt: "Kano Upholstered Storage Bed" },
];

const MULTI_IMAGE: GalleryImage[] = [
  { url: "/images/bed-taupe.jpg", alt: "Kano bed, front" },
  { url: "/images/bed-grey-wing.jpg", alt: "Kano bed, side" },
];

const SINGLE_VARIANT: ProductVariantOption[] = [
  { id: "variant-1", label: "SKU-1", swatchColor: null },
];

const MULTI_VARIANT: ProductVariantOption[] = [
  { id: "variant-1", label: "Taupe", swatchColor: "#c9bfae" },
  { id: "variant-2", label: "Charcoal", swatchColor: "#3a3a3a" },
];

// categoryLabel/imageUrl deliberately differ from the main product's own
// fixtures (Bedroom / no photo) so assertions on one don't accidentally
// match text belonging to the other.
const COMPLEMENTS: FeaturedProduct[] = [
  {
    id: "product-2",
    slug: "asaba-bed",
    name: "Asaba Bed",
    categoryLabel: "Dining",
    priceLabel: "₦610,000",
    imageUrl: "/images/bed-taupe.jpg",
    imageAlt: "Asaba Bed",
  },
];

function renderView(overrides: Partial<Parameters<typeof ProductDetailView>[0]> = {}) {
  return render(
    <CartProvider>
      <ProductDetailView
        breadcrumb={BREADCRUMB}
        categoryPath="Furniture · Bedroom"
        name="Kano Upholstered Storage Bed"
        priceLabel="₦540,000"
        description="Faux leather upholstered bed frame with gas-lift storage."
        images={SINGLE_IMAGE}
        variants={SINGLE_VARIANT}
        defaultVariantId="variant-1"
        complements={COMPLEMENTS}
        {...overrides}
      />
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
    expect(screen.getByText("Bedroom")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Bedroom" })).toBeNull();
  });

  it("renders name, price, category path and description", () => {
    renderView();
    expect(
      screen.getByRole("heading", { name: "Kano Upholstered Storage Bed" }),
    ).toBeInTheDocument();
    expect(screen.getByText("₦540,000")).toBeInTheDocument();
    expect(screen.getByText("Furniture · Bedroom")).toBeInTheDocument();
    expect(screen.getByText(/gas-lift storage/)).toBeInTheDocument();
  });

  it("shows a single real photo with no thumbnail strip when only one image exists", () => {
    renderView();
    expect(screen.queryByRole("button", { name: /Show photo/ })).toBeNull();
  });

  it("shows an honest placeholder instead of a broken image when a product has zero photos", () => {
    renderView({ images: [] });
    expect(screen.getByText("[ no photo yet ]")).toBeInTheDocument();
  });

  it("renders a thumbnail strip and switches the main image when a product has multiple photos", () => {
    renderView({ images: MULTI_IMAGE });
    const thumbs = screen.getAllByRole("button", { name: /Show photo/ });
    expect(thumbs).toHaveLength(2);
    fireEvent.click(thumbs[1]);
    expect(thumbs[1]).toHaveAttribute("aria-current", "true");
  });

  it("hides the variant picker entirely when the product has only one (real) variant", () => {
    renderView();
    expect(screen.queryByText(/^Finish/)).toBeNull();
  });

  it("shows swatches and updates the selected label when a product has real finish options", () => {
    renderView({ variants: MULTI_VARIANT, defaultVariantId: "variant-1" });
    expect(screen.getByText("Finish — Taupe")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Charcoal" }));
    expect(screen.getByText("Finish — Charcoal")).toBeInTheDocument();
  });

  it("steps quantity up and down, never below 1", () => {
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

  it("renders real complementary products with working product links, not fabricated ones", () => {
    renderView();
    expect(screen.getByText("Complete the room")).toBeInTheDocument();
    expect(screen.getByText("Asaba Bed")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Asaba Bed/ })).toHaveAttribute(
      "href",
      "/products/asaba-bed",
    );
    expect(screen.queryByText(/coffee table|basin/i)).toBeNull();
  });

  it("shows an honest empty state instead of fake complements when there are none yet", () => {
    renderView({ complements: [] });
    expect(
      screen.getByText("No published products in this category yet."),
    ).toBeInTheDocument();
  });
});

// Bajgio/Lagos footer-only placement is verified for every real route's
// actual rendered HTML by scripts/check-brand-guardrails.mjs (runs
// automatically after every `npm run build`), not per-component here.
