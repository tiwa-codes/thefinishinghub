import type { Metadata } from "next";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { fetchCategoryTree, findTopLevelCategoryForId } from "@/lib/admin/category-tree";
import { formatNaira } from "@/lib/format";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";
import {
  computeRevenueOverTime,
  computeOrderStatusBreakdown,
  computeTopProductsByRevenue,
  computeRevenueByCategory,
  computeTradeVsRetailSplit,
  computeQuoteFunnel,
  type ReportOrderRow,
  type ReportOrderItemRow,
  type ReportQuoteRequestRow,
} from "@/lib/admin/reports-data";

export const metadata: Metadata = { title: "Reports — The Finishing Hub Admin" };

const QUOTE_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  quoted: "Quoted",
  accepted: "Accepted",
  declined: "Declined",
};

// Website data only, all-time, no date-range picker — see the PR
// description for what's deliberately out of scope (sales-by-suite,
// sales-by-associate: need POS, doesn't exist yet; new-signups-over-time:
// would need the Auth Admin API/service-role key on every dashboard load,
// too broad a credential for this — customer_summary's first/last-order
// dates are the closest proxy for customer activity available without it,
// and aren't attempted here as a signups timeline substitute).

type OrderItemQueryRow = {
  product_name_snapshot: string;
  unit_price_kobo: number;
  quantity: number;
  orders: { status: string } | null;
  product_variants: {
    products: { category_id: string } | null;
  } | null;
};

export default async function AdminReportsPage() {
  const supabase = createClient();

  const [ordersRes, orderItemsRes, tradeAccountsRes, quotesRes, categoryTree] = await Promise.all([
    supabase
      .from("orders")
      .select("status, total_kobo, user_id, created_at")
      .returns<ReportOrderRow[]>(),
    supabase
      .from("order_items")
      .select(
        `
        product_name_snapshot, unit_price_kobo, quantity,
        orders ( status ),
        product_variants ( products ( category_id ) )
      `,
      )
      .returns<OrderItemQueryRow[]>(),
    supabase.from("trade_accounts").select("id").eq("status", "approved"),
    supabase.from("quote_requests").select("status").returns<ReportQuoteRequestRow[]>(),
    fetchCategoryTree(supabase),
  ]);

  const orders = ordersRes.data ?? [];
  const approvedTradeUserIds = new Set((tradeAccountsRes.data ?? []).map((r) => r.id));
  const quotes = quotesRes.data ?? [];

  const orderItems: ReportOrderItemRow[] = (orderItemsRes.data ?? []).map((row) => ({
    order_status: row.orders?.status ?? "",
    product_name_snapshot: row.product_name_snapshot,
    unit_price_kobo: row.unit_price_kobo,
    quantity: row.quantity,
    category_id: row.product_variants?.products?.category_id ?? null,
  }));

  const revenueOverTime = computeRevenueOverTime(orders);
  const statusBreakdown = computeOrderStatusBreakdown(orders);
  const topProducts = computeTopProductsByRevenue(orderItems);
  const revenueByCategory = computeRevenueByCategory(orderItems, (categoryId) => {
    return findTopLevelCategoryForId(categoryTree, categoryId)?.name ?? "Uncategorized";
  });
  const tradeSplit = computeTradeVsRetailSplit(orders, approvedTradeUserIds);
  const quoteFunnel = computeQuoteFunnel(quotes);

  const hasAnyOrders = orders.length > 0;
  const hasRevenue = revenueOverTime.buckets.length > 0;
  const hasTopProducts = topProducts.length > 0;
  const hasCategoryRevenue = revenueByCategory.length > 0;
  const hasTradeRevenue = tradeSplit.tradeKobo + tradeSplit.retailKobo > 0;
  const hasQuotes = quotes.length > 0;

  return (
    <div className="max-w-[1080px]">
      <div className="mb-8 font-serif text-2xl text-ink">Reports</div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ReportCard title="Revenue over time" subtitle="Paid + fulfilled orders, all-time">
          {hasRevenue ? (
            <DateBarList revenueOverTime={revenueOverTime} />
          ) : (
            <EmptyMetric message="No revenue yet — this fills in as orders are paid." />
          )}
        </ReportCard>

        <ReportCard title="Order status breakdown" subtitle="All orders, all-time">
          {hasAnyOrders ? (
            <BarList
              rows={statusBreakdown.map((s) => ({
                label: ORDER_STATUS_LABELS[s.status] ?? s.status,
                value: s.count,
              }))}
              formatValue={(v) => String(v)}
            />
          ) : (
            <EmptyMetric message="No orders yet." />
          )}
        </ReportCard>

        <ReportCard title="Top products by revenue" subtitle="Paid + fulfilled orders, all-time">
          {hasTopProducts ? (
            <BarList
              rows={topProducts.map((p) => ({ label: p.name, value: p.kobo }))}
              formatValue={(v) => formatNaira(v)}
            />
          ) : (
            <EmptyMetric message="No product sales yet." />
          )}
        </ReportCard>

        <ReportCard title="Revenue by category" subtitle="Paid + fulfilled orders, all-time">
          {hasCategoryRevenue ? (
            <BarList
              rows={revenueByCategory.map((c) => ({ label: c.name, value: c.kobo }))}
              formatValue={(v) => formatNaira(v)}
            />
          ) : (
            <EmptyMetric message="No category revenue yet." />
          )}
        </ReportCard>

        <ReportCard title="Trade vs. retail revenue" subtitle="Paid + fulfilled orders, all-time">
          {hasTradeRevenue ? (
            <BarList
              rows={[
                { label: "Trade", value: tradeSplit.tradeKobo },
                { label: "Retail", value: tradeSplit.retailKobo },
              ]}
              formatValue={(v) => formatNaira(v)}
            />
          ) : (
            <EmptyMetric message="No revenue yet to split by trade vs. retail." />
          )}
        </ReportCard>

        <ReportCard title="Quote pipeline" subtitle="All quote requests, all-time">
          {hasQuotes ? (
            <BarList
              rows={quoteFunnel.map((q) => ({
                label: QUOTE_STATUS_LABELS[q.status] ?? q.status,
                value: q.count,
              }))}
              formatValue={(v) => String(v)}
            />
          ) : (
            <EmptyMetric message="No quote requests yet." />
          )}
        </ReportCard>
      </div>
    </div>
  );
}

function ReportCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[2px] border border-[#ddd5c4] bg-white px-6 py-5">
      <div className="font-serif text-lg text-ink">{title}</div>
      {subtitle && <div className="mb-4 mt-0.5 text-xs text-[#8a8073]">{subtitle}</div>}
      <div className={subtitle ? "" : "mt-4"}>{children}</div>
    </div>
  );
}

// Consistent, intentional-looking "nothing here yet" — a dashed-border box
// with an honest one-line explanation, never a blank card or a chart
// rendered against an empty dataset (which would show as a bare axis with
// nothing on it, reading as broken rather than "no data").
function EmptyMetric({ message }: { message: string }) {
  return (
    <div className="flex h-[120px] items-center justify-center rounded-[2px] border border-dashed border-[#cfc6b6] bg-cream px-4 text-center text-[13px] text-[#8a8073]">
      {message}
    </div>
  );
}

function BarList({
  rows,
  formatValue,
}: {
  rows: { label: string; value: number }[];
  formatValue: (v: number) => string;
}) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <div className="flex flex-col gap-3">
      {rows.map((r) => (
        <div key={r.label}>
          <div className="mb-1 flex items-center justify-between gap-3 text-[13px]">
            <span className="text-ink">{r.label}</span>
            <span className="whitespace-nowrap text-[#6b6155]">{formatValue(r.value)}</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-cream">
            <div
              className="h-full rounded-full bg-forest"
              style={{ width: `${(r.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function DateBarList({
  revenueOverTime,
}: {
  revenueOverTime: { granularity: "day" | "week"; buckets: { label: string; kobo: number }[] };
}) {
  const rows = revenueOverTime.buckets.map((b) => ({
    label: formatBucketLabel(b.label, revenueOverTime.granularity),
    value: b.kobo,
  }));
  return <BarList rows={rows} formatValue={(v) => formatNaira(v)} />;
}

function formatBucketLabel(isoDate: string, granularity: "day" | "week"): string {
  const formatted = new Date(`${isoDate}T00:00:00Z`).toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
  return granularity === "week" ? `Week of ${formatted}` : formatted;
}
