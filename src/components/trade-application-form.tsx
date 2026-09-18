"use client";

import { useState, type FormEvent } from "react";

const BUSINESS_TYPES = [
  "Interior Designer",
  "Architect",
  "Property Developer",
  "General Contractor",
  "Fit-out Contractor",
  "Other",
];

const YEARS_IN_BUSINESS = ["Less than 1 year", "1–3 years", "3–10 years", "10+ years"];

const BUDGET_RANGES = [
  "Under ₦5 million",
  "₦5–20 million",
  "₦20–50 million",
  "₦50–100 million",
  "Over ₦100 million",
  "Prefer to discuss",
];

const SHOWROOM_PHONE_DISPLAY = "+234 (0) 803 311 7302";
const SHOWROOM_PHONE_TEL = "tel:+2348033117302";

const INPUT =
  "w-full rounded-[2px] border border-[#cfc6b6] bg-white px-4 py-3 font-sans text-sm text-ink outline-none focus:border-forest";
const LABEL = "mb-1.5 block text-xs uppercase tracking-[0.08em] text-[#6b6155]";

export function TradeApplicationForm() {
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [businessType, setBusinessType] = useState(BUSINESS_TYPES[0]);
  const [yearsInBusiness, setYearsInBusiness] = useState(YEARS_IN_BUSINESS[0]);
  const [budgetRange, setBudgetRange] = useState(BUDGET_RANGES[0]);
  const [referralSource, setReferralSource] = useState("");
  const [status, setStatus] = useState<"idle" | "pending" | "success" | "error">("idle");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("pending");

    const res = await fetch("/api/trade-application", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName,
        companyName,
        email,
        phone,
        businessType,
        yearsInBusiness,
        budgetRange,
        referralSource,
      }),
    });

    setStatus(res.ok ? "success" : "error");
  }

  if (status === "success") {
    return (
      <div className="rounded-[6px] bg-cream p-8 text-center">
        <p className="text-[15px] text-ink">
          Application received. We&apos;ll review it and be in touch within 2
          business days.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-[6px] bg-cream p-8">
      <div>
        <label htmlFor="trade-name" className={LABEL}>
          Full name
        </label>
        <input
          id="trade-name"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className={INPUT}
        />
      </div>
      <div>
        <label htmlFor="trade-company" className={LABEL}>
          Company name
        </label>
        <input
          id="trade-company"
          required
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          className={INPUT}
        />
      </div>
      <div>
        <label htmlFor="trade-email" className={LABEL}>
          Email
        </label>
        <input
          id="trade-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={INPUT}
        />
      </div>
      <div>
        <label htmlFor="trade-phone" className={LABEL}>
          Phone
        </label>
        <input
          id="trade-phone"
          type="tel"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={INPUT}
        />
      </div>
      <div>
        <label htmlFor="trade-business-type" className={LABEL}>
          Business type
        </label>
        <select
          id="trade-business-type"
          value={businessType}
          onChange={(e) => setBusinessType(e.target.value)}
          className={INPUT}
        >
          {BUSINESS_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="trade-years" className={LABEL}>
          Years in business
        </label>
        <select
          id="trade-years"
          value={yearsInBusiness}
          onChange={(e) => setYearsInBusiness(e.target.value)}
          className={INPUT}
        >
          {YEARS_IN_BUSINESS.map((range) => (
            <option key={range} value={range}>
              {range}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="trade-budget" className={LABEL}>
          Typical project budget range
        </label>
        <select
          id="trade-budget"
          value={budgetRange}
          onChange={(e) => setBudgetRange(e.target.value)}
          className={INPUT}
        >
          {BUDGET_RANGES.map((range) => (
            <option key={range} value={range}>
              {range}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="trade-referral" className={LABEL}>
          How did you hear about us?
        </label>
        <input
          id="trade-referral"
          value={referralSource}
          onChange={(e) => setReferralSource(e.target.value)}
          className={INPUT}
        />
      </div>

      {status === "error" && (
        <p className="text-[13px] text-[#b3261e]">
          Something went wrong. Please call or WhatsApp us —{" "}
          <a href={SHOWROOM_PHONE_TEL} className="underline">
            {SHOWROOM_PHONE_DISPLAY}
          </a>
          .
        </p>
      )}

      <button
        type="submit"
        disabled={status === "pending"}
        className="mt-1 rounded-[2px] bg-gold px-6 py-3.5 text-sm font-semibold tracking-wide text-forest hover:bg-gold-bright disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "pending" ? "Sending…" : "Apply now"}
      </button>
    </form>
  );
}
