"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// The reset-email link lands here; Supabase's client processes the
// token in the URL and fires a "PASSWORD_RECOVERY" auth event — that's
// the documented, flow-version-agnostic (works whether the SDK used
// PKCE or the older implicit flow under the hood) signal that this
// visitor arrived via a real reset link, not just someone who typed the
// URL. The form stays hidden until that event fires.
export function ResetPasswordForm() {
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "pending" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

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
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }
    setStatus("success");
  }

  if (status === "success") {
    return (
      <p className="text-[15px] leading-[1.6] text-ink">
        Your password has been updated.{" "}
        <Link href="/account/login" className="text-forest hover:underline">
          Sign in
        </Link>
        .
      </p>
    );
  }

  if (!ready) {
    return <p className="text-sm text-[#8a8073]">Verifying your reset link…</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
      <div>
        <label
          htmlFor="reset-password"
          className="mb-1.5 block text-xs uppercase tracking-[0.08em] text-[#6b6155]"
        >
          New password
        </label>
        <input
          id="reset-password"
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
        disabled={status === "pending"}
        className="mt-1.5 rounded-[2px] bg-forest px-4 py-3.5 font-sans text-sm font-semibold tracking-wide text-cream hover:bg-deep-forest disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "pending" ? "Updating…" : "Set new password"}
      </button>
    </form>
  );
}
