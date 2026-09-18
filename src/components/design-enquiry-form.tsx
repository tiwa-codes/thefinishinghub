"use client";

import { useState, type FormEvent } from "react";

const PROJECT_TYPES = [
  "Residential — new build",
  "Residential — renovation",
  "Commercial — office",
  "Commercial — hospitality",
  "Other",
];

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

export function DesignEnquiryForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [projectType, setProjectType] = useState(PROJECT_TYPES[0]);
  const [description, setDescription] = useState("");
  const [budgetRange, setBudgetRange] = useState(BUDGET_RANGES[0]);
  const [status, setStatus] = useState<"idle" | "pending" | "success" | "error">("idle");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("pending");

    const res = await fetch("/api/design-enquiry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, email, phone, projectType, description, budgetRange }),
    });

    setStatus(res.ok ? "success" : "error");
  }

  if (status === "success") {
    return (
      <div className="rounded-[6px] bg-cream p-8 text-center">
        <p className="text-[15px] text-ink">
          Thank you — we&apos;ll be in touch within 24 hours.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-[6px] bg-cream p-8">
      <div>
        <label htmlFor="design-name" className={LABEL}>
          Full name
        </label>
        <input
          id="design-name"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className={INPUT}
        />
      </div>
      <div>
        <label htmlFor="design-email" className={LABEL}>
          Email
        </label>
        <input
          id="design-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={INPUT}
        />
      </div>
      <div>
        <label htmlFor="design-phone" className={LABEL}>
          Phone number
        </label>
        <input
          id="design-phone"
          type="tel"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={INPUT}
        />
      </div>
      <div>
        <label htmlFor="design-project-type" className={LABEL}>
          Project type
        </label>
        <select
          id="design-project-type"
          value={projectType}
          onChange={(e) => setProjectType(e.target.value)}
          className={INPUT}
        >
          {PROJECT_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="design-description" className={LABEL}>
          Brief description
        </label>
        <textarea
          id="design-description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Tell us about the space, what you're looking for, and any key requirements"
          className={`${INPUT} resize-none`}
        />
      </div>
      <div>
        <label htmlFor="design-budget" className={LABEL}>
          Budget range
        </label>
        <select
          id="design-budget"
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
        {status === "pending" ? "Sending…" : "Send enquiry"}
      </button>
    </form>
  );
}
