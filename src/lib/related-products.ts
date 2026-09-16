import { createPublicClient } from "@/lib/supabase/public";
import type { NewArrivalProductCard } from "@/components/home/new-arrivals-grid";

// Split out of src/app/products/[slug]/page.tsx so it can be unit tested
// directly — importing the page module itself drags in SiteNavSection,
// whose import chain hits lib/categories.ts's React cache() at module
// scope, which only resolves inside Next.js's own runtime (crashes with
// "cache is not a function" under plain Vitest).
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

type RelatedRow = {
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

function toCard(row: RelatedRow): NewArrivalProductCard {
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

const RELATED_SELECT = `
  id,
  slug,
  name,
  short_description,
  created_at,
  collection,
  is_bestseller,
  categories ( name ),
  public_product_variants!inner ( id, price_kobo, is_default, requires_quote ),
  product_images ( url, alt_text, is_primary, display_order )
`;

// "You might also like" — same-category products first; only falls back
// to any published product when fewer than 4 exist in the current
// product's own category.
export async function getRelated(categoryId: string | undefined, excludeId: string) {
  const supabase = createPublicClient();
  const results: RelatedRow[] = [];

  if (categoryId) {
    const { data } = await supabase
      .from("products")
      .select(RELATED_SELECT)
      .eq("status", "published")
      .eq("category_id", categoryId)
      .eq("public_product_variants.is_default", true)
      .neq("id", excludeId)
      .order("created_at", { ascending: false })
      .limit(4)
      .returns<RelatedRow[]>();
    results.push(...(data ?? []));
  }

  if (results.length < 4) {
    const { data } = await supabase
      .from("products")
      .select(RELATED_SELECT)
      .eq("status", "published")
      .eq("public_product_variants.is_default", true)
      .neq("id", excludeId)
      .order("created_at", { ascending: false })
      // Over-fetch since some of these may duplicate the category-first
      // results above and get filtered out by the existingIds check below.
      .limit(4 + results.length)
      .returns<RelatedRow[]>();

    const existingIds = new Set(results.map((r) => r.id));
    for (const row of data ?? []) {
      if (results.length >= 4) break;
      if (!existingIds.has(row.id)) results.push(row);
    }
  }

  return results.slice(0, 4).map(toCard);
}
