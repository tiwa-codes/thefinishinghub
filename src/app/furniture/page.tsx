import { SiteNavSection } from "@/components/site-nav-section";
import { SiteFooterSection } from "@/components/site-footer-section";
import { CategoryView } from "@/components/category/category-view";
import { getCategoryPageData } from "@/lib/category-page-data";

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

export default async function FurniturePage() {
  const { category, subcategories, products } = await getCategoryPageData(
    "furniture",
    SUBCATEGORY_IMAGES,
  );
  const title = category?.name ?? "Furniture & Furnishings";

  return (
    <div className="bg-cream font-sans text-ink antialiased">
      <SiteNavSection />
      <CategoryView
        title={title}
        heroDescription="Sofas, beds, dining and office pieces. Shop by the room you're building."
        heroImageSrc="/images/editorial-full-room-scene.jpg"
        heroImageAlt={title}
        subcategoriesTitle="Shop Furniture by room"
        subcategories={subcategories}
        featuredTitle={`Featured pieces from ${title}`}
        viewAllHref="/furniture/all"
        products={products}
        designerTitle="Book a designer for your furniture project."
        designerDescription="Bring a plan or a photo. We'll help you specify pieces from the showroom for your space."
      />
      <SiteFooterSection />
    </div>
  );
}
