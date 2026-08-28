import { createUncachedPublicClient } from "@/lib/supabase/public";
import type { FilterableProduct } from "@/lib/listing-filters";

type CategoryRow = { id: string; name: string };

type ProductQueryRow = {
  id: string;
  slug: string;
  name: string;
  is_showroom_display: boolean;
  created_at: string;
  // public_product_variants, not product_variants — the only
  // variant-price path public-facing code may read from. It nulls
  // price_kobo for a requires_quote product at the data layer.
  public_product_variants: {
    id: string;
    price_kobo: number | null;
    is_default: boolean;
    in_stock: boolean;
    finish: string | null;
    color: string | null;
    size: string | null;
    requires_quote: boolean;
  }[];
  product_images: { url: string; alt_text: string | null; is_primary: boolean }[];
};

// Shared by every subcategory listing page, across all top-level
// categories (Furniture's Living Room/Dining/Bedroom/Workspace/Office,
// Sanitarywares' Shower/Bathtub/Toilet, ...) — same category+products
// query each one needs, driven entirely by Supabase rather than a
// hand-copied query per page. Returns every published product in the
// subcategory, unfiltered — the page applies filters/sort itself (see
// lib/listing-filters.ts) so filter option lists can be computed from
// this same full set.
export async function getSubcategoryListingData(
  subcategorySlug: string,
): Promise<{ category: CategoryRow | null; products: FilterableProduct[] }> {
  const supabase = createUncachedPublicClient();

  const { data: category } = await supabase
    .from("categories")
    .select("id, name")
    .eq("slug", subcategorySlug)
    .returns<CategoryRow[]>()
    .maybeSingle();

  const { data: productRows } = await supabase
    .from("products")
    .select(
      `
      id,
      slug,
      name,
      is_showroom_display,
      created_at,
      public_product_variants!inner ( id, price_kobo, is_default, in_stock, finish, color, size, requires_quote ),
      product_images ( url, alt_text, is_primary )
    `,
    )
    .eq("status", "published")
    .eq("public_product_variants.is_default", true)
    .eq("category_id", category?.id ?? "")
    .order("created_at", { ascending: false })
    .returns<ProductQueryRow[]>();

  const products: FilterableProduct[] = (productRows ?? []).map((row) => {
    const variant = row.public_product_variants[0];
    const primaryImage =
      row.product_images.find((img) => img.is_primary) ??
      row.product_images[0] ??
      null;

    return {
      id: row.id,
      slug: row.slug,
      variantId: variant?.id ?? "",
      name: row.name,
      priceKobo: variant?.price_kobo ?? null,
      requiresQuote: variant?.requires_quote ?? false,
      imageUrl: primaryImage?.url ?? null,
      imageAlt: primaryImage?.alt_text ?? row.name,
      inShowroom: row.is_showroom_display,
      inStock: variant?.in_stock ?? false,
      finish: variant?.finish ?? null,
      color: variant?.color ?? null,
      size: variant?.size ?? null,
      createdAt: row.created_at,
    };
  });

  return { category, products };
}
