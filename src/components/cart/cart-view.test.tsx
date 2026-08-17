import { describe, expect, it } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CartProvider } from "@/lib/cart-context";
import { fromMock } from "@/test/supabase-mock";
import { CartView, type CartLineItem } from "./cart-view";
import type { FeaturedProduct } from "@/components/category/featured-products-grid";

const ITEMS: CartLineItem[] = [
  {
    cartItemId: "cart-item-1",
    productSlug: "kano-upholstered-storage-bed",
    name: "Kano Upholstered Storage Bed",
    config: "",
    quantity: 1,
    unitPriceKobo: 54000000,
    imageUrl: "/images/bed-taupe.jpg",
    imageAlt: "Kano Upholstered Storage Bed",
  },
  {
    cartItemId: "cart-item-2",
    productSlug: "gudu-brass-pendant",
    name: "Gudu Brass Pendant",
    config: "Aged Brass",
    quantity: 2,
    unitPriceKobo: 14500000,
    imageUrl: null,
    imageAlt: "Gudu Brass Pendant",
  },
];

const SUGGESTIONS: FeaturedProduct[] = [
  {
    id: "product-3",
    slug: "carrara-porcelain-60x120",
    name: "Carrara Porcelain, 60×120",
    categoryLabel: "Tiles & Wall Finishes",
    priceLabel: "₦18,500",
    imageUrl: "/images/tile-carrara.jpg",
    imageAlt: "Carrara Porcelain, 60×120",
  },
];

function renderCart(items: CartLineItem[] = ITEMS, suggestions: FeaturedProduct[] = SUGGESTIONS) {
  return render(
    <CartProvider>
      <CartView initialItems={items} suggestions={suggestions} />
    </CartProvider>,
  );
}

describe("CartView — empty state", () => {
  it("shows an honest empty-cart message and real links, not a bare blank page", () => {
    renderCart([]);
    expect(screen.getByText("Your cart is empty.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Shop the collection" })).toHaveAttribute(
      "href",
      "/#categories",
    );
    expect(screen.getByRole("link", { name: "Book a visit" })).toHaveAttribute(
      "href",
      "/#showroom",
    );
  });

  it("never shows line items, order summary or suggestions when the cart is empty", () => {
    renderCart([]);
    expect(screen.queryByText("Your Cart")).toBeNull();
    expect(screen.queryByText("Order Summary")).toBeNull();
    expect(screen.queryByText("You might also like")).toBeNull();
  });
});

describe("CartView — line items", () => {
  it("renders each real line item with name, quantity, unit price and line total", () => {
    renderCart();
    expect(screen.getByText("Kano Upholstered Storage Bed")).toBeInTheDocument();
    expect(screen.getByText("Gudu Brass Pendant")).toBeInTheDocument();
    // qty 2 x ₦145,000 = ₦290,000 line total for the pendant
    expect(screen.getByText("₦290,000")).toBeInTheDocument();
  });

  it("links each line item to its real product page", () => {
    renderCart();
    expect(
      screen.getByRole("link", { name: "Kano Upholstered Storage Bed" }),
    ).toHaveAttribute("href", "/products/kano-upholstered-storage-bed");
  });

  it("shows the variant config line only when the variant actually has one", () => {
    renderCart();
    expect(screen.getByText("Aged Brass")).toBeInTheDocument();
  });

  it("falls back to an honest placeholder instead of a broken image when a line item has none", () => {
    renderCart();
    expect(screen.getByText("[ no photo yet ]")).toBeInTheDocument();
  });
});

describe("CartView — quantity + totals", () => {
  it("increases quantity, recomputes the line total and subtotal, and syncs cart-context by the correct delta", async () => {
    renderCart();
    // Subtotal: (1 x 540,000) + (2 x 145,000) = 830,000
    expect(screen.getAllByText("₦830,000")).toHaveLength(2); // Subtotal + Total

    const increase = screen.getByRole("button", {
      name: "Increase quantity of Kano Upholstered Storage Bed",
    });
    await waitFor(() => expect(increase).not.toBeDisabled());
    fireEvent.click(increase);

    // New subtotal: (2 x 540,000) + (2 x 145,000) = 1,370,000
    await waitFor(() => expect(screen.getAllByText("₦1,370,000")).toHaveLength(2));
    // CartProvider's own bootstrap effect also calls .from("cart_items")
    // (reading the initial count) — find the stub whose .update was
    // actually invoked, rather than assuming call order.
    await waitFor(() => {
      const updated = fromMock.mock.results
        .map((r) => r.value)
        .find((stub) => stub.update.mock.calls.length > 0);
      expect(updated).toBeDefined();
      expect(updated!.update).toHaveBeenCalledWith({ quantity: 2 });
      expect(updated!.eq).toHaveBeenCalledWith("id", "cart-item-1");
    });
  });

  it("never decreases quantity below 1", async () => {
    renderCart();
    const decrease = screen.getByRole("button", {
      name: "Decrease quantity of Kano Upholstered Storage Bed",
    });
    await waitFor(() => expect(decrease).not.toBeDisabled());
    fireEvent.click(decrease);
    // Still qty 1 x 540,000 — subtotal unchanged at 830,000, no negative/zero qty line
    expect(screen.getAllByText("₦830,000")).toHaveLength(2);
  });

  it("disables the quantity and remove controls until the anonymous cart session is ready", () => {
    renderCart();
    expect(
      screen.getByRole("button", { name: "Increase quantity of Kano Upholstered Storage Bed" }),
    ).toBeDisabled();
    expect(screen.getAllByRole("button", { name: "Remove" })[0]).toBeDisabled();
  });
});

describe("CartView — remove", () => {
  it("removes a line item and syncs cart-context with its quantity", async () => {
    renderCart();
    const removeButtons = screen.getAllByRole("button", { name: "Remove" });
    await waitFor(() => expect(removeButtons[1]).not.toBeDisabled());
    fireEvent.click(removeButtons[1]); // Gudu Brass Pendant, qty 2

    await waitFor(() => expect(screen.queryByText("Gudu Brass Pendant")).toBeNull());
    expect(screen.getByText("Kano Upholstered Storage Bed")).toBeInTheDocument();
    await waitFor(() => {
      const deleted = fromMock.mock.results
        .map((r) => r.value)
        .find((stub) => stub.delete.mock.calls.length > 0);
      expect(deleted).toBeDefined();
      expect(deleted!.eq).toHaveBeenCalledWith("id", "cart-item-2");
    });
  });

  it("shows the empty-cart state after removing the last item", async () => {
    renderCart([ITEMS[0]]);
    const removeButton = screen.getByRole("button", { name: "Remove" });
    await waitFor(() => expect(removeButton).not.toBeDisabled());
    fireEvent.click(removeButton);
    await waitFor(() => expect(screen.getByText("Your cart is empty.")).toBeInTheDocument());
  });
});

describe("CartView — suggestions and honesty guards", () => {
  it("renders real suggested products with working links", () => {
    renderCart();
    expect(screen.getByText("You might also like")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Carrara Porcelain/ }),
    ).toHaveAttribute("href", "/products/carrara-porcelain-60x120");
  });

  it("hides the suggestions section entirely when there are none, instead of an empty grid", () => {
    renderCart(ITEMS, []);
    expect(screen.queryByText("You might also like")).toBeNull();
  });

  it("does not claim checkout works — the button is disabled with an honest explanation", () => {
    renderCart();
    const checkout = screen.getByRole("button", { name: "Proceed to Checkout" });
    expect(checkout).toBeDisabled();
    expect(screen.getByText(/Checkout isn't live yet/)).toBeInTheDocument();
  });

  it("never claims a specific delivery cost (e.g. free/Abuja) that isn't backed by real data", () => {
    renderCart();
    expect(screen.queryByText(/free/i)).toBeNull();
  });
});
