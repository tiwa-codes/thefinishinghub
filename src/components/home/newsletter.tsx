"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Status = "idle" | "pending" | "success" | "error";

// Postgres unique-violation code — a repeat signup for the same address
// isn't a real failure from the visitor's point of view, so it's treated
// the same as success rather than surfaced as an error.
const UNIQUE_VIOLATION = "23505";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setStatus("pending");
    const supabase = createClient();
    const { error } = await supabase.from("newsletter_subscribers").insert({ email });

    if (error && error.code !== UNIQUE_VIOLATION) {
      console.error("Newsletter signup failed:", error.message);
      setStatus("error");
      return;
    }

    setStatus("success");
    setEmail("");
  }

  return (
    <section className="bg-cream">
      <div className="mx-auto max-w-[780px] px-5 py-14 text-center lg:px-10 lg:py-[84px]">
        <h2 className="mb-3 font-serif text-xl font-normal text-ink lg:text-[28px]">
          New arrivals, projects and showroom news.
        </h2>
        <p className="mb-7 text-[15px] text-[#6b6155]">
          A quiet note now and then. No more than monthly.
        </p>

        {status === "success" ? (
          <p className="text-[15px] font-medium text-forest">You&apos;re on the list.</p>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mx-auto flex max-w-[480px] flex-col gap-2.5 sm:flex-row"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              disabled={status === "pending"}
              className="flex-1 rounded-[2px] border border-[#cfc6b6] bg-white px-4 py-3.5 font-sans text-sm text-ink outline-none disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={status === "pending"}
              className="rounded-[2px] bg-forest px-[26px] py-3.5 font-sans text-sm font-semibold tracking-wide text-cream hover:bg-deep-forest disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === "pending" ? "Subscribing…" : "Subscribe"}
            </button>
          </form>
        )}

        {status === "error" && (
          <p className="mt-3 text-[13px] text-[#b3261e]">
            Something went wrong — please try again.
          </p>
        )}
      </div>
    </section>
  );
}
