import type { Metadata } from "next";
import { SiteNavSection } from "@/components/site-nav-section";
import { SiteFooterSection } from "@/components/site-footer-section";
import { CartView, type CartLineItem } from "@/components/cart/cart-view";
import type { FeaturedProduct } from "@/components/category/featured-products-grid";
import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import { formatNaira } from "@/lib/format";

// No `revalidate` export here, deliberately — this page reads the calling
// user's own cart via cookies(), which forces dynamic rendering regardless
// (see lib/supabase/public.ts). Cart contents are per-user and must never
// be statically cached or shared across visitors the way the catalog pages
// (Home/Furniture/Listing/PDP) are.

export const metadata: Metadata = {
  title: "Your Cart — The Finishing Hub",
};

type CartItemRow = {
  id: string;
  quantity: number;
  product_variants: {
    id: string;
    finish: string | null;
    color: string | null;
    size: string | null;
    price_kobo: number;
    products: {
      id: string;
      slug: string;
      name: string;
      product_images: {
        url: string;
        alt_text: string | null;
        is_primary: boolean;
        display_order: number;
      }[];
    };
  };
};

async function getCartItems(): Promise<{ items: CartLineItem[]; productIds: string[] }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // No session yet (first-ever visit, before CartProvider has run its
  // client-side anonymous sign-in) — no cart_items row could exist for
  // this visitor, so an empty cart is the correct, honest answer.
  if (!user) return { items: [], productIds: [] };

  const { data, error } = await supabase
    .from("cart_items")
    .select(
      `
      id,
      quantity,
      product_variants!inner (
        id, finish, color, size, price_kobo,
        products!inner (
          id, slug, name,
          product_images ( url, alt_text, is_primary, display_order )
        )
      )
    `,
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .returns<CartItemRow[]>();

  if (error) {
    console.error("Failed to load cart items:", error.message);
    return { items: [], productIds: [] };
  }

  const rows = data ?? [];
  const items = rows.map((row) => {
    const variant = row.product_variants;
    const product = variant.products;
    const primaryImage =
      product.product_images.find((img) => img.is_primary) ??
      product.product_images[0] ??
      null;
    const config = [variant.finish, variant.color, variant.size].filter(Boolean).join(" · ");

    return {
      cartItemId: row.id,
      productSlug: product.slug,
      name: product.name,
      config,
      quantity: row.quantity,
      unitPriceKobo: variant.price_kobo,
      imageUrl: primaryImage?.url ?? null,
      imageAlt: primaryImage?.alt_text ?? product.name,
    };
  });
  const productIds = Array.from(new Set(rows.map((row) => row.product_variants.products.id)));

  return { items, productIds };
}

async function getSuggestions(excludeProductIds: string[]): Promise<FeaturedProduct[]> {
  const supabase = createPublicClient();
  let query = supabase
    .from("products")
    .select(
      `
      id, slug, name, categories ( name ),
      product_variants!inner ( id, price_kobo, is_default ),
      product_images ( url, alt_text, is_primary )
    `,
    )
    .eq("status", "published")
    .eq("product_variants.is_default", true)
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
      product_variants: { id: string; price_kobo: number; is_default: boolean }[];
      product_images: { url: string; alt_text: string | null; is_primary: boolean }[];
    }[]
  >();

  return (data ?? []).map((row) => {
    const variant = row.product_variants[0];
    const primaryImage =
      row.product_images.find((img) => img.is_primary) ?? row.product_images[0] ?? null;
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      categoryLabel: row.categories?.name ?? "",
      priceLabel: variant ? formatNaira(variant.price_kobo) : "",
      imageUrl: primaryImage?.url ?? null,
      imageAlt: primaryImage?.alt_text ?? row.name,
    };
  });
}

export default async function CartPage() {
  const { items, productIds } = await getCartItems();
  const suggestions = await getSuggestions(productIds);

  return (
    <div className="bg-cream font-sans text-ink antialiased">
      <SiteNavSection />
      <CartView initialItems={items} suggestions={suggestions} />
      <SiteFooterSection />
    </div>
  );
}
