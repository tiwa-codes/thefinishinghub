"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

const TIER_OPTIONS = [
  { value: "standard", label: "Standard" },
  { value: "preferred", label: "Preferred" },
  { value: "contractor", label: "Contractor" },
  { value: "bulk", label: "Bulk / Developer" },
];

export function TradeApplyForm({ userId }: { userId: string }) {
  const [businessName, setBusinessName] = useState("");
  const [tierRequested, setTierRequested] = useState("standard");
  const [status, setStatus] = useState<"idle" | "pending" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("pending");
    setErrorMessage(null);
    const supabase = createClient();
    // Only the fields the "customers apply for trade pricing" policy
    // allows a customer to set — status/tier/discount_percent/approved_*
    // are staff-only, enforced at the RLS layer, not just by this form
    // omitting them.
    const { error } = await supabase
      .from("trade_accounts")
      .insert({ id: userId, business_name: businessName.trim(), tier_requested: tierRequested });

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }
    setStatus("sent");
  }

  if (status === "sent") {
    return (
      <p className="text-[15px] leading-[1.7] text-[#4a4339]">
        Application received — we&apos;ll review it and follow up.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label htmlFor="trade-business-name" className="mb-1.5 block text-xs uppercase tracking-[0.08em] text-[#6b6155]">
          Business name
        </label>
        <input
          id="trade-business-name"
          required
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          className="w-full rounded-[2px] border border-[#cfc6b6] bg-white px-4 py-3 font-sans text-sm text-ink outline-none focus:border-forest"
        />
      </div>
      <div>
        <label htmlFor="trade-tier" className="mb-1.5 block text-xs uppercase tracking-[0.08em] text-[#6b6155]">
          Requested tier
        </label>
        <select
          id="trade-tier"
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
        {status === "pending" ? "Submitting…" : "Submit application"}
      </button>
    </form>
  );
}
