"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "pending" | "error">("idle");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("pending");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      // Deliberately generic — don't reveal whether the email exists or
      // the password was wrong.
      setStatus("error");
      return;
    }

    // Full navigation, not router.push: middleware and the /admin server
    // component both need the freshly-set session cookie on the very
    // next request, which a client-side transition can race.
    window.location.href = "/admin";
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-5">
      <div className="w-full max-w-[380px]">
        <div className="mb-8 text-center">
          <div className="mb-1 font-serif text-2xl text-ink">The Finishing Hub</div>
          <div className="text-xs uppercase tracking-[0.2em] text-[#8a8073]">Staff sign in</div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-xs uppercase tracking-[0.08em] text-[#6b6155]"
            >
              Email
            </label>
            <input
              id="email"
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
              htmlFor="password"
              className="mb-1.5 block text-xs uppercase tracking-[0.08em] text-[#6b6155]"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-[2px] border border-[#cfc6b6] bg-white px-4 py-3 font-sans text-sm text-ink outline-none focus:border-forest"
            />
          </div>

          {status === "error" && (
            <p className="text-[13px] text-[#b3261e]">
              Incorrect email or password.
            </p>
          )}

          <button
            type="submit"
            disabled={status === "pending"}
            className="mt-1.5 rounded-[2px] bg-forest px-4 py-3.5 font-sans text-sm font-semibold tracking-wide text-cream hover:bg-deep-forest disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === "pending" ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
