import { SiteNavSection } from "@/components/site-nav-section";
import { SiteFooterSection } from "@/components/site-footer-section";
import { CategoryView } from "@/components/category/category-view";
import { getCategoryPageData } from "@/lib/category-page-data";

export const revalidate = 3600;

export default async function LightingPage() {
  const { category, subcategories, products } = await getCategoryPageData("lighting");
  const title = category?.name ?? "Lighting & Automation";

  return (
    <div className="bg-cream font-sans text-ink antialiased">
      <SiteNavSection />
      <CategoryView
        title={title}
        heroDescription="Pendants, sconces and home automation for every room."
        heroImageSrc="/images/category-lighting.jpg"
        heroImageAlt={title}
        subcategories={subcategories}
        featuredTitle={`Featured pieces from ${title}`}
        products={products}
        designerTitle="Book a designer for your lighting project."
        designerDescription="Bring a plan or a photo. We'll help you specify pieces from the showroom for your space."
      />
      <SiteFooterSection />
    </div>
  );
}
