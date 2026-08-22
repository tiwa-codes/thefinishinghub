import { SiteNavSection } from "@/components/site-nav-section";
import { SiteFooterSection } from "@/components/site-footer-section";
import { ListingView } from "@/components/listing/listing-view";
import { getSubcategoryListingData } from "@/lib/subcategory-listing-data";

export const revalidate = 3600;

export default async function DiningFurniturePage() {
  const { category, products } = await getSubcategoryListingData("furniture-dining");

  return (
    <div className="bg-cream font-sans text-ink antialiased">
      <SiteNavSection />
      <ListingView
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "Furniture", href: "/furniture" },
          { label: category?.name ?? "Dining" },
        ]}
        title="Dining Furniture"
        description="Dining tables, chairs, sideboards and servers — in stock at the Abuja showroom or made to order."
        products={products}
        emptyMessage="No Dining pieces published yet — check back soon."
      />
      <SiteFooterSection />
    </div>
  );
}
