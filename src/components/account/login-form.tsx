"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

// Signing in to an existing account does NOT carry over the current
// anonymous session's cart — signInWithPassword() switches to that
// account's own auth.uid(), which has whatever cart it already has (or
// none). Only signup (SignupForm, via updateUser() on the anonymous
// session) preserves the cart that was just being built. That's expected
// Supabase Auth behavior, not a bug — a real returning customer's account
// cart is the correct one to show, not a stranger session's.
export function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "pending" | "error">("idle");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("pending");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setStatus("error");
      return;
    }

    setStatus("idle");
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
      <div>
        <label
          htmlFor="login-email"
          className="mb-1.5 block text-xs uppercase tracking-[0.08em] text-[#6b6155]"
        >
          Email
        </label>
        <input
          id="login-email"
          type="email"
          required
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-[2px] border border-[#cfc6b6] bg-white px-4 py-3 font-sans text-sm text-ink outline-none focus:border-forest"
        />
      </div>
      <div>
        <label
          htmlFor="login-password"
          className="mb-1.5 block text-xs uppercase tracking-[0.08em] text-[#6b6155]"
        >
          Password
        </label>
        <input
          id="login-password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-[2px] border border-[#cfc6b6] bg-white px-4 py-3 font-sans text-sm text-ink outline-none focus:border-forest"
        />
      </div>
      {status === "error" && (
        <p className="text-[13px] text-[#b3261e]">Incorrect email or password.</p>
      )}
      <button
        type="submit"
        disabled={status === "pending"}
        className="mt-1.5 rounded-[2px] bg-forest px-4 py-3.5 font-sans text-sm font-semibold tracking-wide text-cream hover:bg-deep-forest disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "pending" ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
