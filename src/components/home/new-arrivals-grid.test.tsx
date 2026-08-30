import { describe, expect, it } from "vitest";
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
    name: "Kano Upholstered Storage Bed",
    spec: "Faux leather, gas-lift storage",
    priceKobo: 54000000,
    requiresQuote: false,
    imageUrl: "/images/bed-taupe.jpg",
    imageAlt: "Kano Upholstered Storage Bed",
  },
  {
    id: "product-2",
    slug: "gudu-brass-pendant",
    variantId: "variant-2",
    categoryLabel: "Lighting",
    name: "Gudu Brass Pendant",
    spec: "Aged brass, dimmable",
    priceKobo: 14500000,
    requiresQuote: false,
    imageUrl: null,
    imageAlt: "Gudu Brass Pendant",
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
    expect(screen.getByText("Kano Upholstered Storage Bed")).toBeInTheDocument();
    expect(screen.getByText("Bedroom")).toBeInTheDocument();
    expect(screen.getByText("Faux leather, gas-lift storage")).toBeInTheDocument();
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
});
