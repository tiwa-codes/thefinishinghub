"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart-context";

export function AddToCartButton({ variantId }: { variantId: string }) {
  const { add, ready } = useCart();
  const [pending, setPending] = useState(false);

  const disabled = !ready || pending;

  return (
    <button
      type="button"
      disabled={disabled}
      aria-disabled={disabled}
      onClick={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setPending(true);
        try {
          await add(variantId);
        } finally {
          setPending(false);
        }
      }}
      className="rounded-[2px] border border-forest px-3.5 py-2 font-sans text-xs font-medium tracking-wide text-forest hover:bg-forest hover:text-cream disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-forest"
    >
      Add
    </button>
  );
}
