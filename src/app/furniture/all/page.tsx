import { SiteNavSection } from "@/components/site-nav-section";
import { SiteFooterSection } from "@/components/site-footer-section";
import { ListingView } from "@/components/listing/listing-view";
import { getCategoryAllProductsData } from "@/lib/category-page-data";
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

export default async function AllFurniturePage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const { category, products: allProducts } = await getCategoryAllProductsData("furniture");
  const title = category?.name ?? "Furniture & Furnishings";
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
          { label: title, href: "/furniture" },
          { label: "All" },
        ]}
        title={`All ${title}`}
        description="Every published piece across every Furniture subcategory, in one place."
        products={products}
        emptyMessage={listingEmptyMessage(
          allProducts.length,
          "No Furniture pieces published yet — check back soon.",
        )}
        filterOptions={filterOptions}
        activeFilters={activeFilters}
      />
      <SiteFooterSection />
    </div>
  );
}
