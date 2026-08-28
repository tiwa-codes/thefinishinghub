import { SiteNavSection } from "@/components/site-nav-section";
import { SiteFooterSection } from "@/components/site-footer-section";
import { ListingView } from "@/components/listing/listing-view";
import { getSubcategoryListingData } from "@/lib/subcategory-listing-data";
import {
  applyListingFilters,
  computeFilterOptions,
  listingEmptyMessage,
  parseListingFilters,
  sortListingProducts,
  toListingProduct,
} from "@/lib/listing-filters";

// Dynamic, not ISR: reading searchParams for real filter/sort state means
// Next can't statically prerender this route. force-dynamic is also
// required, not just implied by reading searchParams — that only forces
// per-request *rendering*, it does NOT by itself disable Next's Data
// Cache for the underlying Supabase fetch() calls, which would otherwise
// keep serving a stale cached response from the first time this exact
// query ran (verified live: a real filter/data change wasn't reflected
// until this was added).
export const dynamic = "force-dynamic";

export default async function LivingRoomFurniturePage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const { category, products: allProducts } =
    await getSubcategoryListingData("furniture-living");
  const filterOptions = computeFilterOptions(allProducts);
  const activeFilters = parseListingFilters(searchParams);
  const products = sortListingProducts(
    applyListingFilters(allProducts, activeFilters),
    activeFilters.sort,
  ).map(toListingProduct);

  return (
    <div className="bg-cream font-sans text-ink antialiased">
      <SiteNavSection />
      <ListingView
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "Furniture", href: "/furniture" },
          { label: category?.name ?? "Living Room" },
        ]}
        title="Living Room Furniture"
        description="Sofas, seating, coffee and side tables, and media units — in stock at the Abuja showroom or made to order."
        products={products}
        emptyMessage={listingEmptyMessage(
          allProducts.length,
          "No Living Room pieces published yet — check back soon.",
        )}
        filterOptions={filterOptions}
        activeFilters={activeFilters}
      />
      <SiteFooterSection />
    </div>
  );
}
