import { describe, expect, it, vi, beforeEach } from "vitest";

const maybeSingleMock = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          ilike: () => ({
            maybeSingle: maybeSingleMock,
          }),
        }),
      }),
    }),
  }),
}));

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/orders/lookup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  maybeSingleMock.mockReset();
});

describe("POST /api/orders/lookup", () => {
  it("returns found: false for a reference/email that doesn't match any order", async () => {
    maybeSingleMock.mockResolvedValue({ data: null, error: null });
    const { POST } = await import("./route");

    const res = await POST(makeRequest({ reference: "TFH-doesnotexist", email: "nobody@example.com" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ found: false });
  });

  it("rejects when reference or email is missing", async () => {
    const { POST } = await import("./route");

    const res = await POST(makeRequest({ reference: "", email: "" }));

    expect(res.status).toBe(400);
  });

  it("returns found: true with the order when both match", async () => {
    const order = {
      order_number: "TFH-123",
      customer_name: "Jane Doe",
      customer_email: "jane@example.com",
      status: "paid",
      total_kobo: 500000,
      shipping_address: { address: "1 Test Street, Abuja" },
      created_at: "2026-09-01T00:00:00Z",
      payment_reference: "TFH-123-abcd",
      order_items: [],
    };
    maybeSingleMock.mockResolvedValue({ data: order, error: null });
    const { POST } = await import("./route");

    const res = await POST(makeRequest({ reference: "TFH-123-abcd", email: "jane@example.com" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ found: true, order });
  });
});
