"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { NewArrivalsGrid } from "@/components/home/new-arrivals-grid";
import { BookADesignerBand } from "@/components/category/book-a-designer-band";
import type { SiblingTab, SubcategoryProductCard } from "@/lib/subcategory-page-data";

const SHOWROOM_PHONE_DISPLAY = "+234 (0) 803 311 7302";
const SHOWROOM_PHONE_TEL = "tel:+2348033117302";

type SortOption = "featured" | "newest" | "price-asc" | "price-desc";

const SORT_LABELS: Record<SortOption, string> = {
  featured: "Featured",
  newest: "Newest",
  "price-asc": "Price: Low to High",
  "price-desc": "Price: High to Low",
};

const ATTRIBUTE_FILTER_KEYS = ["type", "look", "material", "finish"] as const;
const ATTRIBUTE_FILTER_LABELS: Record<(typeof ATTRIBUTE_FILTER_KEYS)[number], string> = {
  type: "Type",
  look: "Look",
  material: "Material",
  finish: "Finish",
};

const PAGE_SIZE = 20;

function sortProducts(products: SubcategoryProductCard[], sort: SortOption): SubcategoryProductCard[] {
  if (sort === "featured") return products;
  if (sort === "newest") {
    return [...products].sort((a, b) => (a.isNew === b.isNew ? 0 : a.isNew ? -1 : 1));
  }
  const withPrice = products.filter((p) => p.priceKobo != null);
  const withoutPrice = products.filter((p) => p.priceKobo == null);
  withPrice.sort((a, b) =>
    sort === "price-asc" ? a.priceKobo! - b.priceKobo! : b.priceKobo! - a.priceKobo!,
  );
  return [...withPrice, ...withoutPrice];
}

export function SubcategoryListingView({
  parentName,
  parentSlug,
  subcategoryName,
  siblings,
  activeSlug,
  showAttributeFilters,
  products,
}: {
  parentName: string;
  parentSlug: string;
  subcategoryName: string;
  siblings: SiblingTab[];
  activeSlug: string;
  showAttributeFilters: boolean;
  products: SubcategoryProductCard[];
}) {
  const [sort, setSort] = useState<SortOption>("featured");
  const [attributeFilters, setAttributeFilters] = useState<Record<string, string>>({});
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const attributeOptions = useMemo(() => {
    if (!showAttributeFilters) return {};
    const options: Record<string, Set<string>> = {};
    for (const key of ATTRIBUTE_FILTER_KEYS) options[key] = new Set();
    for (const product of products) {
      if (!product.attributes) continue;
      for (const key of ATTRIBUTE_FILTER_KEYS) {
        const value = product.attributes[key];
        if (typeof value === "string" && value) options[key].add(value);
      }
    }
    return options;
  }, [products, showAttributeFilters]);

  const hasAnyAttributeOptions = Object.values(attributeOptions).some((set) => set.size > 0);

  const filtered = useMemo(() => {
    let result = products;
    for (const [key, value] of Object.entries(attributeFilters)) {
      if (!value) continue;
      result = result.filter((p) => p.attributes && p.attributes[key] === value);
    }
    return result;
  }, [products, attributeFilters]);

  const sorted = useMemo(() => sortProducts(filtered, sort), [filtered, sort]);
  const visible = sorted.slice(0, visibleCount);
  const hasMore = visibleCount < sorted.length;

  return (
    <div className="bg-cream font-sans text-ink antialiased">
      <div className="mx-auto max-w-[1440px] px-5 pb-6 pt-8 lg:px-10">
        <nav aria-label="Breadcrumb" className="mb-3 text-xs text-[#8a8073]">
          <Link href="/" className="hover:text-ink">
            Home
          </Link>{" "}
          / <Link href={`/${parentSlug}`} className="hover:text-ink">{parentName}</Link> /{" "}
          <span className="text-ink">{subcategoryName}</span>
        </nav>
        <h1 className="font-serif text-3xl text-ink lg:text-4xl">{subcategoryName}</h1>
        <p className="mt-1 text-sm text-[#8a8073]">
          {products.length} {products.length === 1 ? "piece" : "pieces"}
        </p>
      </div>

      <div className="sticky top-[72px] z-20 border-y border-[#ddd5c4] bg-cream lg:top-[128px]">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-3 px-5 py-3 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <div className="flex gap-2 overflow-x-auto">
            {siblings.map((sib) => (
              <Link
                key={sib.slug}
                href={sib.href}
                className={`shrink-0 whitespace-nowrap rounded-full border px-4 py-1.5 text-sm no-underline transition-colors ${
                  sib.slug === activeSlug
                    ? "border-gold bg-gold text-ink"
                    : "border-[#cfc6b6] text-ink hover:border-forest"
                }`}
              >
                {sib.name}
              </Link>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {showAttributeFilters && hasAnyAttributeOptions && (
              <>
                {ATTRIBUTE_FILTER_KEYS.map((key) =>
                  attributeOptions[key]?.size > 0 ? (
                    <select
                      key={key}
                      value={attributeFilters[key] ?? ""}
                      onChange={(e) =>
                        setAttributeFilters((prev) => ({ ...prev, [key]: e.target.value }))
                      }
                      aria-label={ATTRIBUTE_FILTER_LABELS[key]}
                      className="rounded-[2px] border border-[#cfc6b6] bg-white px-2.5 py-1.5 text-sm text-ink outline-none focus:border-forest"
                    >
                      <option value="">{ATTRIBUTE_FILTER_LABELS[key]}</option>
                      {Array.from(attributeOptions[key]).map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  ) : null,
                )}
              </>
            )}
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              aria-label="Sort"
              className="rounded-[2px] border border-[#cfc6b6] bg-white px-2.5 py-1.5 text-sm text-ink outline-none focus:border-forest"
            >
              {(Object.keys(SORT_LABELS) as SortOption[]).map((option) => (
                <option key={option} value={option}>
                  {SORT_LABELS[option]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1440px] px-5 py-10 lg:px-10">
        {visible.length > 0 ? (
          <>
            <NewArrivalsGrid products={visible} />
            {hasMore && (
              <div className="mt-10 flex justify-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                  className="rounded-[2px] border border-forest px-6 py-2.5 text-sm font-medium text-forest hover:bg-forest hover:text-cream"
                >
                  Load more
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="py-16 text-center">
            <p className="mb-2 font-serif text-xl text-ink">No products in this category yet.</p>
            <p className="mb-6 text-sm text-[#8a8073]">
              Visit our showroom or contact us — we may have what you need.
            </p>
            <div className="flex justify-center gap-4">
              <a
                href={SHOWROOM_PHONE_TEL}
                className="rounded-[2px] border border-forest px-5 py-2.5 text-sm font-medium text-forest hover:bg-forest hover:text-cream"
              >
                Contact us ({SHOWROOM_PHONE_DISPLAY})
              </a>
              <Link
                href="/#showroom"
                className="rounded-[2px] bg-forest px-5 py-2.5 text-sm font-medium text-cream hover:bg-deep-forest"
              >
                Visit showroom
              </Link>
            </div>
          </div>
        )}
      </div>

      <BookADesignerBand
        title={`Book a designer for your ${parentName.toLowerCase()} project.`}
        description="Bring a plan or a photo. We'll help you specify pieces from the showroom for your space."
      />
    </div>
  );
}
