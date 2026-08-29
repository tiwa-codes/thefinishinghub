"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "pending" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("pending");
    setErrorMessage(null);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/account/reset-password`,
    });

    if (error) {
      setStatus("error");
      // Real reason (e.g. Supabase's built-in rate limit), not a blanket
      // "something went wrong" — verified live that this project's shared
      // 2-emails/hour quota surfaces here as a plain 429, and a customer
      // hitting it deserves to know to wait rather than assume it's broken.
      // No account-enumeration risk: unlike the "sent" state below, this
      // says nothing about whether the address has an account.
      setErrorMessage(error.message);
      return;
    }
    setStatus("sent");
  }

  if (status === "sent") {
    // Same message regardless of whether the address has an account —
    // confirming/denying that to an anonymous requester is its own small
    // information leak.
    return (
      <p className="text-[15px] leading-[1.6] text-ink">
        If an account exists for {email}, a password reset link is on its way.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
      <div>
        <label
          htmlFor="forgot-email"
          className="mb-1.5 block text-xs uppercase tracking-[0.08em] text-[#6b6155]"
        >
          Email
        </label>
        <input
          id="forgot-email"
          type="email"
          required
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-[2px] border border-[#cfc6b6] bg-white px-4 py-3 font-sans text-sm text-ink outline-none focus:border-forest"
        />
      </div>
      {status === "error" && (
        <p className="text-[13px] text-[#b3261e]">
          {errorMessage ?? "Something went wrong — please try again."}
        </p>
      )}
      <button
        type="submit"
        disabled={status === "pending"}
        className="mt-1.5 rounded-[2px] bg-forest px-4 py-3.5 font-sans text-sm font-semibold tracking-wide text-cream hover:bg-deep-forest disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "pending" ? "Sending…" : "Send reset link"}
      </button>
    </form>
  );
}
