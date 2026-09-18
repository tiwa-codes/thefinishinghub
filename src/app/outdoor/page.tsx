import { SiteNavSection } from "@/components/site-nav-section";
import { SiteFooterSection } from "@/components/site-footer-section";
import { CategoryView } from "@/components/category/category-view";
import { getCategoryPageData } from "@/lib/category-page-data";
import { unsplashUrl } from "@/lib/unsplash";

export const revalidate = 3600;

export default async function OutdoorPage() {
  const { category, subcategories, products } = await getCategoryPageData("outdoor");
  const title = category?.name ?? "Outdoor";

  return (
    <div className="bg-cream font-sans text-ink antialiased">
      <SiteNavSection />
      <CategoryView
        title={title}
        heroDescription="Garden furniture, lighting and paving for outdoor living."
        heroImageSrc={unsplashUrl("1783125126717-e9c855c86a63", 1600)}
        heroImageAlt={title}
        subcategories={subcategories}
        featuredTitle={`Featured pieces from ${title}`}
        viewAllHref="/outdoor/all"
        products={products}
        comingSoon={products.length === 0}
        designerTitle="Book a designer for your outdoor project."
        designerDescription="Bring a plan or a photo. We'll help you specify pieces from the showroom for your space."
      />
      <SiteFooterSection />
    </div>
  );
}
