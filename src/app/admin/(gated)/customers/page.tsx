"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatNaira } from "@/lib/format";

type CustomerSummaryRow = {
  user_id: string;
  customer_name: string | null;
  customer_email: string | null;
  order_count: number;
  lifetime_value_kobo: number;
  last_order_at: string | null;
};

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerSummaryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      // Derived, read-only — customer_summary is a security_invoker view
      // over orders; there is no write path here at all, by design.
      const { data } = await supabase
        .from("customer_summary")
        .select("user_id, customer_name, customer_email, order_count, lifetime_value_kobo, last_order_at")
        .order("lifetime_value_kobo", { ascending: false })
        .returns<CustomerSummaryRow[]>();
      setCustomers(data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = customers.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (c.customer_name ?? "").toLowerCase().includes(q) ||
      (c.customer_email ?? "").toLowerCase().includes(q)
    );
  });

  if (loading) {
    return <p className="text-sm text-[#8a8073]">Loading customers…</p>;
  }

  return (
    <div>
      <div className="mb-6 font-serif text-2xl text-ink">Customers</div>

      <div className="mb-5">
        <label htmlFor="customer-search" className="sr-only">
          Search by name or email
        </label>
        <input
          id="customer-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="w-72 rounded-[2px] border border-[#cfc6b6] px-3 py-2 text-sm text-ink outline-none focus:border-forest"
        />
      </div>

      <div className="overflow-hidden rounded-[2px] border border-[#ddd5c4] bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[#ddd5c4] text-xs uppercase tracking-[0.06em] text-[#8a8073]">
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Orders</th>
              <th className="px-4 py-3 font-medium">Lifetime value</th>
              <th className="px-4 py-3 font-medium">Last order</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eee7d8]">
            {filtered.map((c) => (
              <tr key={c.user_id} className="hover:bg-cream">
                <td className="px-4 py-3">
                  <div className="text-ink">{c.customer_name ?? "—"}</div>
                  <div className="text-xs text-[#8a8073]">{c.customer_email ?? "—"}</div>
                </td>
                <td className="px-4 py-3 text-[#6b6155]">{c.order_count}</td>
                <td className="px-4 py-3 text-[#6b6155]">{formatNaira(c.lifetime_value_kobo)}</td>
                <td className="px-4 py-3 text-[#6b6155]">
                  {c.last_order_at
                    ? new Date(c.last_order_at).toLocaleDateString("en-NG", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : "—"}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-[#8a8073]">
                  No customers match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
