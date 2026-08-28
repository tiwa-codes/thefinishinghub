"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { VariantPicker, type ProductVariantOption } from "./variant-picker";

// Real contact facts (CLAUDE.md) — used exactly, never invented.
const SHOWROOM_PHONE_DISPLAY = "+234 (0) 803 311 7302";
const SHOWROOM_PHONE_TEL = "+2348033117302";
const SHOWROOM_EMAIL = "thefinishinghubng@gmail.com";

export function ProductPurchasePanel({
  variants,
  defaultVariantId,
  requiresQuote,
}: {
  variants: ProductVariantOption[];
  defaultVariantId: string;
  requiresQuote: boolean;
}) {
  const { add, ready } = useCart();
  const [selectedVariantId, setSelectedVariantId] = useState(defaultVariantId);
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const [pending, setPending] = useState(false);

  const disabled = !ready || pending || !selectedVariantId;

  if (requiresQuote) {
    return (
      <div>
        <VariantPicker
          variants={variants}
          selectedId={selectedVariantId}
          onSelect={setSelectedVariantId}
        />

        <div className="mb-[22px] rounded-[2px] border border-[#cbc2b0] bg-white px-5 py-5">
          <div className="mb-2 text-xs uppercase tracking-[0.1em] text-[#6b6155]">
            Request a Quote
          </div>
          <p className="mb-4 text-[14.5px] leading-[1.7] text-[#4a4339]">
            This piece is available by quote — pricing depends on finish, size and
            delivery. Call or email the showroom and we&apos;ll put a number together.
          </p>
          <div className="flex flex-col gap-2 text-sm">
            <a
              href={`tel:${SHOWROOM_PHONE_TEL}`}
              className="font-semibold text-forest hover:underline"
            >
              {SHOWROOM_PHONE_DISPLAY}
            </a>
            <a
              href={`mailto:${SHOWROOM_EMAIL}`}
              className="font-semibold text-forest hover:underline"
            >
              {SHOWROOM_EMAIL}
            </a>
          </div>
        </div>

        <Link
          href="/#showroom"
          className="mb-[22px] block rounded-[2px] border border-forest px-5 py-4 text-center font-sans text-sm font-semibold tracking-wide text-forest no-underline hover:bg-forest hover:text-cream"
        >
          Book a viewing at the showroom
        </Link>

        <div className="mb-[34px] text-[12.5px] leading-[1.6] text-[#8a8073]">
          5-year warranty · Delivered nationwide
        </div>
      </div>
    );
  }

  return (
    <div>
      <VariantPicker
        variants={variants}
        selectedId={selectedVariantId}
        onSelect={setSelectedVariantId}
      />

      <div className="mb-[30px]">
        <div className="mb-3 text-xs uppercase tracking-[0.1em] text-[#6b6155]">
          Quantity
        </div>
        <div className="inline-flex items-center rounded-[2px] border border-[#cbc2b0]">
          <button
            type="button"
            aria-label="Decrease quantity"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="h-10 w-10 border-none bg-transparent text-base text-forest"
          >
            −
          </button>
          <span className="w-11 text-center text-sm font-medium">{quantity}</span>
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() => setQuantity((q) => q + 1)}
            className="h-10 w-10 border-none bg-transparent text-base text-forest"
          >
            +
          </button>
        </div>
      </div>

      <div className="mb-[22px] flex gap-3">
        <button
          type="button"
          disabled={disabled}
          onClick={async () => {
            if (!selectedVariantId) return;
            setPending(true);
            try {
              await add(selectedVariantId, quantity);
              setJustAdded(true);
              setTimeout(() => setJustAdded(false), 1400);
            } finally {
              setPending(false);
            }
          }}
          className="flex-1 rounded-[2px] bg-gold px-5 py-4 font-sans text-sm font-semibold tracking-wide text-forest hover:bg-gold-bright disabled:cursor-not-allowed disabled:opacity-50"
        >
          {justAdded ? "Added ✓" : "Add to Cart"}
        </button>
        <Link
          href="/#showroom"
          className="flex-1 rounded-[2px] border border-forest px-5 py-4 text-center font-sans text-sm font-semibold tracking-wide text-forest no-underline hover:bg-forest hover:text-cream"
        >
          Book a viewing at the showroom
        </Link>
      </div>

      <div className="mb-[34px] text-[12.5px] leading-[1.6] text-[#8a8073]">
        5-year warranty · Delivered nationwide
      </div>
    </div>
  );
}
