import { describe, expect, it, vi, beforeEach } from "vitest";

const getUserMock = vi.fn();
const maybeSingleMock = vi.fn();
const eqMock = vi.fn(() => ({ maybeSingle: maybeSingleMock }));
const selectMock = vi.fn(() => ({ eq: eqMock }));
const fromMock = vi.fn(() => ({ select: selectMock }));
const initializeOrderPaymentMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({
    auth: { getUser: getUserMock },
    from: fromMock,
  }),
}));

vi.mock("@/lib/paystack", () => ({
  initializeOrderPayment: initializeOrderPaymentMock,
}));

const REAL_USER = { id: "user-1", is_anonymous: false };
const ORDER = {
  id: "order-1",
  order_number: "TFH-20260901-ABC123",
  customer_email: "ada@example.com",
  total_kobo: 540000,
  status: "pending_payment",
};

function makeRequest(body: unknown) {
  return new Request("http://localhost:3210/api/checkout/initialize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  getUserMock.mockReset();
  maybeSingleMock.mockReset();
  eqMock.mockClear();
  selectMock.mockClear();
  fromMock.mockClear();
  initializeOrderPaymentMock.mockReset();
});

describe("POST /api/checkout/initialize — auth", () => {
  it("rejects an anonymous session before looking up any order", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "anon-1", is_anonymous: true } } });
    const { POST } = await import("./route");

    const res = await POST(makeRequest({ orderNumber: ORDER.order_number }));

    expect(res.status).toBe(401);
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("rejects when there is no session at all", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    const { POST } = await import("./route");

    const res = await POST(makeRequest({ orderNumber: ORDER.order_number }));
    expect(res.status).toBe(401);
  });
});

describe("POST /api/checkout/initialize — order lookup", () => {
  it("400s when orderNumber is missing from the body", async () => {
    getUserMock.mockResolvedValue({ data: { user: REAL_USER } });
    const { POST } = await import("./route");

    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it("404s when the order doesn't exist (or isn't this user's — the RLS-scoped read returns null either way)", async () => {
    getUserMock.mockResolvedValue({ data: { user: REAL_USER } });
    maybeSingleMock.mockResolvedValue({ data: null, error: null });
    const { POST } = await import("./route");

    const res = await POST(makeRequest({ orderNumber: "not-real" }));
    expect(res.status).toBe(404);
    expect(initializeOrderPaymentMock).not.toHaveBeenCalled();
  });

  it("409s when the order isn't pending_payment (e.g. already paid)", async () => {
    getUserMock.mockResolvedValue({ data: { user: REAL_USER } });
    maybeSingleMock.mockResolvedValue({ data: { ...ORDER, status: "paid" }, error: null });
    const { POST } = await import("./route");

    const res = await POST(makeRequest({ orderNumber: ORDER.order_number }));
    expect(res.status).toBe(409);
    expect(initializeOrderPaymentMock).not.toHaveBeenCalled();
  });
});

describe("POST /api/checkout/initialize — Paystack call", () => {
  it("hands off the order's own DB-computed id/total_kobo — never anything from the request body", async () => {
    getUserMock.mockResolvedValue({ data: { user: REAL_USER } });
    maybeSingleMock.mockResolvedValue({ data: ORDER, error: null });
    initializeOrderPaymentMock.mockResolvedValue({
      status: true,
      data: { authorization_url: "https://checkout.paystack.com/abc", access_code: "x", reference: "whatever" },
    });
    const { POST } = await import("./route");

    // Even if a tampered/malicious body tried to smuggle its own amount,
    // the route never reads it.
    const res = await POST(
      makeRequest({ orderNumber: ORDER.order_number, amountKobo: 1, total_kobo: 1 }),
    );
    const body = await res.json();

    expect(initializeOrderPaymentMock).toHaveBeenCalledWith({
      id: ORDER.id,
      order_number: ORDER.order_number,
      customer_email: ORDER.customer_email,
      total_kobo: ORDER.total_kobo,
      callbackUrl: "http://localhost:3210/checkout/callback",
    });
    expect(body.authorizationUrl).toBe("https://checkout.paystack.com/abc");
  });

  it("502s when Paystack's own initialize call fails", async () => {
    getUserMock.mockResolvedValue({ data: { user: REAL_USER } });
    maybeSingleMock.mockResolvedValue({ data: ORDER, error: null });
    initializeOrderPaymentMock.mockResolvedValue({ status: false, message: "Invalid key", data: null });
    const { POST } = await import("./route");

    const res = await POST(makeRequest({ orderNumber: ORDER.order_number }));
    expect(res.status).toBe(502);
  });
});
