import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { CartProvider } from "@/lib/cart-context";
import { TradeAccountProvider } from "@/lib/trade-account-context";
import { rpcMock } from "@/test/supabase-mock";
import { NewArrivalsGrid, type NewArrivalProductCard } from "./new-arrivals-grid";

const FIXTURE: NewArrivalProductCard[] = [
  {
    id: "product-1",
    slug: "kano-upholstered-storage-bed",
    variantId: "variant-1",
    categoryLabel: "Bedroom",
    name: "Milano Upholstered Storage Bed",
    collection: null,
    spec: "Faux leather, gas-lift storage",
    priceKobo: 54000000,
    requiresQuote: false,
    imageUrl: "/images/bed-taupe.jpg",
    imageAlt: "Milano Upholstered Storage Bed",
    secondaryImageUrl: null,
    isNew: false,
    isBestseller: false,
  },
  {
    id: "product-2",
    slug: "gudu-brass-pendant",
    variantId: "variant-2",
    categoryLabel: "Lighting",
    name: "Gudu Brass Pendant",
    collection: null,
    spec: "Aged brass, dimmable",
    priceKobo: 14500000,
    requiresQuote: false,
    imageUrl: null,
    imageAlt: "Gudu Brass Pendant",
    secondaryImageUrl: null,
    isNew: false,
    isBestseller: false,
  },
];

function renderGrid(products: NewArrivalProductCard[] = FIXTURE) {
  return render(
    <CartProvider>
      <TradeAccountProvider>
        <NewArrivalsGrid products={products} />
      </TradeAccountProvider>
    </CartProvider>,
  );
}

describe("NewArrivalsGrid", () => {
  it("renders each product's name, category, spec and price", () => {
    renderGrid();
    expect(screen.getByText("Milano Upholstered Storage Bed")).toBeInTheDocument();
    expect(screen.getByText(/Bedroom/)).toBeInTheDocument();
    expect(screen.getByText(/Faux leather, gas-lift storage/)).toBeInTheDocument();
    expect(screen.getByText("₦540,000")).toBeInTheDocument();
  });

  it("falls back to the placeholder block when a product has no image", () => {
    renderGrid();
    expect(screen.getByText("[ no photo yet ]")).toBeInTheDocument();
  });

  it("renders one Add button per product, disabled until the cart is ready", () => {
    renderGrid();
    const addButtons = screen.getAllByRole("button", { name: "Add" });
    expect(addButtons).toHaveLength(FIXTURE.length);
    // CartProvider hasn't resolved its anonymous-auth bootstrap yet at
    // render time, so interaction must be blocked until it does.
    addButtons.forEach((button) => expect(button).toBeDisabled());
  });

  it("calls the atomic add_to_cart RPC with the clicked product's variant id, not read-then-write", async () => {
    renderGrid();
    const addButtons = screen.getAllByRole("button", { name: "Add" });
    await waitFor(() => expect(addButtons[0]).not.toBeDisabled());

    fireEvent.click(addButtons[0]);

    await waitFor(() =>
      expect(rpcMock).toHaveBeenCalledWith("add_to_cart", {
        p_variant_id: "variant-1",
        p_quantity: 1,
      }),
    );
    // A single RPC call per click — no separate select-then-insert/update
    // round trip.
    expect(rpcMock).toHaveBeenCalledTimes(1);
  });

  it("shows 'Request a Quote' instead of price and Add button for a requires_quote product", () => {
    renderGrid([{ ...FIXTURE[0], requiresQuote: true, priceKobo: null }]);
    expect(screen.getByText("Request a Quote")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add" })).toBeNull();
  });

  it("shows a NEW badge for recent products", () => {
    renderGrid([{ ...FIXTURE[0], isNew: true }]);
    expect(screen.getByText("New")).toBeInTheDocument();
    expect(screen.queryByText("Bestseller")).toBeNull();
  });

  it("shows a BESTSELLER badge when is_bestseller is true, taking priority over NEW", () => {
    renderGrid([{ ...FIXTURE[0], isNew: true, isBestseller: true }]);
    expect(screen.getByText("Bestseller")).toBeInTheDocument();
    expect(screen.queryByText("New")).toBeNull();
  });

  it("shows no badge when neither new nor bestseller", () => {
    renderGrid([{ ...FIXTURE[0], isNew: false, isBestseller: false }]);
    expect(screen.queryByText("New")).toBeNull();
    expect(screen.queryByText("Bestseller")).toBeNull();
  });

  it("renders the collection name as the primary line when set, falling back to the product name", () => {
    renderGrid([{ ...FIXTURE[0], collection: "Positano Collection" }]);
    expect(screen.getByText("Positano Collection")).toBeInTheDocument();
  });

  it("omits the remove-from-wishlist button when onRemove isn't given", () => {
    renderGrid([FIXTURE[0]]);
    expect(screen.queryByRole("button", { name: /Remove .* from wishlist/ })).toBeNull();
  });

  it("shows a remove-from-wishlist button that calls onRemove with the product id, without navigating", () => {
    const onRemove = vi.fn();
    render(
      <CartProvider>
        <TradeAccountProvider>
          <NewArrivalsGrid products={[FIXTURE[0]]} onRemove={onRemove} />
        </TradeAccountProvider>
      </CartProvider>,
    );
    const button = screen.getByRole("button", {
      name: "Remove Milano Upholstered Storage Bed from wishlist",
    });
    fireEvent.click(button);
    expect(onRemove).toHaveBeenCalledWith("product-1");
  });
});
