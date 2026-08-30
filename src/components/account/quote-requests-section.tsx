"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatNaira } from "@/lib/format";

export type QuoteRequestRow = {
  id: string;
  status: string;
  message: string | null;
  quoted_price_kobo: number | null;
  quoted_notes: string | null;
  created_at: string;
  product_name: string;
  variant_label: string | null;
  order_number: string | null;
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Awaiting a price",
  quoted: "Quoted",
  accepted: "Accepted",
  declined: "Declined",
};

function AcceptForm({ requestId, onCancel }: { requestId: string; onCancel: () => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState<"idle" | "pending" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("pending");
    setErrorMessage(null);
    const supabase = createClient();

    // Reuses create_order's own conventions (order number format, order/
    // order_item shape) — see accept_quote in
    // supabase/migrations/20260831090000_quote_requests.sql. Nothing
    // reliable to inherit from account signup for name/phone/address
    // (that only ever captured email/password), so this form collects
    // them fresh, same fields checkout already asks for.
    const { data: order, error } = await supabase.rpc("accept_quote", {
      p_quote_request_id: requestId,
      p_customer_name: name.trim(),
      p_customer_phone: phone.trim(),
      p_shipping_address: { address: address.trim() },
    });

    if (error || !order) {
      setStatus("error");
      setErrorMessage(error?.message ?? "Something went wrong — please try again.");
      return;
    }

    // Same real Paystack initialize flow normal checkout uses — no new
    // payment code.
    const res = await fetch("/api/checkout/initialize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderNumber: (order as { order_number: string }).order_number }),
    });
    const initData = await res.json();
    if (!res.ok || !initData.authorizationUrl) {
      setStatus("error");
      setErrorMessage(
        typeof initData.error === "string"
          ? initData.error
          : "Order created, but payment couldn't start — find it in your account and try Pay Now.",
      );
      return;
    }

    window.location.href = initData.authorizationUrl;
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-3 border-t border-[#eee7d8] pt-3">
      <div>
        <label htmlFor={`accept-name-${requestId}`} className="mb-1 block text-xs uppercase tracking-[0.06em] text-[#8a8073]">
          Full name
        </label>
        <input
          id={`accept-name-${requestId}`}
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-[2px] border border-[#cfc6b6] px-3 py-2.5 text-sm outline-none focus:border-forest"
        />
      </div>
      <div>
        <label htmlFor={`accept-phone-${requestId}`} className="mb-1 block text-xs uppercase tracking-[0.06em] text-[#8a8073]">
          Phone
        </label>
        <input
          id={`accept-phone-${requestId}`}
          required
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full rounded-[2px] border border-[#cfc6b6] px-3 py-2.5 text-sm outline-none focus:border-forest"
        />
      </div>
      <div>
        <label htmlFor={`accept-address-${requestId}`} className="mb-1 block text-xs uppercase tracking-[0.06em] text-[#8a8073]">
          Delivery address
        </label>
        <textarea
          id={`accept-address-${requestId}`}
          required
          rows={2}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="w-full resize-none rounded-[2px] border border-[#cfc6b6] px-3 py-2.5 text-sm outline-none focus:border-forest"
        />
      </div>
      {status === "error" && <p className="text-[13px] text-[#b3261e]">{errorMessage}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={status === "pending"}
          className="rounded-[2px] bg-gold px-5 py-2.5 text-[13px] font-semibold tracking-wide text-forest hover:bg-gold-bright disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "pending" ? "Creating order…" : "Accept & Pay"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={status === "pending"}
          className="rounded-[2px] border border-[#cfc6b6] px-5 py-2.5 text-[13px] text-[#6b6155] hover:border-forest"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export function QuoteRequestsSection({ initialRequests }: { initialRequests: QuoteRequestRow[] }) {
  const [requests, setRequests] = useState(initialRequests);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [decliningId, setDecliningId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleDecline(requestId: string) {
    setDecliningId(requestId);
    setErrorMessage(null);
    const supabase = createClient();
    const { error } = await supabase.rpc("decline_quote", { p_quote_request_id: requestId });
    if (error) {
      setErrorMessage(
        error.message.includes("QUOTE_NOT_QUOTED")
          ? "This request isn't awaiting your response anymore — refresh to see its current status."
          : error.message,
      );
      setDecliningId(null);
      return;
    }
    setRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: "declined" } : r)),
    );
    setDecliningId(null);
  }

  if (requests.length === 0) {
    return (
      <p className="text-sm text-[#6b6155]">
        No quote requests yet — request one from any quote-priced product page.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {errorMessage && <p className="text-sm text-[#b3261e]">{errorMessage}</p>}
      {requests.map((r) => (
        <div key={r.id} className="rounded-[2px] border border-[#ddd5c4] bg-white px-6 py-5">
          <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="text-sm text-ink">
                {r.product_name}
                {r.variant_label && <span className="text-[#8a8073]"> — {r.variant_label}</span>}
              </div>
              <div className="mt-0.5 text-xs text-[#8a8073]">
                Requested{" "}
                {new Date(r.created_at).toLocaleDateString("en-NG", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </div>
            </div>
            <span className="whitespace-nowrap rounded-[2px] bg-cream px-2.5 py-1 text-xs uppercase tracking-[0.06em] text-[#6b6155]">
              {STATUS_LABELS[r.status] ?? r.status}
            </span>
          </div>

          {r.message && (
            <p className="mb-2 text-[13.5px] text-[#4a4339]">&ldquo;{r.message}&rdquo;</p>
          )}

          {r.status === "quoted" && r.quoted_price_kobo != null && (
            <>
              <div className="mb-3 font-serif text-lg text-forest">
                {formatNaira(r.quoted_price_kobo)}
                {r.quoted_notes && (
                  <span className="ml-2 font-sans text-[13px] text-[#6b6155]">
                    — {r.quoted_notes}
                  </span>
                )}
              </div>
              {acceptingId === r.id ? (
                <AcceptForm requestId={r.id} onCancel={() => setAcceptingId(null)} />
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAcceptingId(r.id)}
                    className="rounded-[2px] bg-forest px-5 py-2.5 text-[13px] font-semibold tracking-wide text-cream hover:bg-deep-forest"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    disabled={decliningId === r.id}
                    onClick={() => handleDecline(r.id)}
                    className="rounded-[2px] border border-[#cfc6b6] px-5 py-2.5 text-[13px] text-[#6b6155] hover:border-forest disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {decliningId === r.id ? "Declining…" : "Decline"}
                  </button>
                </div>
              )}
            </>
          )}

          {r.status === "accepted" && r.order_number && (
            <p className="text-[13px] text-[#6b6155]">
              Order <span className="font-mono text-ink">{r.order_number}</span> — see it in
              your order history below.
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
