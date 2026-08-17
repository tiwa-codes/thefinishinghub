import { describe, expect, it } from "vitest";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import { CartProvider, useCart } from "./cart-context";
import { fromMock, rpcMock } from "@/test/supabase-mock";

function Consumer() {
  const { count, ready, setItemQuantity, removeItem } = useCart();
  return (
    <div>
      <span data-testid="count">{count}</span>
      <span data-testid="ready">{String(ready)}</span>
      <button onClick={() => setItemQuantity("cart-item-1", 3, 2)}>set-qty</button>
      <button onClick={() => removeItem("cart-item-1", 2)}>remove</button>
    </div>
  );
}

async function renderReady() {
  const utils = render(
    <CartProvider>
      <Consumer />
    </CartProvider>,
  );
  await waitFor(() => expect(screen.getByTestId("ready")).toHaveTextContent("true"));
  return utils;
}

describe("CartProvider — setItemQuantity", () => {
  it("updates the row by id through cart_items and applies the caller-supplied delta to count", async () => {
    await renderReady();
    expect(screen.getByTestId("count")).toHaveTextContent("0");

    fireEvent.click(screen.getByText("set-qty"));

    await waitFor(() => expect(screen.getByTestId("count")).toHaveTextContent("2"));
    expect(fromMock).toHaveBeenCalledWith("cart_items");
    const stub = fromMock.mock.results[fromMock.mock.results.length - 1].value;
    expect(stub.update).toHaveBeenCalledWith({ quantity: 3 });
    expect(stub.eq).toHaveBeenCalledWith("id", "cart-item-1");
  });
});

describe("CartProvider — removeItem", () => {
  it("deletes the row by id through cart_items and subtracts its quantity from count", async () => {
    await renderReady();

    // Get count to 2 first via setItemQuantity, then remove.
    fireEvent.click(screen.getByText("set-qty"));
    await waitFor(() => expect(screen.getByTestId("count")).toHaveTextContent("2"));
    fromMock.mockClear();

    fireEvent.click(screen.getByText("remove"));

    await waitFor(() => expect(screen.getByTestId("count")).toHaveTextContent("0"));
    expect(fromMock).toHaveBeenCalledWith("cart_items");
    const stub = fromMock.mock.results[fromMock.mock.results.length - 1].value;
    expect(stub.delete).toHaveBeenCalled();
    expect(stub.eq).toHaveBeenCalledWith("id", "cart-item-1");
  });
});

describe("CartProvider — add (regression)", () => {
  it("still goes through the atomic add_to_cart RPC, unaffected by the new methods", async () => {
    function AddConsumer() {
      const { add, ready } = useCart();
      return (
        <button disabled={!ready} onClick={() => add("variant-9", 4)}>
          add
        </button>
      );
    }
    render(
      <CartProvider>
        <AddConsumer />
      </CartProvider>,
    );
    await waitFor(() => expect(screen.getByText("add")).not.toBeDisabled());

    await act(async () => {
      fireEvent.click(screen.getByText("add"));
    });

    expect(rpcMock).toHaveBeenCalledWith("add_to_cart", {
      p_variant_id: "variant-9",
      p_quantity: 4,
    });
  });
});
