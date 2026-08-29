"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCart } from "@/lib/cart-context";

// Every visitor already has a real anonymous Supabase session by the time
// they can reach this form (CartProvider bootstraps one on mount, app-
// wide) — so "sign up" here always means *linking* that existing session
// to real credentials via updateUser(), never supabase.auth.signUp().
// signUp() would create a brand-new, separate user — same effect as
// discarding the cart, since cart_items are keyed to the OLD anonymous
// user_id and RLS would no longer let this session see them. updateUser()
// keeps the same auth.uid() throughout, which is the entire mechanism
// that makes "existing cart carries over on signup" true.
//
// This project requires email confirmation (verified live against the
// production Supabase instance) — updateUser()/signUp() resolving without
// an error means the confirmation email was *sent*, not that the account
// is usable yet. auth.uid() and the cart tied to it don't change either
// way, but the session's `is_anonymous` claim only flips once the emailed
// link is clicked, which is also what create_order's RPC gate checks. So
// this form shows its own "check your email" terminal state instead of
// assuming an instant conversion and calling an onSuccess callback that
// would otherwise fire before the account can actually check out.
export function SignupForm() {
  const { ready, isAnonymous } = useCart();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "pending" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setStatus("error");
      setErrorMessage("Password must be at least 8 characters.");
      return;
    }

    setStatus("pending");
    setErrorMessage(null);
    const supabase = createClient();
    // Without this, Supabase falls back to the project's default Site URL
    // (verified live: an unset redirect landed on the bare homepage with a
    // dangling ?code= and no feedback) — send the confirmed session back to
    // checkout instead, where the cart is waiting.
    const emailRedirectTo = `${window.location.origin}/checkout`;

    const { error } = isAnonymous
      ? await supabase.auth.updateUser({ email, password }, { emailRedirectTo })
      : await supabase.auth.signUp({ email, password, options: { emailRedirectTo } });

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }

    setStatus("sent");
  }

  if (status === "sent") {
    return (
      <p className="text-[15px] leading-[1.6] text-ink">
        We&apos;ve sent a confirmation link to <strong>{email}</strong>. Click it to
        activate your account, then come back — your cart will be waiting.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
      <div>
        <label
          htmlFor="signup-email"
          className="mb-1.5 block text-xs uppercase tracking-[0.08em] text-[#6b6155]"
        >
          Email
        </label>
        <input
          id="signup-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-[2px] border border-[#cfc6b6] bg-white px-4 py-3 font-sans text-sm text-ink outline-none focus:border-forest"
        />
      </div>
      <div>
        <label
          htmlFor="signup-password"
          className="mb-1.5 block text-xs uppercase tracking-[0.08em] text-[#6b6155]"
        >
          Password
        </label>
        <input
          id="signup-password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
        disabled={status === "pending" || !ready}
        className="mt-1.5 rounded-[2px] bg-forest px-4 py-3.5 font-sans text-sm font-semibold tracking-wide text-cream hover:bg-deep-forest disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "pending" ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
