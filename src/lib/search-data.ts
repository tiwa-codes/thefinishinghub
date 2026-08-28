import { createUncachedPublicClient } from "@/lib/supabase/public";
import type { FilterableProduct } from "@/lib/listing-filters";

// public_product_variants, not product_variants — the only variant-price
// path public-facing code may read from. It nulls price_kobo for a
// requires_quote product at the data layer.
type ProductQueryRow = {
  id: string;
  slug: string;
  name: string;
  is_showroom_display: boolean;
  created_at: string;
  categories: { name: string } | null;
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

const SELECT = `
  id,
  slug,
  name,
  is_showroom_display,
  created_at,
  categories ( name ),
  public_product_variants!inner ( id, price_kobo, is_default, in_stock, finish, color, size, requires_quote ),
  product_images ( url, alt_text, is_primary )
`;

// Escapes ILIKE's own wildcard characters so a literal "%" or "_" typed
// into search is matched literally, not treated as a pattern. Exported
// for a direct unit test — everything else in this file needs a real
// Supabase connection.
export function escapeIlike(value: string): string {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

// Simple ILIKE across name/description/short_description — not full-text
// search. The catalog is small enough that relevance ranking would be
// overbuilding right now; this is an easy upgrade to Postgres full-text
// search later if the catalog grows. Returns every match, unfiltered —
// the page applies filters/sort itself (see lib/listing-filters.ts).
//
// Three separate .ilike() calls, merged and deduped by id, rather than a
// single .or("col.ilike.x,col.ilike.x,...") — .or()'s comma-separated
// filter syntax would need its own escaping for a query containing a
// comma or parenthesis, which .ilike() (an ordinary parameterized query
// value) doesn't.
export async function searchProducts(rawQuery: string): Promise<FilterableProduct[]> {
  const query = rawQuery.trim();
  if (!query) return [];

  const supabase = createUncachedPublicClient();
  const pattern = `%${escapeIlike(query)}%`;

  const [byName, byDescription, byShortDescription] = await Promise.all([
    supabase
      .from("products")
      .select(SELECT)
      .eq("status", "published")
      .eq("public_product_variants.is_default", true)
      .ilike("name", pattern)
      .returns<ProductQueryRow[]>(),
    supabase
      .from("products")
      .select(SELECT)
      .eq("status", "published")
      .eq("public_product_variants.is_default", true)
      .ilike("description", pattern)
      .returns<ProductQueryRow[]>(),
    supabase
      .from("products")
      .select(SELECT)
      .eq("status", "published")
      .eq("public_product_variants.is_default", true)
      .ilike("short_description", pattern)
      .returns<ProductQueryRow[]>(),
  ]);

  const byId = new Map<string, ProductQueryRow>();
  for (const row of [
    ...(byName.data ?? []),
    ...(byDescription.data ?? []),
    ...(byShortDescription.data ?? []),
  ]) {
    byId.set(row.id, row);
  }

  return Array.from(byId.values())
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((row) => {
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
        categoryLabel: row.categories?.name ?? "",
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
}
