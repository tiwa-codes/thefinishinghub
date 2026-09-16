"use client";

import { useState, type FormEvent } from "react";

const SHOWROOM_PHONE_DISPLAY = "+234 (0) 803 311 7302";

export function TrackOrderForm() {
  const [orderRef, setOrderRef] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="rounded-[2px] border border-[#ddd5c4] bg-white p-6">
        <p className="text-[15px] leading-[1.7] text-ink">
          Order tracking isn&apos;t available online yet — contact us at{" "}
          <a href="tel:+2348033117302" className="text-forest underline">
            {SHOWROOM_PHONE_DISPLAY}
          </a>{" "}
          with your order reference and we&apos;ll look it up for you.
        </p>
      </div>
    );
  }

  return (
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
          className="w-full rounded-[2px] border border-[#cfc6b6] px-3 py-2.5 text-sm text-ink outline-none focus:border-forest"
        />
      </div>
      <div>
        <label htmlFor="order-email" className="mb-1 block text-[11px] uppercase tracking-[0.08em] text-[#6b6155]">
          Email
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
        className="mt-1 self-start rounded-[2px] bg-forest px-6 py-2.5 text-sm font-medium text-cream hover:bg-deep-forest"
      >
        Track
      </button>
    </form>
  );
}
