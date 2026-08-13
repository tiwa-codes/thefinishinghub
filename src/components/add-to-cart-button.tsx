"use client";

import { useCart } from "@/lib/cart-context";

export function AddToCartButton() {
  const { add } = useCart();

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        add();
      }}
      className="rounded-[2px] border border-forest px-3.5 py-2 font-sans text-xs font-medium tracking-wide text-forest hover:bg-forest hover:text-cream"
    >
      Add
    </button>
  );
}
