import { describe, expect, it, vi, beforeEach, afterAll } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TrackOrderForm } from "./track-order-form";

const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = vi.fn();
});

afterAll(() => {
  global.fetch = originalFetch;
});

describe("TrackOrderForm", () => {
  it("renders the order reference and email inputs and a look-up button", () => {
    render(<TrackOrderForm />);
    expect(screen.getByLabelText("Order reference")).toBeInTheDocument();
    expect(screen.getByLabelText("Email address")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Look up order" })).toBeInTheDocument();
  });

  it("shows the not-found message with contact links when no order matches", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ found: false }),
    });
    render(<TrackOrderForm />);

    fireEvent.change(screen.getByLabelText("Order reference"), { target: { value: "TFH-999" } });
    fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "nobody@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Look up order" }));

    expect(
      await screen.findByText("We couldn't find an order matching those details."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "WhatsApp us" })).toHaveAttribute(
      "href",
      expect.stringContaining("wa.me/2348033117302"),
    );
  });

  it("shows the order details, status badge, and items when found", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        found: true,
        order: {
          order_number: "TFH-123",
          customer_name: "Jane Doe",
          customer_email: "jane@example.com",
          status: "shipped",
          total_kobo: 500000,
          shipping_address: { address: "1 Test Street, Abuja" },
          created_at: "2026-09-01T00:00:00Z",
          payment_reference: "TFH-123-abcd",
          order_items: [
            { product_name_snapshot: "Positano Sofa", variant_label_snapshot: null, unit_price_kobo: 500000, quantity: 1 },
          ],
        },
      }),
    });
    render(<TrackOrderForm />);

    fireEvent.change(screen.getByLabelText("Order reference"), { target: { value: "TFH-123-abcd" } });
    fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "jane@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Look up order" }));

    expect(await screen.findByText("TFH-123-abcd")).toBeInTheDocument();
    expect(screen.getByText("Shipped")).toBeInTheDocument();
    expect(screen.getByText("Positano Sofa")).toBeInTheDocument();
    expect(screen.getByText("1 Test Street, Abuja")).toBeInTheDocument();
  });
});
