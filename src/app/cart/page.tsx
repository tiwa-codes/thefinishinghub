import type { Metadata } from "next";
import { SiteNavSection } from "@/components/site-nav-section";
import { SiteFooterSection } from "@/components/site-footer-section";
import { CartView } from "@/components/cart/cart-view";
import type { FeaturedProduct } from "@/components/category/featured-products-grid";
import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import { formatNaira } from "@/lib/format";
import { getCartItems } from "@/lib/cart-data";
import type { CartLineItem } from "@/components/cart/cart-view";

// No `revalidate` export here, deliberately — this page reads the calling
// user's own cart via cookies(), which forces dynamic rendering regardless
// (see lib/supabase/public.ts). Cart contents are per-user and must never
// be statically cached or shared across visitors the way the catalog pages
// (Home/Furniture/Listing/PDP) are.

export const metadata: Metadata = {
  title: "Your Cart — The Finishing Hub",
};

async function getMyCartItems(): Promise<{ items: CartLineItem[]; productIds: string[] }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // No session yet (first-ever visit, before CartProvider has run its
  // client-side anonymous sign-in) — no cart_items row could exist for
  // this visitor, so an empty cart is the correct, honest answer.
  if (!user) return { items: [], productIds: [] };

  return getCartItems(supabase, user.id);
}

async function getSuggestions(excludeProductIds: string[]): Promise<FeaturedProduct[]> {
  const supabase = createPublicClient();
  // public_product_variants, not product_variants — the only
  // variant-price path public-facing code may read from.
  let query = supabase
    .from("products")
    .select(
      `
      id, slug, name, categories ( name ),
      public_product_variants!inner ( id, price_kobo, is_default, requires_quote ),
      product_images ( url, alt_text, is_primary )
    `,
    )
    .eq("status", "published")
    .eq("public_product_variants.is_default", true)
    .order("created_at", { ascending: false })
    .limit(3);

  if (excludeProductIds.length > 0) {
    query = query.not("id", "in", `(${excludeProductIds.join(",")})`);
  }

  const { data } = await query.returns<
    {
      id: string;
      slug: string;
      name: string;
      categories: { name: string } | null;
      public_product_variants: {
        id: string;
        price_kobo: number | null;
        is_default: boolean;
        requires_quote: boolean;
      }[];
      product_images: { url: string; alt_text: string | null; is_primary: boolean }[];
    }[]
  >();

  return (data ?? []).map((row) => {
    const variant = row.public_product_variants[0];
    const primaryImage =
      row.product_images.find((img) => img.is_primary) ?? row.product_images[0] ?? null;
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      categoryLabel: row.categories?.name ?? "",
      priceLabel: variant?.price_kobo != null ? formatNaira(variant.price_kobo) : "",
      requiresQuote: variant?.requires_quote ?? false,
      imageUrl: primaryImage?.url ?? null,
      imageAlt: primaryImage?.alt_text ?? row.name,
    };
  });
}

export default async function CartPage() {
  const { items, productIds } = await getMyCartItems();
  const suggestions = await getSuggestions(productIds);

  return (
    <div className="bg-cream font-sans text-ink antialiased">
      <SiteNavSection />
      <CartView initialItems={items} suggestions={suggestions} />
      <SiteFooterSection />
    </div>
  );
}
