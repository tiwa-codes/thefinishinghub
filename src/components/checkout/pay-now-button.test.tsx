import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PayNowButton } from "./pay-now-button";

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
  // jsdom throws on real navigation — redefine just `href` as a plain,
  // assignable string property so we can observe intent without it
  // actually navigating.
  delete (window as unknown as { location?: unknown }).location;
  Object.defineProperty(window, "location", {
    value: { href: "" },
    writable: true,
    configurable: true,
  });
});

describe("PayNowButton", () => {
  it("initializes payment for the given order and navigates to Paystack's authorization_url on success", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ authorizationUrl: "https://checkout.paystack.com/xyz" }),
    } as Response);

    render(<PayNowButton orderNumber="TFH-20260901-ABC123" className="btn" />);
    fireEvent.click(screen.getByRole("button", { name: "Pay Now" }));

    await waitFor(() => expect(window.location.href).toBe("https://checkout.paystack.com/xyz"));
    expect(fetch).toHaveBeenCalledWith(
      "/api/checkout/initialize",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ orderNumber: "TFH-20260901-ABC123" }),
      }),
    );
  });

  it("shows a real error message and does not navigate when initialization fails", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "ORDER_NOT_PAYABLE" }),
    } as Response);

    render(<PayNowButton orderNumber="TFH-20260901-ABC123" className="btn" />);
    fireEvent.click(screen.getByRole("button", { name: "Pay Now" }));

    expect(await screen.findByText("ORDER_NOT_PAYABLE")).toBeInTheDocument();
    expect(window.location.href).toBe("");
  });
});
