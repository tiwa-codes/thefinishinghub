"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createPublicClient } from "@/lib/supabase/public";
import { NewArrivalsGrid, type NewArrivalProductCard } from "@/components/home/new-arrivals-grid";
import { getWishlistIds, removeFromWishlist } from "@/lib/wishlist";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  short_description: string | null;
  created_at: string;
  collection: string | null;
  is_bestseller: boolean;
  categories: { name: string } | null;
  public_product_variants: { id: string; price_kobo: number | null; is_default: boolean | null; requires_quote: boolean | null }[];
  product_images: { url: string; alt_text: string | null; is_primary: boolean; display_order: number }[];
};

function toCard(row: ProductRow): NewArrivalProductCard {
  const variant = row.public_product_variants.find((v) => v.is_default) ?? row.public_product_variants[0];
  const primaryImage = row.product_images.find((img) => img.is_primary) ?? row.product_images[0] ?? null;
  const secondaryImage =
    row.product_images.find((img) => !img.is_primary && img.display_order === 2) ?? null;
  return {
    id: row.id,
    slug: row.slug,
    variantId: variant?.id ?? "",
    categoryLabel: row.categories?.name ?? "",
    name: row.name,
    collection: row.collection,
    spec: row.short_description,
    priceKobo: variant?.price_kobo ?? null,
    requiresQuote: variant?.requires_quote ?? false,
    imageUrl: primaryImage?.url ?? null,
    imageAlt: primaryImage?.alt_text ?? row.name,
    secondaryImageUrl: secondaryImage?.url ?? null,
    isNew: Date.now() - new Date(row.created_at).getTime() < THIRTY_DAYS_MS,
    isBestseller: row.is_bestseller,
  };
}

export function WishlistView() {
  const [products, setProducts] = useState<NewArrivalProductCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const ids = getWishlistIds();
      if (ids.length === 0) {
        setLoading(false);
        return;
      }

      const supabase = createPublicClient();
      const { data } = await supabase
        .from("products")
        .select(
          `
          id, slug, name, short_description, created_at, collection, is_bestseller,
          categories ( name ),
          public_product_variants!inner ( id, price_kobo, is_default, requires_quote ),
          product_images ( url, alt_text, is_primary, display_order )
        `,
        )
        .in("id", ids)
        .eq("status", "published")
        .eq("public_product_variants.is_default", true)
        .returns<ProductRow[]>();

      setProducts((data ?? []).map(toCard));
      setLoading(false);
    }
    load();
  }, []);

  function handleRemove(productId: string) {
    removeFromWishlist(productId);
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  }

  return (
    <div className="mx-auto max-w-[1440px] px-5 pb-16 pt-8 lg:px-10">
      <nav aria-label="Breadcrumb" className="mb-3 text-xs text-[#8a8073]">
        <Link href="/" className="hover:text-ink">
          Home
        </Link>{" "}
        / <span className="text-ink">Wishlist</span>
      </nav>
      <h1 className="mb-8 font-serif text-3xl text-ink lg:text-4xl">Your Wishlist</h1>

      {loading ? (
        <p className="text-sm text-[#8a8073]">Loading…</p>
      ) : products.length === 0 ? (
        <div className="py-16 text-center">
          <p className="mb-6 text-[15px] text-[#6b6155]">Your wishlist is empty.</p>
          <Link
            href="/furniture"
            className="inline-block rounded-[2px] bg-gold px-7 py-[15px] text-sm font-semibold tracking-wide text-forest no-underline hover:bg-gold-bright"
          >
            Browse our collections
          </Link>
        </div>
      ) : (
        <NewArrivalsGrid products={products} onRemove={handleRemove} />
      )}
    </div>
  );
}
