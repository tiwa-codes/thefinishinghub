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
// cart-items-for-the-current-user query either page needs. Reads
// product_variants directly, not public_product_variants: this is the
// customer's own already-in-cart line items (their price was locked in
// when added), not a public browse/listing surface a stranger could
// query for someone else's product.
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
