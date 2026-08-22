import { SiteNavSection } from "@/components/site-nav-section";
import { SiteFooterSection } from "@/components/site-footer-section";
import { CategoryView } from "@/components/category/category-view";
import { getCategoryPageData } from "@/lib/category-page-data";

export const revalidate = 3600;

export default async function DoorsWindowsJoineryPage() {
  const { category, subcategories, products } = await getCategoryPageData(
    "doors-windows-joinery",
  );
  const title = category?.name ?? "Doors, Windows & Joinery";

  return (
    <div className="bg-cream font-sans text-ink antialiased">
      <SiteNavSection />
      <CategoryView
        title={title}
        heroDescription="Doors, windows and joinery finished to match the rest of the house."
        heroImageSrc="/images/category-doors.webp"
        heroImageAlt={title}
        subcategories={subcategories}
        featuredTitle={`Featured pieces from ${title}`}
        products={products}
        designerTitle="Book a designer for your doors and joinery project."
        designerDescription="Bring a plan or a photo. We'll help you specify pieces from the showroom for your space."
      />
      <SiteFooterSection />
    </div>
  );
}
