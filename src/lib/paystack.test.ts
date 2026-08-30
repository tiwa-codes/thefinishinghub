import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import crypto from "crypto";

const fromMock = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: fromMock }),
}));

// Chainable query-builder stub — every method returns `stub` so any call
// order/depth works, `.then()` makes `await stub` resolve directly (for
// the update-guard chain, which has no terminal .single()/.maybeSingle()).
function makeStub(result: { data: unknown; error: unknown }) {
  const stub: {
    select: (...args: unknown[]) => typeof stub;
    eq: (...args: unknown[]) => typeof stub;
    update: (...args: unknown[]) => typeof stub;
    delete: (...args: unknown[]) => typeof stub;
    maybeSingle: () => Promise<typeof result>;
    single: () => Promise<typeof result>;
    then: (resolve: (v: typeof result) => void) => void;
  } = {
    select: vi.fn(() => stub),
    eq: vi.fn(() => stub),
    update: vi.fn(() => stub),
    delete: vi.fn(() => stub),
    maybeSingle: vi.fn(async () => result),
    single: vi.fn(async () => result),
    then: (resolve) => resolve(result),
  };
  return stub;
}

const ORDER = {
  id: "order-1",
  order_number: "TFH-20260901-ABC123",
  user_id: "user-1",
  status: "pending_payment",
  total_kobo: 100000,
};

beforeEach(() => {
  process.env.PAYSTACK_SECRET_KEY = "sk_test_dummy";
  fromMock.mockReset();
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("verifyPaystackSignature", () => {
  it("accepts a signature that genuinely matches the raw body", async () => {
    const { verifyPaystackSignature } = await import("./paystack");
    const body = '{"event":"charge.success"}';
    const sig = crypto.createHmac("sha512", "sk_test_dummy").update(body).digest("hex");
    expect(verifyPaystackSignature(body, sig)).toBe(true);
  });

  it("rejects a tampered body against a signature computed for different content", async () => {
    const { verifyPaystackSignature } = await import("./paystack");
    const sig = crypto.createHmac("sha512", "sk_test_dummy").update('{"event":"charge.success"}').digest("hex");
    expect(verifyPaystackSignature('{"event":"charge.success","amount":1}', sig)).toBe(false);
  });

  it("rejects a missing signature header instead of throwing", async () => {
    const { verifyPaystackSignature } = await import("./paystack");
    expect(verifyPaystackSignature("{}", null)).toBe(false);
  });

  it("rejects a signature of the wrong length instead of throwing (timingSafeEqual requires equal lengths)", async () => {
    const { verifyPaystackSignature } = await import("./paystack");
    expect(verifyPaystackSignature("{}", "not-a-real-hex-signature")).toBe(false);
  });
});

describe("confirmPayment", () => {
  it("returns order_not_found without calling Paystack when no order matches the reference", async () => {
    fromMock.mockReturnValueOnce(makeStub({ data: null, error: null }));
    const { confirmPayment } = await import("./paystack");

    const result = await confirmPayment("no-such-ref");
    expect(result.outcome).toBe("order_not_found");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("looks orders up by payment_reference, not order_number — Paystack rejects reusing a reference, so each attempt gets its own", async () => {
    const stub = makeStub({ data: ORDER, error: null });
    fromMock.mockReturnValueOnce(stub);
    vi.mocked(fetch).mockResolvedValueOnce({
      json: async () => ({ status: true, data: { status: "failed", amount: 0, gateway_response: "n/a" } }),
    } as Response);
    const { confirmPayment } = await import("./paystack");

    await confirmPayment(`${ORDER.order_number}-a1b2c3d4`);
    expect(stub.eq).toHaveBeenCalledWith("payment_reference", `${ORDER.order_number}-a1b2c3d4`);
  });

  it("no-ops on an already-paid order without calling Paystack or writing anything", async () => {
    fromMock.mockReturnValueOnce(makeStub({ data: { ...ORDER, status: "paid" }, error: null }));
    const { confirmPayment } = await import("./paystack");

    const result = await confirmPayment(ORDER.order_number);
    expect(result.outcome).toBe("already_paid");
    expect(fetch).not.toHaveBeenCalled();
    expect(fromMock).toHaveBeenCalledTimes(1);
  });

  it("does not mark paid when Paystack's verify says the transaction did not succeed", async () => {
    fromMock.mockReturnValueOnce(makeStub({ data: ORDER, error: null }));
    vi.mocked(fetch).mockResolvedValueOnce({
      json: async () => ({
        status: true,
        data: { status: "failed", amount: ORDER.total_kobo, gateway_response: "Declined" },
      }),
    } as Response);
    const { confirmPayment } = await import("./paystack");

    const result = await confirmPayment(ORDER.order_number);
    expect(result.outcome).toBe("verification_failed");
    // Only the initial read happened — no update/cart-clear call.
    expect(fromMock).toHaveBeenCalledTimes(1);
  });

  it("does not mark paid when the verified amount doesn't match the order's total_kobo — the actual security boundary", async () => {
    fromMock.mockReturnValueOnce(makeStub({ data: ORDER, error: null }));
    vi.mocked(fetch).mockResolvedValueOnce({
      json: async () => ({
        status: true,
        data: { status: "success", amount: 1, gateway_response: "Approved" },
      }),
    } as Response);
    const { confirmPayment } = await import("./paystack");

    const result = await confirmPayment(ORDER.order_number);
    expect(result.outcome).toBe("amount_mismatch");
    expect(fromMock).toHaveBeenCalledTimes(1);
  });

  it("marks the order paid and clears the customer's cart when verification and amount both check out", async () => {
    const updateStub = makeStub({ data: [{ ...ORDER, status: "paid", payment_reference: ORDER.order_number }], error: null });
    const cartDeleteStub = makeStub({ data: null, error: null });
    fromMock
      .mockReturnValueOnce(makeStub({ data: ORDER, error: null })) // initial read
      .mockReturnValueOnce(updateStub) // the paid-transition update
      .mockReturnValueOnce(cartDeleteStub); // cart clear

    vi.mocked(fetch).mockResolvedValueOnce({
      json: async () => ({
        status: true,
        data: { status: "success", amount: ORDER.total_kobo, gateway_response: "Approved" },
      }),
    } as Response);
    const { confirmPayment } = await import("./paystack");

    const result = await confirmPayment(ORDER.order_number);
    expect(result.outcome).toBe("paid");
    expect(updateStub.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "paid", payment_provider: "paystack" }),
    );
    // The guard clause that makes this idempotent under a race.
    expect(updateStub.eq).toHaveBeenCalledWith("status", "pending_payment");
    expect(cartDeleteStub.eq).toHaveBeenCalledWith("user_id", ORDER.user_id);
  });

  it("treats losing the update race (0 rows matched) as already_paid instead of erroring — the idempotency guarantee under concurrent calls", async () => {
    // The guarded UPDATE matches 0 rows (someone else, e.g. a concurrent
    // webhook delivery, already flipped it) — recheck confirms paid.
    fromMock
      .mockReturnValueOnce(makeStub({ data: ORDER, error: null })) // initial read: still pending
      .mockReturnValueOnce(makeStub({ data: [], error: null })) // update matches nothing
      .mockReturnValueOnce(makeStub({ data: { ...ORDER, status: "paid" }, error: null })); // recheck

    vi.mocked(fetch).mockResolvedValueOnce({
      json: async () => ({
        status: true,
        data: { status: "success", amount: ORDER.total_kobo, gateway_response: "Approved" },
      }),
    } as Response);
    const { confirmPayment } = await import("./paystack");

    const result = await confirmPayment(ORDER.order_number);
    expect(result.outcome).toBe("already_paid");
  });
});

describe("initializeOrderPayment", () => {
  it("generates a reference distinct from the bare order_number and stores it as the order's current payment_reference before calling Paystack", async () => {
    const updateStub = makeStub({ data: null, error: null });
    fromMock.mockReturnValueOnce(updateStub);
    vi.mocked(fetch).mockResolvedValueOnce({
      json: async () => ({
        status: true,
        data: { authorization_url: "https://checkout.paystack.com/xyz", access_code: "x", reference: "whatever" },
      }),
    } as Response);
    const { initializeOrderPayment } = await import("./paystack");

    const result = await initializeOrderPayment({
      id: ORDER.id,
      order_number: ORDER.order_number,
      customer_email: "ada@example.com",
      total_kobo: ORDER.total_kobo,
      callbackUrl: "http://localhost:3210/checkout/callback",
    });

    expect(updateStub.update).toHaveBeenCalledTimes(1);
    const storedReference = (vi.mocked(updateStub.update).mock.calls[0][0] as { payment_reference: string })
      .payment_reference;
    expect(storedReference).not.toBe(ORDER.order_number);
    expect(storedReference.startsWith(`${ORDER.order_number}-`)).toBe(true);
    expect(updateStub.eq).toHaveBeenCalledWith("id", ORDER.id);

    // The reference actually sent to Paystack matches the one just stored
    // — a retry can't succeed against a stale/different reference.
    const fetchBody = JSON.parse((vi.mocked(fetch).mock.calls[0][1] as RequestInit).body as string);
    expect(fetchBody.reference).toBe(storedReference);
    expect(result.data?.authorization_url).toBe("https://checkout.paystack.com/xyz");
  });
});
