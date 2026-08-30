import { describe, expect, it } from "vitest";
import {
  isRevenueStatus,
  computeRevenueOverTime,
  computeOrderStatusBreakdown,
  computeTopProductsByRevenue,
  computeRevenueByCategory,
  computeTradeVsRetailSplit,
  computeQuoteFunnel,
  type ReportOrderRow,
  type ReportOrderItemRow,
  type ReportQuoteRequestRow,
} from "./reports-data";

function order(overrides: Partial<ReportOrderRow> = {}): ReportOrderRow {
  return {
    status: "paid",
    total_kobo: 100000,
    user_id: "user-1",
    created_at: "2026-08-10T12:00:00Z",
    ...overrides,
  };
}

function item(overrides: Partial<ReportOrderItemRow> = {}): ReportOrderItemRow {
  return {
    order_status: "paid",
    product_name_snapshot: "Test Product",
    unit_price_kobo: 100000,
    quantity: 1,
    category_id: "cat-1",
    ...overrides,
  };
}

describe("isRevenueStatus", () => {
  it("treats paid and fulfilled as revenue", () => {
    expect(isRevenueStatus("paid")).toBe(true);
    expect(isRevenueStatus("fulfilled")).toBe(true);
  });

  it("treats pending_payment and cancelled as not revenue", () => {
    expect(isRevenueStatus("pending_payment")).toBe(false);
    expect(isRevenueStatus("cancelled")).toBe(false);
  });
});

describe("computeRevenueOverTime", () => {
  it("returns an honest empty result — no fabricated buckets — when there are no revenue orders", () => {
    expect(computeRevenueOverTime([])).toEqual({ granularity: "day", buckets: [] });
    expect(
      computeRevenueOverTime([order({ status: "pending_payment" }), order({ status: "cancelled" })]),
    ).toEqual({ granularity: "day", buckets: [] });
  });

  it("buckets by day and sums same-day orders, excluding non-revenue orders", () => {
    const result = computeRevenueOverTime([
      order({ status: "paid", total_kobo: 100000, created_at: "2026-08-10T09:00:00Z" }),
      order({ status: "fulfilled", total_kobo: 50000, created_at: "2026-08-10T18:00:00Z" }),
      order({ status: "paid", total_kobo: 200000, created_at: "2026-08-11T09:00:00Z" }),
      order({ status: "pending_payment", total_kobo: 999999, created_at: "2026-08-10T09:00:00Z" }),
    ]);
    expect(result.granularity).toBe("day");
    expect(result.buckets).toEqual([
      { label: "2026-08-10", kobo: 150000 },
      { label: "2026-08-11", kobo: 200000 },
    ]);
  });

  it("switches to weekly buckets once the span exceeds 60 days, bucketed by the Monday of each week", () => {
    const result = computeRevenueOverTime([
      order({ total_kobo: 100000, created_at: "2026-01-05T09:00:00Z" }), // Monday
      order({ total_kobo: 50000, created_at: "2026-01-07T09:00:00Z" }), // same week, Wednesday
      order({ total_kobo: 200000, created_at: "2026-06-01T09:00:00Z" }),
    ]);
    expect(result.granularity).toBe("week");
    expect(result.buckets[0]).toEqual({ label: "2026-01-05", kobo: 150000 });
    expect(result.buckets).toHaveLength(2);
  });

  it("stays daily for a span of exactly 60 days", () => {
    const result = computeRevenueOverTime([
      order({ created_at: "2026-01-01T00:00:00Z" }),
      order({ created_at: "2026-03-02T00:00:00Z" }), // 60 days later
    ]);
    expect(result.granularity).toBe("day");
  });
});

describe("computeOrderStatusBreakdown", () => {
  it("returns all four statuses at zero — not an empty array — when there are no orders", () => {
    expect(computeOrderStatusBreakdown([])).toEqual([
      { status: "pending_payment", count: 0 },
      { status: "paid", count: 0 },
      { status: "fulfilled", count: 0 },
      { status: "cancelled", count: 0 },
    ]);
  });

  it("counts each real status correctly", () => {
    const result = computeOrderStatusBreakdown([
      order({ status: "paid" }),
      order({ status: "paid" }),
      order({ status: "pending_payment" }),
      order({ status: "cancelled" }),
    ]);
    expect(result).toEqual([
      { status: "pending_payment", count: 1 },
      { status: "paid", count: 2 },
      { status: "fulfilled", count: 0 },
      { status: "cancelled", count: 1 },
    ]);
  });
});

describe("computeTopProductsByRevenue", () => {
  it("returns an empty array when there are no revenue order items", () => {
    expect(computeTopProductsByRevenue([])).toEqual([]);
    expect(computeTopProductsByRevenue([item({ order_status: "pending_payment" })])).toEqual([]);
  });

  it("sums quantity*price per product, across multiple line items, excluding non-revenue orders", () => {
    const result = computeTopProductsByRevenue([
      item({ product_name_snapshot: "Sofa", unit_price_kobo: 500000, quantity: 2 }),
      item({ product_name_snapshot: "Sofa", unit_price_kobo: 500000, quantity: 1 }),
      item({ product_name_snapshot: "Lamp", unit_price_kobo: 100000, quantity: 1 }),
      item({ product_name_snapshot: "Lamp", unit_price_kobo: 100000, quantity: 1, order_status: "pending_payment" }),
    ]);
    expect(result).toEqual([
      { name: "Sofa", kobo: 1500000 },
      { name: "Lamp", kobo: 100000 },
    ]);
  });

  it("sorts descending by revenue and respects the limit", () => {
    const items = [
      item({ product_name_snapshot: "A", unit_price_kobo: 100, quantity: 1 }),
      item({ product_name_snapshot: "B", unit_price_kobo: 300, quantity: 1 }),
      item({ product_name_snapshot: "C", unit_price_kobo: 200, quantity: 1 }),
    ];
    expect(computeTopProductsByRevenue(items, 2)).toEqual([
      { name: "B", kobo: 300 },
      { name: "C", kobo: 200 },
    ]);
  });
});

describe("computeRevenueByCategory", () => {
  it("returns an empty array when there are no revenue order items", () => {
    expect(computeRevenueByCategory([], () => "Furniture")).toEqual([]);
  });

  it("groups by the resolver's returned name and excludes non-revenue orders", () => {
    const resolver = (categoryId: string | null) =>
      categoryId === "cat-furniture" ? "Furniture" : "Lighting";
    const result = computeRevenueByCategory(
      [
        item({ category_id: "cat-furniture", unit_price_kobo: 100000, quantity: 1 }),
        item({ category_id: "cat-furniture", unit_price_kobo: 200000, quantity: 1 }),
        item({ category_id: "cat-lighting", unit_price_kobo: 50000, quantity: 1 }),
        item({ category_id: "cat-furniture", unit_price_kobo: 999999, quantity: 1, order_status: "cancelled" }),
      ],
      resolver,
    );
    expect(result).toEqual([
      { name: "Furniture", kobo: 300000 },
      { name: "Lighting", kobo: 50000 },
    ]);
  });

  it("buckets a null category_id (e.g. a deleted variant) under whatever the resolver returns for null", () => {
    const result = computeRevenueByCategory(
      [item({ category_id: null, unit_price_kobo: 50000, quantity: 1 })],
      () => "Uncategorized",
    );
    expect(result).toEqual([{ name: "Uncategorized", kobo: 50000 }]);
  });
});

describe("computeTradeVsRetailSplit", () => {
  it("returns zero/zero — not an empty/undefined shape — when there are no revenue orders", () => {
    expect(computeTradeVsRetailSplit([], new Set())).toEqual({ tradeKobo: 0, retailKobo: 0 });
  });

  it("splits revenue by whether the order's user_id is an approved trade account, excluding non-revenue orders", () => {
    const tradeIds = new Set(["trade-user"]);
    const result = computeTradeVsRetailSplit(
      [
        order({ user_id: "trade-user", total_kobo: 160000, status: "paid" }),
        order({ user_id: "retail-user", total_kobo: 200000, status: "fulfilled" }),
        order({ user_id: "trade-user", total_kobo: 999999, status: "pending_payment" }),
      ],
      tradeIds,
    );
    expect(result).toEqual({ tradeKobo: 160000, retailKobo: 200000 });
  });

  it("treats a null user_id as retail rather than throwing or miscounting", () => {
    const result = computeTradeVsRetailSplit([order({ user_id: null, total_kobo: 50000 })], new Set(["x"]));
    expect(result).toEqual({ tradeKobo: 0, retailKobo: 50000 });
  });
});

describe("computeQuoteFunnel", () => {
  it("returns all four statuses at zero — not an empty array — when there are no quote requests", () => {
    expect(computeQuoteFunnel([])).toEqual([
      { status: "pending", count: 0 },
      { status: "quoted", count: 0 },
      { status: "accepted", count: 0 },
      { status: "declined", count: 0 },
    ]);
  });

  it("counts each real quote status correctly", () => {
    const quotes: ReportQuoteRequestRow[] = [
      { status: "pending" },
      { status: "pending" },
      { status: "quoted" },
      { status: "accepted" },
      { status: "declined" },
    ];
    expect(computeQuoteFunnel(quotes)).toEqual([
      { status: "pending", count: 2 },
      { status: "quoted", count: 1 },
      { status: "accepted", count: 1 },
      { status: "declined", count: 1 },
    ]);
  });
});
