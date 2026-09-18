import { SiteNavSection } from "@/components/site-nav-section";
import { SiteFooterSection } from "@/components/site-footer-section";
import { CategoryView } from "@/components/category/category-view";
import { getCategoryPageData } from "@/lib/category-page-data";
import { unsplashUrl } from "@/lib/unsplash";

export const revalidate = 3600;

export default async function KitchensPage() {
  const { category, subcategories, products } = await getCategoryPageData("kitchens");
  const title = category?.name ?? "Kitchens";

  return (
    <div className="bg-cream font-sans text-ink antialiased">
      <SiteNavSection />
      <CategoryView
        title={title}
        heroDescription="Cabinetry, surfaces and fittings for a kitchen built to last."
        heroImageSrc={unsplashUrl("1639405069836-f82aa6dcb900", 1600)}
        heroImageAlt={title}
        subcategories={subcategories}
        featuredTitle={`Featured pieces from ${title}`}
        viewAllHref="/kitchens/all"
        products={products}
        comingSoon={products.length === 0}
        designerTitle="Book a designer for your kitchen project."
        designerDescription="Bring a plan or a photo. We'll help you specify pieces from the showroom for your space."
      />
      <SiteFooterSection />
    </div>
  );
}
