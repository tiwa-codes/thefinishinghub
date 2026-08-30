"use client";

import { useState } from "react";

export function PayNowButton({
  orderNumber,
  className,
  label = "Pay Now",
}: {
  orderNumber: string;
  className: string;
  label?: string;
}) {
  const [status, setStatus] = useState<"idle" | "pending" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleClick() {
    setStatus("pending");
    setErrorMessage(null);
    try {
      const res = await fetch("/api/checkout/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber }),
      });
      const data = await res.json();

      if (!res.ok || !data.authorizationUrl) {
        setStatus("error");
        setErrorMessage(typeof data.error === "string" ? data.error : "Something went wrong — please try again.");
        return;
      }

      // Full navigation to Paystack's hosted checkout — not a client route.
      window.location.href = data.authorizationUrl;
    } catch {
      setStatus("error");
      setErrorMessage("Something went wrong — please try again.");
    }
  }

  return (
    <div>
      <button type="button" onClick={handleClick} disabled={status === "pending"} className={className}>
        {status === "pending" ? "Redirecting…" : label}
      </button>
      {status === "error" && (
        <p className="mt-2 text-[13px] text-[#b3261e]">{errorMessage}</p>
      )}
    </div>
  );
}
