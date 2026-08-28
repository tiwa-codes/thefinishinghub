import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ListingProductGrid, type ListingProduct } from "./listing-product-grid";
import { CartProvider } from "@/lib/cart-context";

const PRODUCT: ListingProduct = {
  id: "p1",
  slug: "gudu-brass-pendant",
  variantId: "v1",
  name: "Gudu Brass Pendant",
  priceLabel: "₦85,000",
  requiresQuote: false,
  imageUrl: null,
  imageAlt: "Gudu Brass Pendant",
  inShowroom: false,
};

// AddToCartButton (rendered per card) needs CartProvider in the tree.
function renderGrid(products: ListingProduct[], emptyMessage: string) {
  return render(
    <CartProvider>
      <ListingProductGrid products={products} emptyMessage={emptyMessage} />
    </CartProvider>,
  );
}

describe("ListingProductGrid — category context", () => {
  it("shows a category label on the card when one is given (search results)", () => {
    renderGrid([{ ...PRODUCT, categoryLabel: "Lighting & Automation" }], "No products found.");
    expect(screen.getByText("Lighting & Automation")).toBeInTheDocument();
  });

  it("omits the category label when none is given (every other listing page)", () => {
    renderGrid([PRODUCT], "No products found.");
    expect(screen.queryByText("Lighting & Automation")).toBeNull();
  });

  it("shows the honest empty message instead of any products", () => {
    renderGrid([], 'No products matched "xyz"');
    expect(screen.getByText('No products matched "xyz"')).toBeInTheDocument();
  });
});

describe("ListingProductGrid — requires_quote", () => {
  it("shows 'Request a Quote' instead of price and Add to Cart", () => {
    renderGrid([{ ...PRODUCT, requiresQuote: true, priceLabel: "" }], "No products found.");
    expect(screen.getByText("Request a Quote")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add" })).toBeNull();
  });

  it("shows real price and Add to Cart for an ordinary product", () => {
    renderGrid([PRODUCT], "No products found.");
    expect(screen.getByText("₦85,000")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add" })).toBeInTheDocument();
  });
});
