import { describe, expect, it, vi, beforeEach } from "vitest";

const verifyPaystackSignatureMock = vi.fn();
const confirmPaymentMock = vi.fn();

vi.mock("@/lib/paystack", () => ({
  verifyPaystackSignature: verifyPaystackSignatureMock,
  confirmPayment: confirmPaymentMock,
}));

function makeRequest(body: unknown, signature: string | null = "some-signature") {
  const headers = new Headers();
  if (signature !== null) headers.set("x-paystack-signature", signature);
  return new Request("http://localhost/api/webhooks/paystack", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  verifyPaystackSignatureMock.mockReset();
  confirmPaymentMock.mockReset();
});

describe("POST /api/webhooks/paystack — signature verification", () => {
  it("rejects a request whose signature doesn't verify, before touching confirmPayment at all", async () => {
    verifyPaystackSignatureMock.mockReturnValue(false);
    const { POST } = await import("./route");

    const res = await POST(makeRequest({ event: "charge.success", data: { reference: "TFH-1" } }));

    expect(res.status).toBe(401);
    expect(confirmPaymentMock).not.toHaveBeenCalled();
  });

  it("passes the raw request body (not a re-parsed copy) to the signature check", async () => {
    verifyPaystackSignatureMock.mockReturnValue(true);
    confirmPaymentMock.mockResolvedValue({ outcome: "paid" });
    const { POST } = await import("./route");

    const payload = { event: "charge.success", data: { reference: "TFH-1" } };
    await POST(makeRequest(payload, "sig-value"));

    expect(verifyPaystackSignatureMock).toHaveBeenCalledWith(JSON.stringify(payload), "sig-value");
  });
});

describe("POST /api/webhooks/paystack — event handling", () => {
  it("calls confirmPayment with the reference on charge.success", async () => {
    verifyPaystackSignatureMock.mockReturnValue(true);
    confirmPaymentMock.mockResolvedValue({ outcome: "paid" });
    const { POST } = await import("./route");

    const res = await POST(makeRequest({ event: "charge.success", data: { reference: "TFH-20260901-XYZ" } }));

    expect(confirmPaymentMock).toHaveBeenCalledWith("TFH-20260901-XYZ");
    expect(res.status).toBe(200);
  });

  it("acknowledges but takes no action for a non-charge.success event", async () => {
    verifyPaystackSignatureMock.mockReturnValue(true);
    const { POST } = await import("./route");

    const res = await POST(makeRequest({ event: "transfer.success", data: {} }));

    expect(res.status).toBe(200);
    expect(confirmPaymentMock).not.toHaveBeenCalled();
  });

  it("returns 500 (so Paystack retries) when confirmPayment itself throws", async () => {
    verifyPaystackSignatureMock.mockReturnValue(true);
    confirmPaymentMock.mockRejectedValue(new Error("db unreachable"));
    const { POST } = await import("./route");

    const res = await POST(makeRequest({ event: "charge.success", data: { reference: "TFH-1" } }));

    expect(res.status).toBe(500);
  });

  it("still returns 200 for a permanent mismatch outcome — retrying won't fix it", async () => {
    verifyPaystackSignatureMock.mockReturnValue(true);
    confirmPaymentMock.mockResolvedValue({ outcome: "amount_mismatch", reason: "mismatch" });
    const { POST } = await import("./route");

    const res = await POST(makeRequest({ event: "charge.success", data: { reference: "TFH-1" } }));

    expect(res.status).toBe(200);
  });
});
