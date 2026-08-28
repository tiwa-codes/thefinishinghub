"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { PlaceholderBlock } from "@/components/placeholder-block";

export type ListingProduct = {
  id: string;
  slug: string;
  variantId: string;
  name: string;
  priceLabel: string;
  requiresQuote: boolean;
  imageUrl: string | null;
  imageAlt: string;
  inShowroom: boolean;
  // Optional: every other listing page (subcategory, category "all")
  // already establishes category context via the page itself, so a
  // repeated label per card would be redundant there — only search
  // results, which span multiple categories, pass this.
  categoryLabel?: string;
};

const PAGE_SIZE = 8;
const LOAD_MORE_STEP = 4;

// Progressive reveal, not server pagination — matches the source design's
// own behavior exactly (loads everything once, "Load more" just reveals
// more of what's already there). Fine at today's catalog size; would need
// rethinking if this category ever holds hundreds of products.
export function ListingProductGrid({
  products,
  emptyMessage,
}: {
  products: ListingProduct[];
  emptyMessage: string;
}) {
  const [shownCount, setShownCount] = useState(Math.min(PAGE_SIZE, products.length));

  // A new filter/sort selection swaps in a whole new `products` array
  // (via a URL navigation, re-rendering this same mounted component) —
  // reset back to the first page rather than keeping whatever count a
  // previous "Load more" click left behind.
  useEffect(() => {
    setShownCount(Math.min(PAGE_SIZE, products.length));
  }, [products]);

  if (products.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-[#8a8073]">{emptyMessage}</p>
    );
  }

  const shown = products.slice(0, shownCount);
  const hasMore = shownCount < products.length;

  return (
    <>
      <div className="grid grid-cols-1 gap-x-6 gap-y-7 sm:grid-cols-2 lg:grid-cols-4">
        {shown.map((product) => (
          <div key={product.id} className="relative">
            <Link href={`/products/${product.slug}`} className="block text-inherit no-underline">
              <div className="relative mb-3.5 h-[220px] overflow-hidden bg-[#e2dccf] lg:h-[300px]">
                {product.imageUrl ? (
                  <Image
                    src={product.imageUrl}
                    alt={product.imageAlt}
                    fill
                    sizes="(min-width: 1024px) 25vw, 50vw"
                    className="object-cover"
                  />
                ) : (
                  <PlaceholderBlock
                    label="[ no photo yet ]"
                    className="absolute inset-0"
                  />
                )}
                {product.inShowroom && (
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-[2px] bg-[rgba(7,40,24,0.9)] px-2.5 py-1.5 text-[10px] uppercase tracking-[0.08em] text-cream">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-gold-bright" />
                    In Showroom
                  </span>
                )}
              </div>
              {product.categoryLabel && (
                <div className="mb-[7px] font-mono text-[10px] uppercase tracking-[0.12em] text-[#9a8a5c]">
                  {product.categoryLabel}
                </div>
              )}
              <div className="mb-[5px] font-serif text-lg text-ink">
                {product.name}
              </div>
            </Link>
            {product.requiresQuote ? (
              <div className="font-serif text-base text-forest">Request a Quote</div>
            ) : (
              <div className="flex items-center justify-between gap-2.5">
                <span className="font-serif text-base text-forest">
                  {product.priceLabel}
                </span>
                <AddToCartButton variantId={product.variantId} />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-12 flex flex-col items-center gap-4">
        <div className="text-[13px] text-[#8a8073]">
          Showing {shown.length} of {products.length}
        </div>
        {hasMore && (
          <button
            type="button"
            onClick={() =>
              setShownCount((c) => Math.min(products.length, c + LOAD_MORE_STEP))
            }
            className="rounded-[2px] border border-forest px-10 py-3.5 font-sans text-[13px] font-medium uppercase tracking-[0.12em] text-forest hover:bg-forest hover:text-cream"
          >
            Load more
          </button>
        )}
      </div>
    </>
  );
}
