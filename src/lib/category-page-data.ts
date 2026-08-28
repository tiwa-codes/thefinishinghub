import { createPublicClient, createUncachedPublicClient } from "@/lib/supabase/public";
import { hrefForSubcategorySlug } from "@/lib/categories";
import { formatNaira } from "@/lib/format";
import type { SubcategoryTile } from "@/components/category/subcategory-tiles";
import type { FeaturedProduct } from "@/components/category/featured-products-grid";
import type { FilterableProduct } from "@/lib/listing-filters";

type CategoryRow = { id: string; slug: string; name: string; display_order: number };

// public_product_variants, not product_variants, in both row types below
// — the only variant-price path public-facing code may read from. It
// nulls price_kobo for a requires_quote product at the data layer.
type ProductQueryRow = {
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
};

type AllProductsQueryRow = {
  id: string;
  slug: string;
  name: string;
  is_showroom_display: boolean;
  created_at: string;
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

// Shared by every top-level category page (Furniture, Tiles, Lighting,
// Sanitaryware, Doors) — same category+subcategories+featured-products
// shape each one needs, driven entirely by Supabase rather than a
// hand-copied query per page.
export async function getCategoryPageData(
  topLevelSlug: string,
  subcategoryImages: Record<string, string> = {},
): Promise<{
  category: CategoryRow | null;
  subcategories: SubcategoryTile[];
  products: FeaturedProduct[];
}> {
  const supabase = createPublicClient();

  const { data: category } = await supabase
    .from("categories")
    .select("id, slug, name, display_order")
    .eq("slug", topLevelSlug)
    .returns<CategoryRow[]>()
    .maybeSingle();

  const { data: subcategoryRows } = await supabase
    .from("categories")
    .select("id, slug, name, display_order")
    .eq("parent_id", category?.id ?? "")
    .order("display_order")
    .returns<CategoryRow[]>();

  const subcategories: SubcategoryTile[] = (subcategoryRows ?? []).map((cat) => ({
    slug: cat.slug,
    name: cat.name,
    href: hrefForSubcategorySlug(cat.slug),
    imageSrc: subcategoryImages[cat.slug],
  }));

  const categoryIds = [
    ...(category ? [category.id] : []),
    ...(subcategoryRows ?? []).map((c) => c.id),
  ];

  let products: FeaturedProduct[] = [];

  if (categoryIds.length > 0) {
    const { data: productRows } = await supabase
      .from("products")
      .select(
        `
        id,
        slug,
        name,
        categories ( name ),
        public_product_variants!inner ( id, price_kobo, is_default, requires_quote ),
        product_images ( url, alt_text, is_primary )
      `,
      )
      .eq("status", "published")
      .eq("public_product_variants.is_default", true)
      .in("category_id", categoryIds)
      .order("created_at", { ascending: false })
      .limit(4)
      .returns<ProductQueryRow[]>();

    products = (productRows ?? []).map((row) => {
      const variant = row.public_product_variants[0];
      const primaryImage =
        row.product_images.find((img) => img.is_primary) ??
        row.product_images[0] ??
        null;

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

  return { category, subcategories, products };
}

// Backs each category's "View all {category}" page — every published
// product across the top-level category and all its subcategories, no
// limit(4), unfiltered (the page applies filters/sort itself — see
// lib/listing-filters.ts). Separate from getCategoryPageData above
// (which is capped for the featured-preview grid on the category
// landing page) rather than a shared/parameterized query, matching how
// subcategory-listing-data.ts and this file already each keep their own
// product-row mapping.
export async function getCategoryAllProductsData(
  topLevelSlug: string,
): Promise<{ category: CategoryRow | null; products: FilterableProduct[] }> {
  const supabase = createUncachedPublicClient();

  const { data: category } = await supabase
    .from("categories")
    .select("id, slug, name, display_order")
    .eq("slug", topLevelSlug)
    .returns<CategoryRow[]>()
    .maybeSingle();

  const { data: subcategoryRows } = await supabase
    .from("categories")
    .select("id")
    .eq("parent_id", category?.id ?? "")
    .returns<{ id: string }[]>();

  const categoryIds = [
    ...(category ? [category.id] : []),
    ...(subcategoryRows ?? []).map((c) => c.id),
  ];

  let products: FilterableProduct[] = [];

  if (categoryIds.length > 0) {
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
      .in("category_id", categoryIds)
      .order("created_at", { ascending: false })
      .returns<AllProductsQueryRow[]>();

    products = (productRows ?? []).map((row) => {
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
  }

  return { category, products };
}
