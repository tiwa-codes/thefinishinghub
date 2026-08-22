import { SiteNavSection } from "@/components/site-nav-section";
import { SiteFooterSection } from "@/components/site-footer-section";
import { ListingView } from "@/components/listing/listing-view";
import { getSubcategoryListingData } from "@/lib/subcategory-listing-data";

export const revalidate = 3600;

export default async function BedroomFurniturePage() {
  const { category, products } = await getSubcategoryListingData("furniture-bedroom");

  return (
    <div className="bg-cream font-sans text-ink antialiased">
      <SiteNavSection />
      <ListingView
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "Furniture", href: "/furniture" },
          { label: category?.name ?? "Bedroom" },
        ]}
        title="Bedroom Furniture"
        description="Beds, nightstands, dressers and wardrobes — in stock at the Abuja showroom or made to order."
        products={products}
        emptyMessage="No Bedroom pieces published yet — check back soon."
      />
      <SiteFooterSection />
    </div>
  );
}
