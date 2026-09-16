import { createPublicClient } from "@/lib/supabase/public";
import { realSubcategorySlug, cleanSubcategorySlug } from "@/lib/subcategory-hrefs";
import type { NewArrivalProductCard } from "@/components/home/new-arrivals-grid";

export type ProductAttributes = Record<string, string | string[] | null | undefined> | null;

export type SubcategoryProductCard = NewArrivalProductCard & { attributes: ProductAttributes };

export type SiblingTab = { name: string; slug: string; href: string };

export type SubcategoryPageData = {
  subcategory: { id: string; name: string; slug: string } | null;
  parent: { name: string; slug: string } | null;
  siblings: SiblingTab[];
  products: SubcategoryProductCard[];
};

type CategoryRow = { id: string; slug: string; name: string };

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  short_description: string | null;
  created_at: string;
  collection: string | null;
  is_bestseller: boolean;
  attributes: ProductAttributes;
  categories: { name: string } | null;
  public_product_variants: {
    id: string;
    price_kobo: number | null;
    is_default: boolean | null;
    requires_quote: boolean | null;
  }[];
  product_images: { url: string; alt_text: string | null; is_primary: boolean; display_order: number }[];
};

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

// Shared by every /[topLevelSlug]/[subcategorySlug] page (Furniture,
// Tiles, Sanitaryware, Lighting, Doors) — same category-resolution +
// product + sibling-tabs shape each one needs. `cleanSubSlug` is the URL
// segment (see lib/subcategory-hrefs.ts for why that differs from the
// stored DB slug for some subcategories).
export async function getSubcategoryPageData(
  topLevelSlug: string,
  cleanSubSlug: string,
): Promise<SubcategoryPageData> {
  const supabase = createPublicClient();
  const realSlug = realSubcategorySlug(cleanSubSlug);

  const { data: parentCategory } = await supabase
    .from("categories")
    .select("id, slug, name")
    .eq("slug", topLevelSlug)
    .returns<CategoryRow[]>()
    .maybeSingle();

  if (!parentCategory) {
    return { subcategory: null, parent: null, siblings: [], products: [] };
  }

  const { data: subcategory } = await supabase
    .from("categories")
    .select("id, slug, name")
    .eq("parent_id", parentCategory.id)
    .eq("slug", realSlug)
    .returns<CategoryRow[]>()
    .maybeSingle();

  if (!subcategory) {
    return {
      subcategory: null,
      parent: { name: parentCategory.name, slug: parentCategory.slug },
      siblings: [],
      products: [],
    };
  }

  const { data: siblingRows } = await supabase
    .from("categories")
    .select("name, slug, display_order")
    .eq("parent_id", parentCategory.id)
    .order("display_order")
    .returns<{ name: string; slug: string; display_order: number }[]>();

  const siblings: SiblingTab[] = (siblingRows ?? []).map((s) => {
    const clean = cleanSubcategorySlug(s.slug);
    return { name: s.name, slug: clean, href: `/${topLevelSlug}/${clean}` };
  });

  const { data: productRows } = await supabase
    .from("products")
    .select(
      `
      id, slug, name, short_description, created_at, collection, is_bestseller, attributes,
      categories ( name ),
      public_product_variants!inner ( id, price_kobo, is_default, requires_quote ),
      product_images ( url, alt_text, is_primary, display_order )
    `,
    )
    .eq("category_id", subcategory.id)
    .eq("status", "published")
    .eq("public_product_variants.is_default", true)
    .order("is_bestseller", { ascending: false })
    .order("created_at", { ascending: false })
    .returns<ProductRow[]>();

  const products: SubcategoryProductCard[] = (productRows ?? []).map((p) => {
    const variant = p.public_product_variants.find((v) => v.is_default) ?? p.public_product_variants[0];
    const primaryImage = p.product_images.find((img) => img.is_primary) ?? p.product_images[0] ?? null;
    const secondaryImage =
      p.product_images.find((img) => !img.is_primary && img.display_order === 2) ?? null;
    return {
      id: p.id,
      slug: p.slug,
      variantId: variant?.id ?? "",
      categoryLabel: p.categories?.name ?? "",
      name: p.name,
      collection: p.collection,
      spec: p.short_description,
      priceKobo: variant?.price_kobo ?? null,
      requiresQuote: variant?.requires_quote ?? false,
      imageUrl: primaryImage?.url ?? null,
      imageAlt: primaryImage?.alt_text ?? p.name,
      secondaryImageUrl: secondaryImage?.url ?? null,
      isNew: Date.now() - new Date(p.created_at).getTime() < THIRTY_DAYS_MS,
      isBestseller: p.is_bestseller,
      attributes: p.attributes,
    };
  });

  return {
    subcategory: { id: subcategory.id, name: subcategory.name, slug: cleanSubcategorySlug(subcategory.slug) },
    parent: { name: parentCategory.name, slug: parentCategory.slug },
    siblings,
    products,
  };
}

// generateStaticParams for every [topLevelSlug]/[subcategorySlug] page —
// all subcategories under the given parent, as the clean URL segment.
export async function getSubcategoryStaticParams(
  topLevelSlug: string,
): Promise<{ subcategorySlug: string }[]> {
  const supabase = createPublicClient();
  const { data: parentCategory } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", topLevelSlug)
    .returns<{ id: string }[]>()
    .maybeSingle();
  if (!parentCategory) return [];

  const { data: subcategoryRows } = await supabase
    .from("categories")
    .select("slug")
    .eq("parent_id", parentCategory.id)
    .returns<{ slug: string }[]>();

  return (subcategoryRows ?? []).map((s) => ({ subcategorySlug: cleanSubcategorySlug(s.slug) }));
}
