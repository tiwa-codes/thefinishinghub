import { createPublicClient } from "@/lib/supabase/public";
import { formatNaira } from "@/lib/format";
import type { ListingProduct } from "@/components/listing/listing-product-grid";

type CategoryRow = { id: string; name: string };

type ProductQueryRow = {
  id: string;
  slug: string;
  name: string;
  is_showroom_display: boolean;
  product_variants: { id: string; price_kobo: number; is_default: boolean }[];
  product_images: { url: string; alt_text: string | null; is_primary: boolean }[];
};

// Shared by every Furniture subcategory listing page (Living Room, Dining,
// Bedroom, ...) — same category+products query each one needs, driven
// entirely by Supabase rather than a hand-copied query per page.
export async function getSubcategoryListingData(
  subcategorySlug: string,
): Promise<{ category: CategoryRow | null; products: ListingProduct[] }> {
  const supabase = createPublicClient();

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
      product_variants!inner ( id, price_kobo, is_default ),
      product_images ( url, alt_text, is_primary )
    `,
    )
    .eq("status", "published")
    .eq("product_variants.is_default", true)
    .eq("category_id", category?.id ?? "")
    .order("created_at", { ascending: false })
    .returns<ProductQueryRow[]>();

  const products: ListingProduct[] = (productRows ?? []).map((row) => {
    const variant = row.product_variants[0];
    const primaryImage =
      row.product_images.find((img) => img.is_primary) ??
      row.product_images[0] ??
      null;

    return {
      id: row.id,
      slug: row.slug,
      variantId: variant?.id ?? "",
      name: row.name,
      priceLabel: variant ? formatNaira(variant.price_kobo) : "",
      imageUrl: primaryImage?.url ?? null,
      imageAlt: primaryImage?.alt_text ?? row.name,
      inShowroom: row.is_showroom_display,
    };
  });

  return { category, products };
}
