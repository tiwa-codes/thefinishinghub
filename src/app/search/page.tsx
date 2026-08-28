import { SiteNavSection } from "@/components/site-nav-section";
import { SiteFooterSection } from "@/components/site-footer-section";
import { ListingBreadcrumb } from "@/components/listing/listing-breadcrumb";
import { FilterBar } from "@/components/listing/filter-bar";
import { ListingProductGrid } from "@/components/listing/listing-product-grid";
import { searchProducts } from "@/lib/search-data";
import {
  applyListingFilters,
  computeFilterOptions,
  listingEmptyMessage,
  parseListingFilters,
  sortListingProducts,
  toListingProduct,
} from "@/lib/listing-filters";

// Dynamic by nature — depends on a query string that varies per request,
// so it was never eligible for ISR even before filters existed.
// force-dynamic is still needed explicitly, though: reading searchParams
// only forces per-request *rendering*, it does NOT by itself disable
// Next's Data Cache for the underlying Supabase fetch() calls, which
// would otherwise keep serving a stale cached response from the first
// time a given search query ran (verified live: a real data change
// wasn't reflected in results until this was added).
export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const rawQuery = searchParams.q;
  const query = (Array.isArray(rawQuery) ? rawQuery[0] : (rawQuery ?? "")).trim();
  const allProducts = query ? await searchProducts(query) : [];
  const filterOptions = computeFilterOptions(allProducts);
  const activeFilters = parseListingFilters(searchParams);
  const products = sortListingProducts(
    applyListingFilters(allProducts, activeFilters),
    activeFilters.sort,
  ).map(toListingProduct);
  const countLabel = `${products.length} ${products.length === 1 ? "result" : "results"}`;

  return (
    <div className="bg-cream font-sans text-ink antialiased">
      <SiteNavSection />
      <section className="mx-auto max-w-[1440px] px-5 pt-8 lg:px-10 lg:pt-11">
        <ListingBreadcrumb crumbs={[{ label: "Home", href: "/" }, { label: "Search" }]} />
        <h1 className="mb-2 font-serif text-3xl font-normal text-ink lg:text-[40px]">
          {query ? `Search results for "${query}"` : "Search"}
        </h1>
      </section>

      {query ? (
        <>
          <section className="mx-auto max-w-[1440px] px-5 pt-7 lg:px-10">
            <FilterBar
              countLabel={countLabel}
              filterOptions={filterOptions}
              activeFilters={activeFilters}
              preserveParams={{ q: query }}
            />
          </section>
          <section className="mx-auto max-w-[1440px] px-5 pt-9 pb-12 lg:px-10 lg:pb-24">
            <ListingProductGrid
              products={products}
              emptyMessage={listingEmptyMessage(
                allProducts.length,
                `No products matched "${query}"`,
              )}
            />
          </section>
        </>
      ) : (
        <section className="mx-auto max-w-[1440px] px-5 pt-9 pb-12 lg:px-10 lg:pb-24">
          <p className="py-16 text-center text-sm text-[#8a8073]">
            Enter a search term above to find products.
          </p>
        </section>
      )}
      <SiteFooterSection />
    </div>
  );
}
