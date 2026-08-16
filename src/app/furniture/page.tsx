import { SiteNavSection } from "@/components/site-nav-section";
import { SiteFooterSection } from "@/components/site-footer-section";
import { FurnitureCategoryView } from "@/components/category/furniture-category-view";
import type { SubcategoryTile } from "@/components/category/subcategory-tiles";
import type { FeaturedProduct } from "@/components/category/featured-products-grid";
import { createPublicClient } from "@/lib/supabase/public";
import { formatNaira } from "@/lib/format";
import { hrefForSubcategorySlug } from "@/lib/categories";

// ISR, same reasoning as the homepage (see lib/supabase/public.ts): this
// client never touches cookies(), so the route stays eligible for static
// generation with a revalidation window instead of force-dynamic.
export const revalidate = 3600;

// categories has no image column yet — this maps the subcategories we do
// have real photography for. Office intentionally has none (no image row
// possible for a category the way products have product_images; falls
// back to the placeholder block, same as a product with no photo yet).
const SUBCATEGORY_IMAGES: Record<string, string> = {
  "furniture-living": "/images/room-living.jpg",
  "furniture-dining": "/images/room-dining.webp",
  "furniture-bedroom": "/images/bed-luxe-palm-mural.webp",
  "furniture-workspace": "/images/room-workspace.webp",
};

type CategoryRow = { id: string; slug: string; name: string; display_order: number };

type ProductQueryRow = {
  id: string;
  slug: string;
  name: string;
  categories: { name: string } | null;
  product_variants: { id: string; price_kobo: number; is_default: boolean }[];
  product_images: { url: string; alt_text: string | null; is_primary: boolean }[];
};

export default async function FurniturePage() {
  const supabase = createPublicClient();

  const { data: furnitureCategory } = await supabase
    .from("categories")
    .select("id, slug, name, display_order")
    .eq("slug", "furniture")
    .returns<CategoryRow[]>()
    .single();

  const { data: subcategoryRows } = await supabase
    .from("categories")
    .select("id, slug, name, display_order")
    .eq("parent_id", furnitureCategory?.id ?? "")
    .order("display_order")
    .returns<CategoryRow[]>();

  const subcategories: SubcategoryTile[] = (subcategoryRows ?? []).map((cat) => ({
    slug: cat.slug,
    name: cat.name,
    href: hrefForSubcategorySlug(cat.slug),
    imageSrc: SUBCATEGORY_IMAGES[cat.slug],
  }));

  const categoryIds = [
    ...(furnitureCategory ? [furnitureCategory.id] : []),
    ...(subcategoryRows ?? []).map((c) => c.id),
  ];

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

  const products: FeaturedProduct[] = (productRows ?? []).map((row) => {
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

  return (
    <div className="bg-cream font-sans text-ink antialiased">
      <SiteNavSection />
      <FurnitureCategoryView subcategories={subcategories} products={products} />
      <SiteFooterSection />
    </div>
  );
}
