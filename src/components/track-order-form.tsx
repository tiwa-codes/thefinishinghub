"use client";

import { useState, type FormEvent } from "react";
import { formatNaira } from "@/lib/format";
import { ORDER_STATUS_LABELS, ORDER_STATUS_BADGE_CLASS } from "@/lib/order-status";

const SHOWROOM_PHONE_DISPLAY = "+234 (0) 803 311 7302";
const SHOWROOM_PHONE_TEL = "tel:+2348033117302";
const SHOWROOM_WHATSAPP = "https://wa.me/2348033117302";

type OrderItem = {
  product_name_snapshot: string;
  variant_label_snapshot: string | null;
  unit_price_kobo: number;
  quantity: number;
};

type LookedUpOrder = {
  order_number: string;
  customer_name: string;
  customer_email: string;
  status: string;
  total_kobo: number;
  shipping_address: { address?: string } | null;
  created_at: string;
  payment_reference: string | null;
  order_items: OrderItem[];
};

type LookupState =
  | { status: "idle" }
  | { status: "pending" }
  | { status: "found"; order: LookedUpOrder }
  | { status: "not_found" }
  | { status: "error"; message: string };

export function TrackOrderForm() {
  const [orderRef, setOrderRef] = useState("");
  const [email, setEmail] = useState("");
  const [lookup, setLookup] = useState<LookupState>({ status: "idle" });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLookup({ status: "pending" });

    const res = await fetch("/api/orders/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reference: orderRef.trim(), email: email.trim() }),
    });
    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      setLookup({ status: "error", message: body.error ?? "Something went wrong — please try again." });
      return;
    }
    if (!body.found) {
      setLookup({ status: "not_found" });
      return;
    }
    setLookup({ status: "found", order: body.order });
  }

  return (
    <div className="flex flex-col gap-8">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="order-ref" className="mb-1 block text-[11px] uppercase tracking-[0.08em] text-[#6b6155]">
            Order reference
          </label>
          <input
            id="order-ref"
            value={orderRef}
            onChange={(e) => setOrderRef(e.target.value)}
            required
            placeholder="TFH-XXXXXXXXXX"
            className="w-full rounded-[2px] border border-[#cfc6b6] px-3 py-2.5 text-sm text-ink outline-none focus:border-forest"
          />
        </div>
        <div>
          <label htmlFor="order-email" className="mb-1 block text-[11px] uppercase tracking-[0.08em] text-[#6b6155]">
            Email address
          </label>
          <input
            id="order-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-[2px] border border-[#cfc6b6] px-3 py-2.5 text-sm text-ink outline-none focus:border-forest"
          />
        </div>
        <button
          type="submit"
          disabled={lookup.status === "pending"}
          className="mt-1 rounded-[2px] bg-gold px-6 py-3 text-sm font-semibold tracking-wide text-forest hover:bg-gold-bright disabled:cursor-not-allowed disabled:opacity-60"
        >
          {lookup.status === "pending" ? "Looking up…" : "Look up order"}
        </button>
        {lookup.status === "error" && (
          <p className="text-[13px] text-[#b3261e]">{lookup.message}</p>
        )}
      </form>

      {lookup.status === "not_found" && (
        <div className="rounded-[2px] border border-[#ddd5c4] bg-white p-6">
          <p className="mb-2 text-[15px] text-ink">
            We couldn&apos;t find an order matching those details.
          </p>
          <p className="mb-4 text-sm text-[#6b6155]">
            Check the reference in your confirmation email, or contact us for help.
          </p>
          <div className="flex flex-wrap gap-3 text-sm">
            <a
              href={`${SHOWROOM_WHATSAPP}?text=${encodeURIComponent(
                "Hi, I'm having trouble finding my order.",
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-forest underline"
            >
              WhatsApp us
            </a>
            <a href={SHOWROOM_PHONE_TEL} className="font-semibold text-forest underline">
              Call {SHOWROOM_PHONE_DISPLAY}
            </a>
          </div>
        </div>
      )}

      {lookup.status === "found" && <OrderResult order={lookup.order} />}
    </div>
  );
}

function OrderResult({ order }: { order: LookedUpOrder }) {
  return (
    <div className="rounded-[2px] border border-[#ddd5c4] bg-white p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[#eee7d8] pb-4">
        <div>
          <div className="font-mono text-sm text-gold">
            {order.payment_reference ?? order.order_number}
          </div>
          <div className="mt-1 text-xs text-[#8a8073]">
            {new Date(order.created_at).toLocaleDateString("en-NG", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>
        <span
          className={`rounded-[2px] px-2.5 py-1 text-xs ${
            ORDER_STATUS_BADGE_CLASS[order.status] ?? "bg-[#f0ece1] text-[#8a8073]"
          }`}
        >
          {ORDER_STATUS_LABELS[order.status] ?? order.status}
        </span>
      </div>

      <table className="mb-4 w-full text-left text-sm">
        <thead>
          <tr className="text-xs uppercase tracking-[0.06em] text-[#8a8073]">
            <th className="pb-2 font-medium">Product</th>
            <th className="pb-2 font-medium">Qty</th>
            <th className="pb-2 text-right font-medium">Price</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#eee7d8]">
          {order.order_items.map((item, i) => (
            <tr key={i}>
              <td className="py-2 text-ink">
                {item.product_name_snapshot}
                {item.variant_label_snapshot && (
                  <div className="text-xs text-[#8a8073]">{item.variant_label_snapshot}</div>
                )}
              </td>
              <td className="py-2 text-[#6b6155]">{item.quantity}</td>
              <td className="py-2 text-right text-[#6b6155]">
                {formatNaira(item.unit_price_kobo * item.quantity)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mb-5 flex justify-end border-t border-[#eee7d8] pt-3 text-sm">
        <span className="mr-3 text-[#8a8073]">Total</span>
        <span className="font-medium text-forest">{formatNaira(order.total_kobo)}</span>
      </div>

      <div className="mb-5">
        <div className="mb-1 text-xs uppercase tracking-[0.06em] text-[#8a8073]">
          Delivery address
        </div>
        <div className="text-sm text-[#6b6155]">{order.shipping_address?.address || "—"}</div>
      </div>

      <div className="flex flex-wrap gap-4 border-t border-[#eee7d8] pt-4 text-sm">
        <a href={SHOWROOM_PHONE_TEL} className="font-medium text-forest underline">
          Questions? Call us
        </a>
        <a
          href={`${SHOWROOM_WHATSAPP}?text=${encodeURIComponent(
            `Hi, I'm asking about order ${order.payment_reference ?? order.order_number}.`,
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-forest underline"
        >
          WhatsApp us
        </a>
      </div>
    </div>
  );
}
