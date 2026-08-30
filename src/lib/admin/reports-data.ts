// Pure aggregation logic for /admin/reports — deliberately separated from
// data fetching (page.tsx) so the bucketing/grouping/sorting rules are
// unit-testable without a Supabase mock. Every function takes plain
// already-fetched rows and returns plain display-ready data; "no data yet"
// is signaled by an empty array/all-zero result, which the page decides
// how to render — these functions don't know about UI.

// Only paid + fulfilled orders represent real revenue — pending_payment
// hasn't been collected yet, cancelled never will be. Shared by every
// revenue-based metric below so "which statuses count as revenue" is
// defined in exactly one place.
const REVENUE_STATUSES = ["paid", "fulfilled"];

export function isRevenueStatus(status: string): boolean {
  return REVENUE_STATUSES.includes(status);
}

export type ReportOrderRow = {
  status: string;
  total_kobo: number;
  user_id: string | null;
  created_at: string;
};

export type ReportOrderItemRow = {
  order_status: string;
  product_name_snapshot: string;
  unit_price_kobo: number;
  quantity: number;
  category_id: string | null;
};

export type ReportQuoteRequestRow = {
  status: string;
};

export type NamedRevenue = { name: string; kobo: number };
export type StatusCount = { status: string; count: number };

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

// Monday of the ISO week containing this date, as a YYYY-MM-DD string —
// UTC throughout so bucketing doesn't shift with the server's local TZ.
function mondayOfWeek(iso: string): string {
  const d = new Date(`${dayKey(iso)}T00:00:00Z`);
  const weekday = d.getUTCDay(); // 0 = Sunday .. 6 = Saturday
  const daysSinceMonday = weekday === 0 ? 6 : weekday - 1;
  d.setUTCDate(d.getUTCDate() - daysSinceMonday);
  return d.toISOString().slice(0, 10);
}

const WEEKLY_BUCKET_THRESHOLD_DAYS = 60;

export type RevenueOverTime = {
  granularity: "day" | "week";
  // label is always a YYYY-MM-DD date — for "week" it's that week's Monday.
  // Formatting ("Week of …") is a presentation decision, not this
  // function's concern.
  buckets: { label: string; kobo: number }[];
};

export function computeRevenueOverTime(orders: ReportOrderRow[]): RevenueOverTime {
  const revenueOrders = orders.filter((o) => isRevenueStatus(o.status));
  if (revenueOrders.length === 0) {
    return { granularity: "day", buckets: [] };
  }

  const days = revenueOrders.map((o) => dayKey(o.created_at)).sort();
  const spanDays =
    (new Date(days[days.length - 1]).getTime() - new Date(days[0]).getTime()) /
    (1000 * 60 * 60 * 24);
  const granularity: "day" | "week" = spanDays <= WEEKLY_BUCKET_THRESHOLD_DAYS ? "day" : "week";

  const totals = new Map<string, number>();
  for (const o of revenueOrders) {
    const key = granularity === "day" ? dayKey(o.created_at) : mondayOfWeek(o.created_at);
    totals.set(key, (totals.get(key) ?? 0) + o.total_kobo);
  }

  const buckets = Array.from(totals.entries())
    .map(([label, kobo]) => ({ label, kobo }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return { granularity, buckets };
}

const ALL_ORDER_STATUSES = ["pending_payment", "paid", "fulfilled", "cancelled"];

export function computeOrderStatusBreakdown(orders: ReportOrderRow[]): StatusCount[] {
  const counts = new Map(ALL_ORDER_STATUSES.map((s) => [s, 0]));
  for (const o of orders) {
    counts.set(o.status, (counts.get(o.status) ?? 0) + 1);
  }
  return ALL_ORDER_STATUSES.map((status) => ({ status, count: counts.get(status) ?? 0 }));
}

export function computeTopProductsByRevenue(
  items: ReportOrderItemRow[],
  limit = 10,
): NamedRevenue[] {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (!isRevenueStatus(item.order_status)) continue;
    const revenue = item.unit_price_kobo * item.quantity;
    totals.set(item.product_name_snapshot, (totals.get(item.product_name_snapshot) ?? 0) + revenue);
  }
  return Array.from(totals.entries())
    .map(([name, kobo]) => ({ name, kobo }))
    .sort((a, b) => b.kobo - a.kobo)
    .slice(0, limit);
}

// resolveCategoryName is injected rather than a category tree/shape baked
// in here — keeps this function testable with a trivial resolver, and
// lets the real caller reuse the existing admin category-tree resolver
// (lib/admin/category-tree.ts) rather than this module duplicating
// "walk up to the top-level parent" logic a second time.
export function computeRevenueByCategory(
  items: ReportOrderItemRow[],
  resolveCategoryName: (categoryId: string | null) => string,
): NamedRevenue[] {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (!isRevenueStatus(item.order_status)) continue;
    const name = resolveCategoryName(item.category_id);
    const revenue = item.unit_price_kobo * item.quantity;
    totals.set(name, (totals.get(name) ?? 0) + revenue);
  }
  return Array.from(totals.entries())
    .map(([name, kobo]) => ({ name, kobo }))
    .sort((a, b) => b.kobo - a.kobo);
}

export type TradeVsRetailSplit = { tradeKobo: number; retailKobo: number };

// "Trade" is defined as: the customer who placed this order currently
// holds an approved trade_accounts row — the same live definition used
// everywhere else this feature reads trade status (TradeAccountContext,
// public_product_variants). Orders don't snapshot "was this a trade
// price" at creation time, so if a customer's trade status changes AFTER
// placing an order, this reclassifies that past order retroactively.
// Acceptable for a v1 reporting dashboard against near-zero real data —
// revisit with a stored per-order flag if trade-status churn ever makes
// this misleading in practice.
export function computeTradeVsRetailSplit(
  orders: ReportOrderRow[],
  approvedTradeUserIds: ReadonlySet<string>,
): TradeVsRetailSplit {
  let tradeKobo = 0;
  let retailKobo = 0;
  for (const o of orders) {
    if (!isRevenueStatus(o.status)) continue;
    if (o.user_id && approvedTradeUserIds.has(o.user_id)) {
      tradeKobo += o.total_kobo;
    } else {
      retailKobo += o.total_kobo;
    }
  }
  return { tradeKobo, retailKobo };
}

const QUOTE_STATUSES = ["pending", "quoted", "accepted", "declined"];

export function computeQuoteFunnel(quotes: ReportQuoteRequestRow[]): StatusCount[] {
  const counts = new Map(QUOTE_STATUSES.map((s) => [s, 0]));
  for (const q of quotes) {
    counts.set(q.status, (counts.get(q.status) ?? 0) + 1);
  }
  return QUOTE_STATUSES.map((status) => ({ status, count: counts.get(status) ?? 0 }));
}
