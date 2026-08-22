import { SiteNavSection } from "@/components/site-nav-section";
import { SiteFooterSection } from "@/components/site-footer-section";
import { CategoryView } from "@/components/category/category-view";
import { getCategoryPageData } from "@/lib/category-page-data";

export const revalidate = 3600;

export default async function TilesWallFinishesPage() {
  const { category, subcategories, products } = await getCategoryPageData("tiles-wall-finishes");
  const title = category?.name ?? "Tiles & Wall Finishes";

  return (
    <div className="bg-cream font-sans text-ink antialiased">
      <SiteNavSection />
      <CategoryView
        title={title}
        heroDescription="Porcelain, stone and wall finishes for every surface in the house."
        heroImageSrc="/images/category-tiles.jpg"
        heroImageAlt={title}
        subcategories={subcategories}
        featuredTitle={`Featured pieces from ${title}`}
        products={products}
        designerTitle="Book a designer for your tiling project."
        designerDescription="Bring a plan or a photo. We'll help you specify pieces from the showroom for your space."
      />
      <SiteFooterSection />
    </div>
  );
}
