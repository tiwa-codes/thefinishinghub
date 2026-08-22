import { createPublicClient } from "@/lib/supabase/public";
import { hrefForSubcategorySlug } from "@/lib/categories";
import { formatNaira } from "@/lib/format";
import type { SubcategoryTile } from "@/components/category/subcategory-tiles";
import type { FeaturedProduct } from "@/components/category/featured-products-grid";

type CategoryRow = { id: string; slug: string; name: string; display_order: number };

type ProductQueryRow = {
  id: string;
  slug: string;
  name: string;
  categories: { name: string } | null;
  product_variants: { id: string; price_kobo: number; is_default: boolean }[];
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
        product_variants!inner ( id, price_kobo, is_default ),
        product_images ( url, alt_text, is_primary )
      `,
      )
      .eq("status", "published")
      .eq("product_variants.is_default", true)
      .in("category_id", categoryIds)
      .order("created_at", { ascending: false })
      .limit(4)
      .returns<ProductQueryRow[]>();

    products = (productRows ?? []).map((row) => {
      const variant = row.product_variants[0];
      const primaryImage =
        row.product_images.find((img) => img.is_primary) ??
        row.product_images[0] ??
        null;

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

  return { category, subcategories, products };
}
