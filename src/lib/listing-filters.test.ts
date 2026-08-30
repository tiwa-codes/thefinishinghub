import { describe, expect, it } from "vitest";
import {
  applyListingFilters,
  computeFilterOptions,
  listingEmptyMessage,
  parseListingFilters,
  sortListingProducts,
  toListingProduct,
  type FilterableProduct,
} from "./listing-filters";

function product(overrides: Partial<FilterableProduct> = {}): FilterableProduct {
  return {
    id: "p1",
    slug: "product-1",
    variantId: "v1",
    name: "Product One",
    priceKobo: 100000,
    requiresQuote: false,
    imageUrl: null,
    imageAlt: "Product One",
    inShowroom: false,
    inStock: true,
    finish: null,
    color: null,
    size: null,
    createdAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("computeFilterOptions", () => {
  it("returns only real, distinct values — never a hardcoded list", () => {
    const options = computeFilterOptions([
      product({ finish: "Walnut", color: "Grey" }),
      product({ finish: "Walnut", color: "Taupe" }),
      product({ finish: null, color: null }),
    ]);
    expect(options.finishes).toEqual(["Walnut"]);
    expect(options.colors).toEqual(["Grey", "Taupe"]);
    expect(options.sizes).toEqual([]);
  });

  it("returns empty arrays for a dimension nothing has a value for", () => {
    const options = computeFilterOptions([product(), product()]);
    expect(options).toEqual({ finishes: [], colors: [], sizes: [] });
  });
});

describe("parseListingFilters", () => {
  it("parses every dimension from real query params", () => {
    const filters = parseListingFilters({
      inStock: "1",
      priceMin: "50000",
      priceMax: "150000",
      finish: "Walnut,Oak",
      color: "Grey",
      sort: "price-asc",
    });
    expect(filters).toEqual({
      inStock: true,
      priceMinNaira: 50000,
      priceMaxNaira: 150000,
      finish: ["Walnut", "Oak"],
      color: ["Grey"],
      size: [],
      sort: "price-asc",
    });
  });

  it("defaults everything to unfiltered/featured when no params are present", () => {
    expect(parseListingFilters({})).toEqual({
      inStock: false,
      priceMinNaira: null,
      priceMaxNaira: null,
      finish: [],
      color: [],
      size: [],
      sort: "featured",
    });
  });

  it("falls back to featured for an unrecognized sort value rather than throwing", () => {
    expect(parseListingFilters({ sort: "bogus" }).sort).toBe("featured");
  });

  it("ignores a non-numeric or negative price rather than crashing the query", () => {
    expect(parseListingFilters({ priceMin: "not-a-number" }).priceMinNaira).toBeNull();
    expect(parseListingFilters({ priceMin: "-5" }).priceMinNaira).toBeNull();
  });
});

describe("applyListingFilters", () => {
  const catalog = [
    product({ id: "a", priceKobo: 1_850_000, inStock: true, finish: null }),
    product({ id: "b", priceKobo: 61_000_000, inStock: true, finish: "Walnut" }),
    product({ id: "c", priceKobo: 54_000_000, inStock: false, finish: "Walnut" }),
  ];

  it("combines filters with AND, not OR", () => {
    const result = applyListingFilters(catalog, {
      inStock: true,
      priceMinNaira: null,
      priceMaxNaira: null,
      finish: ["Walnut"],
      color: [],
      size: [],
      sort: "featured",
    });
    // "b" is the only product that is both in stock AND Walnut — "c" is
    // Walnut but out of stock, so AND-combination must exclude it too.
    expect(result.map((p) => p.id)).toEqual(["b"]);
  });

  it("applies a price range against price_kobo, converting the Naira filter values", () => {
    const result = applyListingFilters(catalog, {
      inStock: false,
      priceMinNaira: 100_000,
      priceMaxNaira: null,
      finish: [],
      color: [],
      size: [],
      sort: "featured",
    });
    expect(result.map((p) => p.id)).toEqual(["b", "c"]);
  });

  it("excludes a product with no value at all for a filtered dimension", () => {
    const result = applyListingFilters(catalog, {
      inStock: false,
      priceMinNaira: null,
      priceMaxNaira: null,
      finish: ["Walnut"],
      color: [],
      size: [],
      sort: "featured",
    });
    expect(result.map((p) => p.id)).toEqual(["b", "c"]);
  });

  it("returns every product, unfiltered, when no filters are active", () => {
    const result = applyListingFilters(catalog, {
      inStock: false,
      priceMinNaira: null,
      priceMaxNaira: null,
      finish: [],
      color: [],
      size: [],
      sort: "featured",
    });
    expect(result).toHaveLength(3);
  });

  it("excludes a requires_quote product (null price) from any active price range, rather than treating it as ₦0", () => {
    const withQuoteItem = [
      ...catalog,
      product({ id: "quoted", priceKobo: null, requiresQuote: true }),
    ];
    const result = applyListingFilters(withQuoteItem, {
      inStock: false,
      priceMinNaira: 0,
      priceMaxNaira: null,
      finish: [],
      color: [],
      size: [],
      sort: "featured",
    });
    expect(result.map((p) => p.id)).not.toContain("quoted");
  });
});

describe("sortListingProducts", () => {
  const catalog = [
    product({ id: "cheap", priceKobo: 100, createdAt: "2026-01-01T00:00:00Z" }),
    product({ id: "mid", priceKobo: 500, createdAt: "2026-03-01T00:00:00Z" }),
    product({ id: "expensive", priceKobo: 900, createdAt: "2026-02-01T00:00:00Z" }),
  ];

  it("sorts price low to high", () => {
    expect(sortListingProducts(catalog, "price-asc").map((p) => p.id)).toEqual([
      "cheap",
      "mid",
      "expensive",
    ]);
  });

  it("sorts price high to low", () => {
    expect(sortListingProducts(catalog, "price-desc").map((p) => p.id)).toEqual([
      "expensive",
      "mid",
      "cheap",
    ]);
  });

  it("sorts newest first by created_at", () => {
    expect(sortListingProducts(catalog, "newest").map((p) => p.id)).toEqual([
      "mid",
      "expensive",
      "cheap",
    ]);
  });

  it("leaves the caller's existing order untouched for 'featured'", () => {
    expect(sortListingProducts(catalog, "featured").map((p) => p.id)).toEqual([
      "cheap",
      "mid",
      "expensive",
    ]);
  });

  it("never mutates the input array", () => {
    const original = [...catalog];
    sortListingProducts(catalog, "price-desc");
    expect(catalog).toEqual(original);
  });

  it("sorts a requires_quote product (null price) last, in either price direction", () => {
    const withQuoteItem = [
      product({ id: "quoted", priceKobo: null, requiresQuote: true }),
      ...catalog,
    ];
    expect(sortListingProducts(withQuoteItem, "price-asc").at(-1)?.id).toBe("quoted");
    expect(sortListingProducts(withQuoteItem, "price-desc").at(-1)?.id).toBe("quoted");
  });
});

describe("listingEmptyMessage", () => {
  it("uses the page's own message when nothing was published at all", () => {
    expect(listingEmptyMessage(0, "No Bedroom pieces published yet — check back soon.")).toBe(
      "No Bedroom pieces published yet — check back soon.",
    );
  });

  it("uses an honest filter-specific message when products exist but none match", () => {
    expect(listingEmptyMessage(4, "No Bedroom pieces published yet — check back soon.")).toBe(
      "No pieces match your filters — try adjusting them.",
    );
  });
});

describe("toListingProduct", () => {
  it("passes the raw price through and drops filter-only fields for the grid card", () => {
    const result = toListingProduct(
      product({ priceKobo: 125000, categoryLabel: "Lighting & Automation" }),
    );
    // Raw kobo, not a formatted string — the grid card's own <Price>
    // component computes any trade discount and formats it, which it can
    // only do from the real kobo number, not a pre-formatted label.
    expect(result.priceKobo).toBe(125000);
    expect(result.categoryLabel).toBe("Lighting & Automation");
    expect(result).not.toHaveProperty("finish");
  });

  it("passes requiresQuote through with a null priceKobo rather than fabricating a price", () => {
    const result = toListingProduct(product({ priceKobo: null, requiresQuote: true }));
    expect(result.requiresQuote).toBe(true);
    expect(result.priceKobo).toBeNull();
  });
});
