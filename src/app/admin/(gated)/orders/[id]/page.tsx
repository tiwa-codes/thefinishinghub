"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatNaira } from "@/lib/format";
import { ORDER_STATUS_LABELS, ORDER_STATUS_BADGE_CLASS, nextStatusOptions } from "@/lib/order-status";

type OrderItem = {
  id: string;
  product_name_snapshot: string;
  variant_label_snapshot: string | null;
  unit_price_kobo: number;
  quantity: number;
};

type OrderDetail = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: { address?: string } | null;
  status: string;
  subtotal_kobo: number;
  total_kobo: number;
  payment_provider: string | null;
  payment_reference: string | null;
  created_at: string;
  order_items: OrderItem[];
};

export default function AdminOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const orderId = params.id;
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function load() {
    const supabase = createClient();
    const { data } = await supabase
      .from("orders")
      .select(
        `id, order_number, customer_name, customer_email, customer_phone, shipping_address,
         status, subtotal_kobo, total_kobo, payment_provider, payment_reference, created_at,
         order_items ( id, product_name_snapshot, variant_label_snapshot, unit_price_kobo, quantity )`,
      )
      .eq("id", orderId)
      .maybeSingle<OrderDetail>();

    if (!data) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setOrder(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  async function updateStatus(next: string) {
    setUpdating(next);
    setErrorMessage(null);
    const res = await fetch(`/api/admin/orders/${orderId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErrorMessage(body.error ?? "Could not update status.");
      setUpdating(null);
      return;
    }
    await load();
    setUpdating(null);
  }

  if (notFound) {
    return <p className="text-sm text-[#b3261e]">Order not found.</p>;
  }
  if (loading || !order) {
    return <p className="text-sm text-[#8a8073]">Loading…</p>;
  }

  const statusOptions = nextStatusOptions(order.status);

  return (
    <div className="max-w-[760px]">
      <Link href="/admin/orders" className="mb-4 inline-block text-sm text-[#6b6155] hover:text-forest">
        ← All orders
      </Link>
      <div className="mb-1 font-mono text-lg text-ink">{order.order_number}</div>
      <div className="mb-6 text-sm text-[#8a8073]">
        {new Date(order.created_at).toLocaleString("en-NG", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })}
      </div>

      <div className="mb-6 grid grid-cols-2 gap-6 rounded-[2px] border border-[#ddd5c4] bg-white p-5">
        <div>
          <div className="mb-1 text-xs uppercase tracking-[0.06em] text-[#8a8073]">Customer</div>
          <div className="text-sm text-ink">{order.customer_name}</div>
          <div className="text-sm text-[#6b6155]">{order.customer_email}</div>
          <div className="text-sm text-[#6b6155]">{order.customer_phone}</div>
        </div>
        <div>
          <div className="mb-1 text-xs uppercase tracking-[0.06em] text-[#8a8073]">
            Delivery address
          </div>
          <div className="text-sm text-[#6b6155]">
            {order.shipping_address?.address || "—"}
          </div>
        </div>
        <div>
          <div className="mb-1 text-xs uppercase tracking-[0.06em] text-[#8a8073]">
            Order status
          </div>
          <span
            className={`inline-block rounded-[2px] px-2 py-0.5 text-xs ${
              ORDER_STATUS_BADGE_CLASS[order.status] ?? "bg-[#f0ece1] text-[#8a8073]"
            }`}
          >
            {ORDER_STATUS_LABELS[order.status] ?? order.status}
          </span>
        </div>
        <div>
          <div className="mb-1 text-xs uppercase tracking-[0.06em] text-[#8a8073]">
            Payment
          </div>
          <div className="text-sm text-ink">
            {order.payment_provider
              ? `${order.payment_provider} — ${order.payment_reference}`
              : "Not yet paid"}
          </div>
        </div>
      </div>

      <div className="mb-6 overflow-hidden rounded-[2px] border border-[#ddd5c4] bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[#ddd5c4] text-xs uppercase tracking-[0.06em] text-[#8a8073]">
              <th className="px-4 py-3 font-medium">Item</th>
              <th className="px-4 py-3 font-medium">Qty</th>
              <th className="px-4 py-3 font-medium">Line total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eee7d8]">
            {order.order_items.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3">
                  <div className="text-ink">{item.product_name_snapshot}</div>
                  {item.variant_label_snapshot && (
                    <div className="text-xs text-[#8a8073]">{item.variant_label_snapshot}</div>
                  )}
                </td>
                <td className="px-4 py-3 text-[#6b6155]">{item.quantity}</td>
                <td className="px-4 py-3 text-[#6b6155]">
                  {formatNaira(item.unit_price_kobo * item.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-end border-t border-[#ddd5c4] px-4 py-3 text-sm">
          <span className="mr-3 text-[#8a8073]">Total</span>
          <span className="font-medium text-ink">{formatNaira(order.total_kobo)}</span>
        </div>
      </div>

      {statusOptions.length > 0 && (
        <div>
          <label htmlFor="order-status-select" className="mb-1.5 block text-xs uppercase tracking-[0.06em] text-[#8a8073]">
            Update status
          </label>
          <select
            id="order-status-select"
            value=""
            disabled={updating !== null}
            onChange={(e) => {
              if (e.target.value) updateStatus(e.target.value);
            }}
            className="rounded-[2px] border border-[#cfc6b6] px-3 py-2 text-sm text-ink outline-none focus:border-forest disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="">{updating ? "Saving…" : "Change to…"}</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {ORDER_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      )}
      {errorMessage && <p className="mt-3 text-sm text-[#b3261e]">{errorMessage}</p>}
    </div>
  );
}
