import { describe, expect, it } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CartProvider } from "@/lib/cart-context";
import { fromMock, makeQueryStub } from "@/test/supabase-mock";
import { QuoteRequestForm } from "./quote-request-form";

function renderForm(productId = "product-1", variantId: string | null = "variant-1") {
  return render(
    <CartProvider>
      <QuoteRequestForm productId={productId} variantId={variantId} />
    </CartProvider>,
  );
}

describe("QuoteRequestForm", () => {
  it("submits a real quote_requests row for the anonymous session's own user_id", async () => {
    renderForm();
    const submit = screen.getByRole("button", { name: /Request a Quote/ });
    await waitFor(() => expect(submit).not.toBeDisabled());

    fireEvent.change(screen.getByPlaceholderText(/Anything we should know/), {
      target: { value: "Need it in walnut finish." },
    });
    fireEvent.click(submit);

    await waitFor(() => {
      const insertCall = fromMock.mock.results
        .map((r) => r.value)
        .find((stub) => stub.insert.mock.calls.length > 0);
      expect(insertCall).toBeDefined();
      expect(insertCall!.insert).toHaveBeenCalledWith({
        user_id: "test-anon-user",
        product_id: "product-1",
        variant_id: "variant-1",
        message: "Need it in walnut finish.",
      });
    });
  });

  it("sends null for an empty optional message, not an empty string", async () => {
    renderForm();
    const submit = screen.getByRole("button", { name: /Request a Quote/ });
    await waitFor(() => expect(submit).not.toBeDisabled());
    fireEvent.click(submit);

    await waitFor(() => {
      const insertCall = fromMock.mock.results
        .map((r) => r.value)
        .find((stub) => stub.insert.mock.calls.length > 0);
      expect(insertCall!.insert).toHaveBeenCalledWith(
        expect.objectContaining({ message: null }),
      );
    });
  });

  it("shows a nudge to create an account (still anonymous) after a successful request", async () => {
    renderForm();
    const submit = screen.getByRole("button", { name: /Request a Quote/ });
    await waitFor(() => expect(submit).not.toBeDisabled());
    fireEvent.click(submit);

    expect(await screen.findByText(/Create an account so you can track it/)).toBeInTheDocument();
  });

  it("shows a real error message and stays on the form if the insert fails", async () => {
    // By table name, not call order — CartProvider's own bootstrap effect
    // also calls .from("cart_items") on mount, before this form's insert.
    fromMock.mockImplementation((table?: string) =>
      table === "quote_requests"
        ? makeQueryStub({ data: null, error: { message: "Network error" } })
        : makeQueryStub({ data: [], error: null }),
    );
    renderForm();
    const submit = screen.getByRole("button", { name: /Request a Quote/ });
    await waitFor(() => expect(submit).not.toBeDisabled());
    fireEvent.click(submit);

    expect(await screen.findByText("Network error")).toBeInTheDocument();
    expect(screen.queryByText(/Request sent/)).toBeNull();
  });
});
