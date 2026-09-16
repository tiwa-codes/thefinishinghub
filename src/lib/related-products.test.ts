import { describe, expect, it, vi, beforeEach } from "vitest";

// getRelated queries products.category_id first, and only falls back to an
// unscoped query when fewer than 4 category matches come back — this
// exercises that behavior directly against a fake Supabase client.
type FakeRow = { id: string; categoryScoped: boolean };

let categoryScopedRows: FakeRow[] = [];
let fallbackRows: FakeRow[] = [];

function makeBuilder() {
  let usedCategoryFilter = false;
  const builder: Record<string, unknown> = {
    select: () => builder,
    eq: (column: string) => {
      if (column === "category_id") usedCategoryFilter = true;
      return builder;
    },
    neq: () => builder,
    order: () => builder,
    limit: () => builder,
    returns: () => builder,
    then: (resolve: (result: { data: FakeRow[]; error: null }) => void) =>
      resolve({ data: usedCategoryFilter ? categoryScopedRows : fallbackRows, error: null }),
  };
  return builder;
}

vi.mock("@/lib/supabase/public", () => ({
  createPublicClient: () => ({ from: () => makeBuilder() }),
}));

// toCard() reads several fields off each row (categories, variants,
// images) that a bare FakeRow doesn't have — real RelatedRow shape isn't
// needed here since the thing under test is *which* rows getRelated picks,
// not how it maps them, but toCard still runs over every row returned, so
// each fake row needs enough shape to not throw.
function toFullRow(row: FakeRow) {
  return {
    id: row.id,
    slug: row.id,
    name: row.id,
    short_description: null,
    created_at: new Date().toISOString(),
    collection: null,
    is_bestseller: false,
    categories: { name: "Sofas" },
    public_product_variants: [{ id: "v1", price_kobo: 100000, is_default: true, requires_quote: false }],
    product_images: [],
  };
}

beforeEach(() => {
  categoryScopedRows = [];
  fallbackRows = [];
});

describe("getRelated", () => {
  it("returns products from the same category when at least 4 exist there", async () => {
    const { getRelated } = await import("./related-products");
    categoryScopedRows = [
      toFullRow({ id: "same-1", categoryScoped: true }),
      toFullRow({ id: "same-2", categoryScoped: true }),
      toFullRow({ id: "same-3", categoryScoped: true }),
      toFullRow({ id: "same-4", categoryScoped: true }),
    ] as unknown as FakeRow[];
    fallbackRows = [toFullRow({ id: "other-1", categoryScoped: false })] as unknown as FakeRow[];

    const result = await getRelated("category-1", "excluded-id");

    expect(result).toHaveLength(4);
    expect(result.map((r) => r.id)).toEqual(["same-1", "same-2", "same-3", "same-4"]);
    expect(result.map((r) => r.id)).not.toContain("other-1");
  });

  it("falls back to any category when fewer than 4 products exist in the same category", async () => {
    const { getRelated } = await import("./related-products");
    categoryScopedRows = [toFullRow({ id: "same-1", categoryScoped: true })] as unknown as FakeRow[];
    fallbackRows = [
      toFullRow({ id: "same-1", categoryScoped: true }),
      toFullRow({ id: "other-1", categoryScoped: false }),
      toFullRow({ id: "other-2", categoryScoped: false }),
      toFullRow({ id: "other-3", categoryScoped: false }),
    ] as unknown as FakeRow[];

    const result = await getRelated("category-1", "excluded-id");

    expect(result.length).toBeGreaterThan(1);
    expect(result.map((r) => r.id)).toContain("same-1");
    expect(result.map((r) => r.id)).toContain("other-1");
  });
});
