"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "tfh_wishlist";

function readWishlist(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeWishlist(ids: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // localStorage unavailable (private mode, quota) — wishlist just
    // doesn't persist for this viewer; no backend to fall back to.
  }
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"></path>
    </svg>
  );
}

export function WishlistButton({ productId }: { productId: string }) {
  const [wishlisted, setWishlisted] = useState(false);

  useEffect(() => {
    setWishlisted(readWishlist().includes(productId));
  }, [productId]);

  function toggle() {
    const current = readWishlist();
    const isIn = current.includes(productId);
    const next = isIn ? current.filter((id) => id !== productId) : [...current, productId];
    writeWishlist(next);
    setWishlisted(!isIn);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={wishlisted}
      className="mt-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-[2px] border border-[#cbc2b0] py-3.5 text-sm font-medium text-[#4a4339] hover:border-forest hover:text-forest"
    >
      <span className={wishlisted ? "text-forest" : ""}>
        <HeartIcon filled={wishlisted} />
      </span>
      {wishlisted ? "Saved to Wishlist" : "Save to Wishlist"}
    </button>
  );
}
