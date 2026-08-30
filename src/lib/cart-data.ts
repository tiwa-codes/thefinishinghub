import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import type { CartLineItem } from "@/components/cart/cart-view";

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

// Shared by /cart and /checkout (server components) — same real-price
// cart-items-for-the-current-user query either page needs.
//
// Two queries, not one nested embed: display metadata (name, slug,
// images, finish/color/size) comes from product_variants/products
// directly, same as before — that part was never a security concern (a
// customer's own already-in-cart line items, not a public browse
// surface). But price_kobo must come from public_product_variants
// instead: it's the same auth.uid()-scoped view create_order itself now
// reads prices through (see 20260901090000_create_order_trade_pricing.sql)
// — what the customer sees here has to match what they're actually
// charged, and the raw product_variants.price_kobo doesn't reflect a
// trade discount. public_product_variants has no FK PostgREST can use to
// embed it under cart_items (it's a view, not a table cart_items.variant_id
// actually references), so it's fetched separately and merged by variant
// id. Falls back to the raw price only if a variant is missing from the
// discount-aware view at all (e.g. its product went unpublished mid-
// session) — an edge case, not the normal path.
export async function getCartItems(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<{ items: CartLineItem[]; productIds: string[] }> {
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
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .returns<CartItemRow[]>();

  if (error) {
    console.error("Failed to load cart items:", error.message);
    return { items: [], productIds: [] };
  }

  const rows = data ?? [];
  const variantIds = Array.from(new Set(rows.map((row) => row.product_variants.id)));

  const priceByVariantId = new Map<string, number>();
  if (variantIds.length > 0) {
    const { data: discountAwareVariants, error: priceError } = await supabase
      .from("public_product_variants")
      .select("id, price_kobo")
      .in("id", variantIds)
      .returns<{ id: string; price_kobo: number | null }[]>();

    if (priceError) {
      console.error("Failed to load discount-aware cart prices:", priceError.message);
    } else {
      for (const v of discountAwareVariants ?? []) {
        if (v.price_kobo != null) priceByVariantId.set(v.id, v.price_kobo);
      }
    }
  }

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
      unitPriceKobo: priceByVariantId.get(variant.id) ?? variant.price_kobo,
      imageUrl: primaryImage?.url ?? null,
      imageAlt: primaryImage?.alt_text ?? product.name,
    };
  });
  const productIds = Array.from(new Set(rows.map((row) => row.product_variants.products.id)));

  return { items, productIds };
}
