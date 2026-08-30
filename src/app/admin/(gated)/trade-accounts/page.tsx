"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type TradeAccountRow = {
  id: string;
  business_name: string;
  tier_requested: string | null;
  status: string;
  tier: string | null;
  discount_percent: number | null;
  applied_at: string;
};

const STATUS_FILTERS = ["pending", "approved", "rejected", "all"];
const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};
const TIER_OPTIONS = ["standard", "preferred", "contractor", "bulk"];

function DecideForm({ account, onDone }: { account: TradeAccountRow; onDone: () => void }) {
  const [tier, setTier] = useState(account.tier_requested ?? "standard");
  const [discount, setDiscount] = useState("");
  const [status, setStatus] = useState<"idle" | "approving" | "rejecting" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function approve() {
    const discountPercent = Number(discount);
    if (!Number.isFinite(discountPercent) || discountPercent < 0 || discountPercent > 100) {
      setStatus("error");
      setErrorMessage("Enter a discount between 0 and 100.");
      return;
    }
    setStatus("approving");
    setErrorMessage(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("trade_accounts")
      .update({
        status: "approved",
        tier,
        discount_percent: discountPercent,
        approved_by: user?.id ?? null,
        approved_at: new Date().toISOString(),
      })
      .eq("id", account.id);
    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }
    onDone();
  }

  async function reject() {
    setStatus("rejecting");
    setErrorMessage(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("trade_accounts")
      .update({ status: "rejected", approved_by: user?.id ?? null, approved_at: new Date().toISOString() })
      .eq("id", account.id);
    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }
    onDone();
  }

  return (
    <div className="mt-3 flex flex-wrap items-end gap-3 border-t border-[#eee7d8] pt-3">
      <div>
        <label htmlFor={`tier-${account.id}`} className="mb-1 block text-xs uppercase tracking-[0.06em] text-[#8a8073]">
          Tier
        </label>
        <select
          id={`tier-${account.id}`}
          value={tier}
          onChange={(e) => setTier(e.target.value)}
          className="rounded-[2px] border border-[#cfc6b6] px-2.5 py-2 text-sm outline-none focus:border-forest"
        >
          {TIER_OPTIONS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor={`discount-${account.id}`} className="mb-1 block text-xs uppercase tracking-[0.06em] text-[#8a8073]">
          Discount %
        </label>
        <input
          id={`discount-${account.id}`}
          value={discount}
          onChange={(e) => setDiscount(e.target.value)}
          placeholder="e.g. 15"
          className="w-24 rounded-[2px] border border-[#cfc6b6] px-2.5 py-2 text-sm outline-none focus:border-forest"
        />
      </div>
      <button
        type="button"
        disabled={status === "approving" || status === "rejecting"}
        onClick={approve}
        className="rounded-[2px] bg-forest px-4 py-2 text-sm font-medium text-cream hover:bg-deep-forest disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "approving" ? "Approving…" : "Approve"}
      </button>
      <button
        type="button"
        disabled={status === "approving" || status === "rejecting"}
        onClick={reject}
        className="rounded-[2px] border border-[#cfc6b6] px-4 py-2 text-sm text-[#6b6155] hover:border-forest disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "rejecting" ? "Rejecting…" : "Reject"}
      </button>
      {status === "error" && <p className="w-full text-[13px] text-[#b3261e]">{errorMessage}</p>}
    </div>
  );
}

export default function AdminTradeAccountsPage() {
  const [accounts, setAccounts] = useState<TradeAccountRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [decidingId, setDecidingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("trade_accounts")
      .select("id, business_name, tier_requested, status, tier, discount_percent, applied_at")
      .order("applied_at", { ascending: false })
      .returns<TradeAccountRow[]>();
    setAccounts(data ?? []);
    setLoading(false);
  }, []);

  // Re-fetch whenever the status tab changes, not just once on mount — a
  // fresh application (or a change made by another staff session) landed
  // while this page was already open would otherwise stay invisible
  // until a manual reload, since switching tabs only re-filtered whatever
  // was already in memory.
  useEffect(() => {
    load();
  }, [statusFilter, load]);

  const filtered = accounts.filter((a) => statusFilter === "all" || a.status === statusFilter);

  if (loading) {
    return <p className="text-sm text-[#8a8073]">Loading trade accounts…</p>;
  }

  return (
    <div className="max-w-[820px]">
      <div className="mb-6 font-serif text-2xl text-ink">Trade Accounts</div>

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
        {filtered.map((a) => (
          <div key={a.id} className="rounded-[2px] border border-[#ddd5c4] bg-white px-5 py-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="text-sm text-ink">{a.business_name}</div>
                <div className="mt-0.5 text-xs text-[#8a8073]">
                  Requested tier: {a.tier_requested ?? "—"} · Applied{" "}
                  {new Date(a.applied_at).toLocaleDateString("en-NG", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </div>
              </div>
              <span className="whitespace-nowrap rounded-[2px] bg-cream px-2.5 py-1 text-xs uppercase tracking-[0.06em] text-[#6b6155]">
                {STATUS_LABELS[a.status] ?? a.status}
              </span>
            </div>

            {a.status === "pending" && decidingId !== a.id && (
              <button
                type="button"
                onClick={() => setDecidingId(a.id)}
                className="mt-3 rounded-[2px] border border-forest px-4 py-2 text-sm font-medium text-forest hover:bg-forest hover:text-cream"
              >
                Decide
              </button>
            )}
            {a.status === "pending" && decidingId === a.id && (
              <DecideForm
                account={a}
                onDone={() => {
                  setDecidingId(null);
                  load();
                }}
              />
            )}
            {a.status === "approved" && (
              <div className="mt-2 text-sm text-[#6b6155]">
                Tier {a.tier} — {a.discount_percent}% off
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="px-1 py-8 text-center text-sm text-[#8a8073]">No applications match.</p>
        )}
      </div>
    </div>
  );
}
