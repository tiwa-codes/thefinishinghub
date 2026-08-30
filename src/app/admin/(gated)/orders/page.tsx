"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatNaira } from "@/lib/format";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";

type OrderListRow = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  status: string;
  total_kobo: number;
  created_at: string;
};

const STATUS_FILTERS = ["all", "pending_payment", "paid", "fulfilled", "cancelled"];

const STATUS_BADGE_CLASS: Record<string, string> = {
  pending_payment: "bg-[#f0ece1] text-[#8a8073]",
  paid: "bg-[#e4ede7] text-forest",
  fulfilled: "bg-[#e4ede7] text-forest",
  cancelled: "bg-[#f5e6e4] text-[#b3261e]",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    // Admin convenience only (e.g. a "Pending" tile elsewhere linking here
    // with ?status=pending_payment) — read on mount rather than via
    // useSearchParams so this page doesn't need a Suspense boundary.
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status");
    if (status) setStatusFilter(status);
  }, []);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("orders")
        .select("id, order_number, customer_name, customer_email, status, total_kobo, created_at")
        .order("created_at", { ascending: false })
        .returns<OrderListRow[]>();
      setOrders(data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = orders.filter((o) => {
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !o.customer_name.toLowerCase().includes(q) &&
        !o.customer_email.toLowerCase().includes(q) &&
        !o.order_number.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    return true;
  });

  if (loading) {
    return <p className="text-sm text-[#8a8073]">Loading orders…</p>;
  }

  return (
    <div>
      <div className="mb-6 font-serif text-2xl text-ink">Orders</div>

      <div className="mb-5 flex flex-wrap gap-3">
        <label htmlFor="order-search" className="sr-only">
          Search by customer or order number
        </label>
        <input
          id="order-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by customer or order number…"
          className="w-72 rounded-[2px] border border-[#cfc6b6] px-3 py-2 text-sm text-ink outline-none focus:border-forest"
        />
        <label htmlFor="order-status-filter" className="sr-only">
          Filter by status
        </label>
        <select
          id="order-status-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-[2px] border border-[#cfc6b6] px-3 py-2 text-sm text-ink outline-none focus:border-forest"
        >
          {STATUS_FILTERS.map((s) => (
            <option key={s} value={s}>
              {s === "all" ? "All statuses" : ORDER_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-[2px] border border-[#ddd5c4] bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[#ddd5c4] text-xs uppercase tracking-[0.06em] text-[#8a8073]">
              <th className="px-4 py-3 font-medium">Order</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eee7d8]">
            {filtered.map((o) => (
              <tr key={o.id} className="hover:bg-cream">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/orders/${o.id}`}
                    className="font-mono text-ink hover:text-forest hover:underline"
                  >
                    {o.order_number}
                  </Link>
                </td>
                <td className="px-4 py-3 text-[#6b6155]">
                  <div className="text-ink">{o.customer_name}</div>
                  <div className="text-xs text-[#8a8073]">{o.customer_email}</div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-[2px] px-2 py-0.5 text-xs ${
                      STATUS_BADGE_CLASS[o.status] ?? "bg-[#f0ece1] text-[#8a8073]"
                    }`}
                  >
                    {ORDER_STATUS_LABELS[o.status] ?? o.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-[#6b6155]">{formatNaira(o.total_kobo)}</td>
                <td className="px-4 py-3 text-[#6b6155]">
                  {new Date(o.created_at).toLocaleDateString("en-NG", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[#8a8073]">
                  No orders match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
