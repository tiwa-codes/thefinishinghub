"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatNaira, nairaInputToKobo } from "@/lib/format";

type QuoteRequestRow = {
  id: string;
  user_id: string;
  message: string | null;
  status: string;
  quoted_price_kobo: number | null;
  quoted_notes: string | null;
  created_at: string;
  products: { name: string } | null;
  product_variants: { finish: string | null; color: string | null; size: string | null } | null;
};

const STATUS_FILTERS = ["pending", "quoted", "accepted", "declined", "all"];

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  quoted: "Quoted",
  accepted: "Accepted",
  declined: "Declined",
};

function variantLabel(v: QuoteRequestRow["product_variants"]): string {
  if (!v) return "";
  return [v.finish, v.color, v.size].filter(Boolean).join(" · ");
}

function RespondForm({
  request,
  onDone,
}: {
  request: QuoteRequestRow;
  onDone: () => void;
}) {
  const [price, setPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"idle" | "pending" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const priceKobo = nairaInputToKobo(price);
    if (priceKobo === null) {
      setStatus("error");
      setErrorMessage("Enter a valid price.");
      return;
    }
    setStatus("pending");
    setErrorMessage(null);
    const supabase = createClient();
    const { error } = await supabase.rpc("respond_to_quote", {
      p_quote_request_id: request.id,
      p_price_kobo: priceKobo,
      p_notes: notes.trim(),
    });
    if (error) {
      setStatus("error");
      // respond_to_quote's own guard: already responded (by someone
      // else, possibly moments ago) or no longer pending — surfaced
      // honestly rather than a generic failure.
      setErrorMessage(
        error.message.includes("QUOTE_NOT_PENDING")
          ? "This request was already responded to — refresh to see its current status."
          : error.message,
      );
      return;
    }
    onDone();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 flex flex-wrap items-end gap-3 border-t border-[#eee7d8] pt-3">
      <div>
        <label htmlFor={`price-${request.id}`} className="mb-1 block text-xs uppercase tracking-[0.06em] text-[#8a8073]">
          Price (₦)
        </label>
        <input
          id={`price-${request.id}`}
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="0.00"
          className="w-32 rounded-[2px] border border-[#cfc6b6] px-2.5 py-2 text-sm outline-none focus:border-forest"
        />
      </div>
      <div className="flex-1">
        <label htmlFor={`notes-${request.id}`} className="mb-1 block text-xs uppercase tracking-[0.06em] text-[#8a8073]">
          Notes (optional)
        </label>
        <input
          id={`notes-${request.id}`}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Lead time, delivery notes…"
          className="w-full rounded-[2px] border border-[#cfc6b6] px-2.5 py-2 text-sm outline-none focus:border-forest"
        />
      </div>
      <button
        type="submit"
        disabled={status === "pending"}
        className="rounded-[2px] bg-forest px-4 py-2 text-sm font-medium text-cream hover:bg-deep-forest disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "pending" ? "Sending…" : "Send Quote"}
      </button>
      {status === "error" && (
        <p className="w-full text-[13px] text-[#b3261e]">{errorMessage}</p>
      )}
    </form>
  );
}

export default function AdminQuotesPage() {
  const [requests, setRequests] = useState<QuoteRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [respondingId, setRespondingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("quote_requests")
      .select(
        `id, user_id, message, status, quoted_price_kobo, quoted_notes, created_at,
         products ( name ), product_variants ( finish, color, size )`,
      )
      .order("created_at", { ascending: false })
      .returns<QuoteRequestRow[]>();
    setRequests(data ?? []);
    setLoading(false);
  }, []);

  // Re-fetch whenever the status tab changes, not just once on mount — a
  // new quote request (or a response from another staff session) landed
  // while this page was already open would otherwise stay invisible
  // until a manual reload, since switching tabs only re-filtered whatever
  // was already in memory.
  useEffect(() => {
    load();
  }, [statusFilter, load]);

  const filtered = requests.filter((r) => statusFilter === "all" || r.status === statusFilter);

  if (loading) {
    return <p className="text-sm text-[#8a8073]">Loading quote requests…</p>;
  }

  return (
    <div className="max-w-[880px]">
      <div className="mb-6 font-serif text-2xl text-ink">Quote Requests</div>

      <div className="mb-5 flex gap-3">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={`rounded-[2px] px-3.5 py-2 text-sm ${
              statusFilter === s
                ? "bg-forest text-cream"
                : "border border-[#cfc6b6] text-[#6b6155] hover:border-forest"
            }`}
          >
            {s === "all" ? "All" : STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {filtered.map((r) => (
          <div key={r.id} className="rounded-[2px] border border-[#ddd5c4] bg-white px-5 py-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="text-sm text-ink">
                  {r.products?.name ?? "Unknown product"}
                  {variantLabel(r.product_variants) && (
                    <span className="text-[#8a8073]"> — {variantLabel(r.product_variants)}</span>
                  )}
                </div>
                <div className="mt-0.5 text-xs text-[#8a8073]">
                  Requested {new Date(r.created_at).toLocaleDateString("en-NG", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}{" "}
                  · Customer {r.user_id.slice(0, 8)}
                </div>
                {r.message && (
                  <p className="mt-2 max-w-[520px] text-[13.5px] text-[#4a4339]">
                    &ldquo;{r.message}&rdquo;
                  </p>
                )}
              </div>
              <span className="whitespace-nowrap rounded-[2px] bg-cream px-2.5 py-1 text-xs uppercase tracking-[0.06em] text-[#6b6155]">
                {STATUS_LABELS[r.status] ?? r.status}
              </span>
            </div>

            {r.status === "pending" && respondingId !== r.id && (
              <button
                type="button"
                onClick={() => setRespondingId(r.id)}
                className="mt-3 rounded-[2px] border border-forest px-4 py-2 text-sm font-medium text-forest hover:bg-forest hover:text-cream"
              >
                Respond
              </button>
            )}
            {r.status === "pending" && respondingId === r.id && (
              <RespondForm
                request={r}
                onDone={() => {
                  setRespondingId(null);
                  load();
                }}
              />
            )}
            {r.quoted_price_kobo != null && r.status !== "pending" && (
              <div className="mt-2 text-sm text-[#6b6155]">
                Quoted {formatNaira(r.quoted_price_kobo)}
                {r.quoted_notes && <span> — {r.quoted_notes}</span>}
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="px-1 py-8 text-center text-sm text-[#8a8073]">No requests match.</p>
        )}
      </div>
    </div>
  );
}
