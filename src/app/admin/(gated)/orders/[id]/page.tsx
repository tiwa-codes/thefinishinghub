"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatNaira } from "@/lib/format";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";

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

// Only the transitions the "staff update order status" RLS policy
// actually allows (with check: status in ('fulfilled', 'cancelled')) —
// never offer an action here that the database would reject anyway.
// Staff can't mark something paid through this UI or the policy behind
// it; that's confirmPayment()'s alone.
function availableActions(status: string): { label: string; next: "fulfilled" | "cancelled" }[] {
  if (status === "paid") {
    return [
      { label: "Mark Fulfilled", next: "fulfilled" },
      { label: "Mark Cancelled", next: "cancelled" },
    ];
  }
  if (status === "pending_payment") {
    return [{ label: "Mark Cancelled", next: "cancelled" }];
  }
  return [];
}

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

  async function updateStatus(next: "fulfilled" | "cancelled") {
    setUpdating(next);
    setErrorMessage(null);
    const supabase = createClient();
    const { error } = await supabase.from("orders").update({ status: next }).eq("id", orderId);
    if (error) {
      setErrorMessage(error.message);
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

  const actions = availableActions(order.status);

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
          <div className="text-sm text-ink">{ORDER_STATUS_LABELS[order.status] ?? order.status}</div>
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

      {actions.length > 0 && (
        <div className="flex items-center gap-3">
          {actions.map((action) => (
            <button
              key={action.next}
              type="button"
              disabled={updating !== null}
              onClick={() => updateStatus(action.next)}
              className="rounded-[2px] bg-forest px-4 py-2.5 text-sm font-medium text-cream hover:bg-deep-forest disabled:cursor-not-allowed disabled:opacity-60"
            >
              {updating === action.next ? "Saving…" : action.label}
            </button>
          ))}
        </div>
      )}
      {errorMessage && <p className="mt-3 text-sm text-[#b3261e]">{errorMessage}</p>}
    </div>
  );
}
