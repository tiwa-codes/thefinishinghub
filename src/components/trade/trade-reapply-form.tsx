"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

const TIER_OPTIONS = [
  { value: "standard", label: "Standard" },
  { value: "preferred", label: "Preferred" },
  { value: "contractor", label: "Contractor" },
  { value: "bulk", label: "Bulk / Developer" },
];

// Reapplying only resets the workflow fields (status/tier/discount_percent/
// approved_*) on the customer's existing row — business_name is untouched,
// so there's nothing to re-collect here beyond the tier.
export function TradeReapplyForm({ previousTierRequested }: { previousTierRequested: string | null }) {
  const [tierRequested, setTierRequested] = useState(previousTierRequested ?? "standard");
  const [status, setStatus] = useState<"idle" | "pending" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("pending");
    setErrorMessage(null);
    const supabase = createClient();
    const { error } = await supabase.rpc("reapply_for_trade_pricing", {
      p_tier_requested: tierRequested,
    });

    if (error) {
      setStatus("error");
      setErrorMessage(
        error.message.includes("no rejected application found")
          ? "Your application status has changed — refresh the page to see where things stand."
          : error.message,
      );
      return;
    }
    setStatus("sent");
  }

  if (status === "sent") {
    return (
      <p className="text-[15px] leading-[1.7] text-[#4a4339]">
        Application resubmitted — we&apos;ll review it and follow up.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <p className="text-[15px] leading-[1.7] text-[#6b6155]">
        Your previous application wasn&apos;t approved. You can submit a new one below.
      </p>
      <div>
        <label htmlFor="trade-reapply-tier" className="mb-1.5 block text-xs uppercase tracking-[0.08em] text-[#6b6155]">
          Requested tier
        </label>
        <select
          id="trade-reapply-tier"
          value={tierRequested}
          onChange={(e) => setTierRequested(e.target.value)}
          className="w-full rounded-[2px] border border-[#cfc6b6] bg-white px-4 py-3 font-sans text-sm text-ink outline-none focus:border-forest"
        >
          {TIER_OPTIONS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>
      {status === "error" && (
        <p className="text-[13px] text-[#b3261e]">
          {errorMessage ?? "Something went wrong — please try again."}
        </p>
      )}
      <button
        type="submit"
        disabled={status === "pending"}
        className="mt-1.5 rounded-[2px] bg-forest px-5 py-3.5 font-sans text-sm font-semibold tracking-wide text-cream hover:bg-deep-forest disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "pending" ? "Submitting…" : "Reapply"}
      </button>
    </form>
  );
}
