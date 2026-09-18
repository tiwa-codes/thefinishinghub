import { SiteNavSection } from "@/components/site-nav-section";
import { SiteFooterSection } from "@/components/site-footer-section";
import { CategoryView } from "@/components/category/category-view";
import { getCategoryPageData } from "@/lib/category-page-data";
import { unsplashUrl } from "@/lib/unsplash";

export const revalidate = 3600;

export default async function DecorPage() {
  const { category, subcategories, products } = await getCategoryPageData("decor");
  const title = category?.name ?? "Decor";

  return (
    <div className="bg-cream font-sans text-ink antialiased">
      <SiteNavSection />
      <CategoryView
        title={title}
        heroDescription="Mirrors, rugs and accessories to finish a room."
        heroImageSrc={unsplashUrl("1616047006789-b7af5afb8c20", 1600)}
        heroImageAlt={title}
        subcategories={subcategories}
        featuredTitle={`Featured pieces from ${title}`}
        viewAllHref="/decor/all"
        products={products}
        comingSoon={products.length === 0}
        designerTitle="Book a designer for your decor project."
        designerDescription="Bring a plan or a photo. We'll help you specify pieces from the showroom for your space."
      />
      <SiteFooterSection />
    </div>
  );
}
