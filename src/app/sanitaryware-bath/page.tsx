import { SiteNavSection } from "@/components/site-nav-section";
import { SiteFooterSection } from "@/components/site-footer-section";
import { CategoryView } from "@/components/category/category-view";
import { getCategoryPageData } from "@/lib/category-page-data";

export const revalidate = 3600;

export default async function SanitarywareBathPage() {
  const { category, subcategories, products } = await getCategoryPageData("sanitaryware-bath");
  const title = category?.name ?? "Sanitarywares & Bath Accessories";

  return (
    <div className="bg-cream font-sans text-ink antialiased">
      <SiteNavSection />
      <CategoryView
        title={title}
        heroDescription="Showers, baths and fittings for a finished bathroom."
        heroImageSrc="/images/category-sanitaryware.webp"
        heroImageAlt={title}
        subcategoriesTitle="Shop Sanitarywares by type"
        subcategories={subcategories}
        featuredTitle={`Featured pieces from ${title}`}
        viewAllHref="/sanitaryware-bath/all"
        products={products}
        designerTitle="Book a designer for your bathroom project."
        designerDescription="Bring a plan or a photo. We'll help you specify pieces from the showroom for your space."
      />
      <SiteFooterSection />
    </div>
  );
}
