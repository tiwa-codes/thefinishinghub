import type { ListingProduct } from "@/components/listing/listing-product-grid";

// The richer, per-variant-field shape every listing data-fetcher
// (subcategory pages, category "all" pages, search) produces before
// filtering/sorting — mapped down to the lean ListingProduct only after
// filters are applied, since the grid card itself doesn't render most of
// these fields.
export type FilterableProduct = {
  id: string;
  slug: string;
  variantId: string;
  name: string;
  // Null for a requires_quote product — read via public_product_variants,
  // where that's the actual security boundary (price genuinely isn't in
  // the response), not just a display choice made here.
  priceKobo: number | null;
  requiresQuote: boolean;
  imageUrl: string | null;
  imageAlt: string;
  inShowroom: boolean;
  inStock: boolean;
  finish: string | null;
  color: string | null;
  size: string | null;
  createdAt: string;
  categoryLabel?: string;
};

export type ListingSort = "featured" | "price-asc" | "price-desc" | "newest";

export const LISTING_SORTS: { value: ListingSort; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "newest", label: "Newest" },
];

export type ListingFilterState = {
  inStock: boolean;
  // Naira, not kobo — these round-trip through the URL, and a human
  // reading ?priceMin=50000 should be able to tell it means ₦50,000.
  priceMinNaira: number | null;
  priceMaxNaira: number | null;
  finish: string[];
  color: string[];
  size: string[];
  sort: ListingSort;
};

export const DEFAULT_LISTING_FILTERS: ListingFilterState = {
  inStock: false,
  priceMinNaira: null,
  priceMaxNaira: null,
  finish: [],
  color: [],
  size: [],
  sort: "featured",
};

export type ListingFilterOptions = {
  finishes: string[];
  colors: string[];
  sizes: string[];
};

// Distinct real values only — never a hardcoded list — computed from
// whatever products actually belong on this page (before the user's own
// filter choices narrow them further), so a dimension with zero real
// values simply isn't offered at all.
export function computeFilterOptions(products: FilterableProduct[]): ListingFilterOptions {
  const finishes = new Set<string>();
  const colors = new Set<string>();
  const sizes = new Set<string>();
  for (const p of products) {
    if (p.finish) finishes.add(p.finish);
    if (p.color) colors.add(p.color);
    if (p.size) sizes.add(p.size);
  }
  return {
    finishes: Array.from(finishes).sort(),
    colors: Array.from(colors).sort(),
    sizes: Array.from(sizes).sort(),
  };
}

type RawSearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parseListValue(value: string | string[] | undefined): string[] {
  const raw = firstValue(value);
  if (!raw) return [];
  return raw
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function parseNairaValue(value: string | string[] | undefined): number | null {
  const raw = firstValue(value);
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function parseListingFilters(searchParams: RawSearchParams): ListingFilterState {
  const sortRaw = firstValue(searchParams.sort);
  const sort = LISTING_SORTS.some((s) => s.value === sortRaw)
    ? (sortRaw as ListingSort)
    : "featured";

  return {
    inStock: firstValue(searchParams.inStock) === "1",
    priceMinNaira: parseNairaValue(searchParams.priceMin),
    priceMaxNaira: parseNairaValue(searchParams.priceMax),
    finish: parseListValue(searchParams.finish),
    color: parseListValue(searchParams.color),
    size: parseListValue(searchParams.size),
    sort,
  };
}

// AND-combined — every active dimension must match.
export function applyListingFilters<T extends FilterableProduct>(
  products: T[],
  filters: ListingFilterState,
): T[] {
  return products.filter((p) => {
    if (filters.inStock && !p.inStock) return false;
    if (filters.priceMinNaira !== null || filters.priceMaxNaira !== null) {
      // A quote-required product's price is genuinely unknown — it can't
      // be confirmed inside a specific range, so it doesn't match rather
      // than silently sorting as if it cost ₦0.
      if (p.priceKobo === null) return false;
      if (filters.priceMinNaira !== null && p.priceKobo < filters.priceMinNaira * 100) {
        return false;
      }
      if (filters.priceMaxNaira !== null && p.priceKobo > filters.priceMaxNaira * 100) {
        return false;
      }
    }
    if (filters.finish.length > 0 && (!p.finish || !filters.finish.includes(p.finish))) return false;
    if (filters.color.length > 0 && (!p.color || !filters.color.includes(p.color))) return false;
    if (filters.size.length > 0 && (!p.size || !filters.size.includes(p.size))) return false;
    return true;
  });
}

// "Featured" leaves whatever order the caller already fetched in (every
// data-fetcher already orders by created_at desc) — there's no separate
// curation flag in the schema, so "Featured" and "Newest" are the same
// order today. Sorts a copy; never mutates the input.
export function sortListingProducts<T extends FilterableProduct>(
  products: T[],
  sort: ListingSort,
): T[] {
  const copy = [...products];
  switch (sort) {
    case "price-asc":
      // Unknown (quote-required) prices sort last regardless of
      // direction — there's no real value to compare, and sorting them
      // as if they cost ₦0 would be misleading either way.
      return copy.sort((a, b) => {
        if (a.priceKobo === null) return b.priceKobo === null ? 0 : 1;
        if (b.priceKobo === null) return -1;
        return a.priceKobo - b.priceKobo;
      });
    case "price-desc":
      return copy.sort((a, b) => {
        if (a.priceKobo === null) return b.priceKobo === null ? 0 : 1;
        if (b.priceKobo === null) return -1;
        return b.priceKobo - a.priceKobo;
      });
    case "newest":
      return copy.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    case "featured":
    default:
      return copy;
  }
}

// A zero-filter-match empty state ("no pieces match your filters") is a
// different, more honest message than "nothing published yet" — the
// latter is only true when the page's full unfiltered candidate set was
// already empty. Shared so all 14 listing pages give this distinction
// consistently rather than re-deriving it.
export function listingEmptyMessage(
  unfilteredCount: number,
  noneAtAllMessage: string,
): string {
  return unfilteredCount === 0
    ? noneAtAllMessage
    : "No pieces match your filters — try adjusting them.";
}

export function toListingProduct(p: FilterableProduct): ListingProduct {
  return {
    id: p.id,
    slug: p.slug,
    variantId: p.variantId,
    name: p.name,
    priceKobo: p.priceKobo,
    requiresQuote: p.requiresQuote,
    imageUrl: p.imageUrl,
    imageAlt: p.imageAlt,
    inShowroom: p.inShowroom,
    categoryLabel: p.categoryLabel,
  };
}
