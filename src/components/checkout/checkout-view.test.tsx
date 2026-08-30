import { describe, expect, it } from "vitest";
import { render, screen, fireEvent, waitFor, act, within } from "@testing-library/react";
import { CartProvider } from "@/lib/cart-context";
import { TradeAccountProvider } from "@/lib/trade-account-context";
import { CheckoutView } from "./checkout-view";
import { rpcMock, emitAuthStateChange } from "@/test/supabase-mock";
import type { CartLineItem } from "@/components/cart/cart-view";

const ITEMS: CartLineItem[] = [
  {
    cartItemId: "cart-item-1",
    productSlug: "kano-upholstered-storage-bed",
    name: "Kano Upholstered Storage Bed",
    config: "",
    quantity: 1,
    unitPriceKobo: 54000000,
    imageUrl: null,
    imageAlt: "Kano Upholstered Storage Bed",
  },
];

function renderCheckout(items: CartLineItem[] = ITEMS, email: string | null = null) {
  return render(
    <CartProvider>
      <TradeAccountProvider>
        <CheckoutView initialItems={items} initialEmail={email} />
      </TradeAccountProvider>
    </CartProvider>,
  );
}

// Bootstraps into a real, non-anonymous session — the state /checkout's
// real form requires. Mirrors what happens for real once SignupForm/
// LoginForm succeed: CartProvider's onAuthStateChange listener flips
// isAnonymous, no page reload involved.
async function signIn() {
  await waitFor(() => expect(screen.queryByText("Loading…")).toBeNull());
  act(() => {
    emitAuthStateChange("SIGNED_IN", {
      user: { id: "real-user", is_anonymous: false, email: "real@example.com" },
    });
  });
}

async function fillForm() {
  fireEvent.change(await screen.findByLabelText("Full name"), {
    target: { value: "  Ada Obi  " },
  });
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "ada@example.com" } });
  fireEvent.change(screen.getByLabelText("Phone"), { target: { value: "08030000000" } });
  fireEvent.change(screen.getByLabelText("Delivery address"), {
    target: { value: "12 Gudu Close, Abuja " },
  });
}

describe("CheckoutView — empty cart", () => {
  it("shows an honest empty-cart message instead of a broken form", async () => {
    renderCheckout([]);
    expect(await screen.findByText("Your cart is empty.")).toBeInTheDocument();
  });
});

describe("CheckoutView — anonymous session", () => {
  it("blocks progress to checkout with a sign-in/create-account gate", async () => {
    renderCheckout();
    expect(await screen.findByText("Sign in to check out")).toBeInTheDocument();
    expect(screen.queryByLabelText("Full name")).toBeNull();
  });

  it("shows a check-your-email state after signup, not the real form — this project requires confirmation before is_anonymous flips", async () => {
    renderCheckout();
    await screen.findByText("Sign in to check out");
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "test@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password123" } });
    const form = document.querySelector("form")!;
    fireEvent.click(within(form).getByRole("button", { name: "Create account" }));

    expect(
      await screen.findByText(/We've sent a confirmation link to/),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Full name")).toBeNull();
  });

  it("still shows the real cart contents alongside the gate, so nothing looks lost", async () => {
    renderCheckout();
    await screen.findByText("Sign in to check out");
    expect(screen.getByText("Kano Upholstered Storage Bed")).toBeInTheDocument();
  });
});

describe("CheckoutView — authenticated", () => {
  it("shows the real checkout form once the session is a real account, pre-filled with its email", async () => {
    renderCheckout(ITEMS, "real@example.com");
    await signIn();
    expect(await screen.findByLabelText("Full name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveValue("real@example.com");
  });

  it("submits trimmed contact details and a structured address to create_order — never a client-supplied total", async () => {
    renderCheckout();
    await signIn();
    await fillForm();
    fireEvent.click(screen.getByRole("button", { name: "Place Order" }));

    await waitFor(() =>
      expect(rpcMock).toHaveBeenCalledWith("create_order", {
        p_customer_name: "Ada Obi",
        p_customer_email: "ada@example.com",
        p_customer_phone: "08030000000",
        p_shipping_address: { address: "12 Gudu Close, Abuja" },
      }),
    );
    const call = rpcMock.mock.calls.find((c) => c[0] === "create_order")!;
    expect(call[1]).not.toHaveProperty("total_kobo");
    expect(call[1]).not.toHaveProperty("subtotal_kobo");
  });

  it("shows the real order number on success and points to /account — cart is never cleared client-side", async () => {
    rpcMock.mockResolvedValueOnce({
      data: { order_number: "TFH-20260828-ABC123" },
      error: null,
    });
    renderCheckout();
    await signIn();
    await fillForm();
    fireEvent.click(screen.getByRole("button", { name: "Place Order" }));

    expect(await screen.findByText("Order received.")).toBeInTheDocument();
    expect(screen.getByText("TFH-20260828-ABC123")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View my orders" })).toHaveAttribute(
      "href",
      "/account",
    );
  });

  it("shows a friendly, actionable message when the cart holds a requires-quote item", async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: { message: "CART_HAS_QUOTE_ITEMS" } });
    renderCheckout();
    await signIn();
    await fillForm();
    fireEvent.click(screen.getByRole("button", { name: "Place Order" }));

    expect(
      await screen.findByText(/needs a quote before it can be ordered online/),
    ).toBeInTheDocument();
  });

  it("falls back to a generic, showroom-referencing message for an unrecognized RPC error", async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: { message: "unexpected_pg_error" } });
    renderCheckout();
    await signIn();
    await fillForm();
    fireEvent.click(screen.getByRole("button", { name: "Place Order" }));

    expect(
      await screen.findByText(/Something went wrong placing your order/),
    ).toBeInTheDocument();
  });
});
