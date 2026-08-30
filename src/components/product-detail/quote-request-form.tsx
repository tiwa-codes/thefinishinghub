"use client";

import { useState, type FormEvent } from "react";
import { useCart } from "@/lib/cart-context";
import { createClient } from "@/lib/supabase/client";

// Every visitor already has a real session (anonymous sign-in is app-
// wide via CartProvider), and quote_requests.user_id accepts either —
// unlike checkout, a request is just an inquiry, not a commitment, so
// there's no reason to force signup first. It carries over to a real
// account the same way an anonymous cart does, if they sign up later.
// The real auth gate is at accept_quote — that's where money moves.
export function QuoteRequestForm({
  productId,
  variantId,
}: {
  productId: string;
  variantId: string | null;
}) {
  const { userId, ready, isAnonymous } = useCart();
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "pending" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setStatus("pending");
    setErrorMessage(null);
    const supabase = createClient();
    const { error } = await supabase.from("quote_requests").insert({
      user_id: userId,
      product_id: productId,
      variant_id: variantId,
      message: message.trim() || null,
    });
    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }
    setStatus("sent");
  }

  if (status === "sent") {
    return (
      <p className="text-[14.5px] leading-[1.7] text-[#4a4339]">
        Request sent — we&apos;ll follow up with a price.{" "}
        {isAnonymous
          ? "Create an account so you can track it and accept when it's ready."
          : "You can track it from your account."}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label htmlFor="quote-message" className="sr-only">
        Anything we should know? (optional)
      </label>
      <textarea
        id="quote-message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Anything we should know — finish, size, timeline? (optional)"
        rows={2}
        className="w-full resize-none rounded-[2px] border border-[#cfc6b6] bg-white px-3.5 py-2.5 text-[13.5px] text-ink outline-none focus:border-forest"
      />
      {status === "error" && (
        <p className="text-[13px] text-[#b3261e]">
          {errorMessage ?? "Something went wrong — please try again."}
        </p>
      )}
      <button
        type="submit"
        disabled={!ready || status === "pending"}
        className="rounded-[2px] bg-forest px-5 py-3 text-sm font-semibold tracking-wide text-cream hover:bg-deep-forest disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "pending" ? "Sending…" : "Request a Quote"}
      </button>
    </form>
  );
}
