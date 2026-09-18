import { describe, expect, it, vi, beforeEach } from "vitest";

const getUserMock = vi.fn();
const staffMaybeSingleMock = vi.fn();
const orderMaybeSingleMock = vi.fn();
const updateEqMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({
    auth: { getUser: getUserMock },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: staffMaybeSingleMock,
        }),
      }),
    }),
  }),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: orderMaybeSingleMock,
        }),
      }),
      update: () => ({
        eq: updateEqMock,
      }),
    }),
  }),
}));

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/admin/orders/order-1/status", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  getUserMock.mockReset();
  staffMaybeSingleMock.mockReset();
  orderMaybeSingleMock.mockReset();
  updateEqMock.mockReset();
  updateEqMock.mockResolvedValue({ error: null });
});

describe("POST /api/admin/orders/[id]/status", () => {
  it("rejects when not signed in", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    const { POST } = await import("./route");

    const res = await POST(makeRequest({ status: "processing" }), { params: { id: "order-1" } });

    expect(res.status).toBe(401);
  });

  it("rejects a signed-in user who isn't staff", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
    staffMaybeSingleMock.mockResolvedValue({ data: null });
    const { POST } = await import("./route");

    const res = await POST(makeRequest({ status: "processing" }), { params: { id: "order-1" } });

    expect(res.status).toBe(403);
  });

  it("rejects a transition the current status doesn't allow", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "staff-1" } } });
    staffMaybeSingleMock.mockResolvedValue({ data: { id: "staff-1" } });
    orderMaybeSingleMock.mockResolvedValue({ data: { id: "order-1", status: "pending_payment" } });
    const { POST } = await import("./route");

    // pending_payment can only move to cancelled, not shipped
    const res = await POST(makeRequest({ status: "shipped" }), { params: { id: "order-1" } });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toMatch(/Cannot move an order/);
    expect(updateEqMock).not.toHaveBeenCalled();
  });

  it("accepts a valid transition and writes the new status", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "staff-1" } } });
    staffMaybeSingleMock.mockResolvedValue({ data: { id: "staff-1" } });
    orderMaybeSingleMock.mockResolvedValue({ data: { id: "order-1", status: "paid" } });
    const { POST } = await import("./route");

    const res = await POST(makeRequest({ status: "processing" }), { params: { id: "order-1" } });

    expect(res.status).toBe(200);
    expect(updateEqMock).toHaveBeenCalledWith("id", "order-1");
  });

  it("returns 404 when the order doesn't exist", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "staff-1" } } });
    staffMaybeSingleMock.mockResolvedValue({ data: { id: "staff-1" } });
    orderMaybeSingleMock.mockResolvedValue({ data: null });
    const { POST } = await import("./route");

    const res = await POST(makeRequest({ status: "processing" }), { params: { id: "missing" } });

    expect(res.status).toBe(404);
  });
});
