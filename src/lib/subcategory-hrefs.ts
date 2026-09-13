// Neither subcategory nor top-level category pages follow a predictable
// slug->path rule reliable enough to build a URL blindly (subcategory
// nesting varies and drops the "furniture-" prefix; a top-level category
// could be renamed or removed without its slug changing in lockstep), so
// built ones — of both kinds — are listed explicitly here. Anything not
// listed stays "#" until it exists, rather than linking to a path that
// might 404. Exported so every place that needs a category link (nav,
// footer, /furniture's tiles, product breadcrumbs, the homepage's Shop by
// Room tiles) reads the same single source instead of keeping its own
// copy that can drift out of sync.
//
// Deliberately dependency-free (no React, no Supabase): lib/categories.ts
// pulls in React's cache() at module scope for getCategoryTree(), which
// only resolves inside Next.js's own runtime — importing it from a
// component that Vitest/RTL renders directly (not just server pages)
// crashes with "cache is not a function". Anything that only needs href
// resolution should import from here instead.
//
// File is named for the subcategory map specifically (the older, more
// heavily-used export) — kept as-is rather than renamed to avoid
// unrelated import churn across nav/footer/category-page/test files.
export const BUILT_SUBCATEGORY_HREFS: Record<string, string> = {
  "furniture-bedroom": "/furniture/bedroom",
  "furniture-sofas": "/furniture/sofas",
  "furniture-beds-bedroom-sets": "/furniture/beds-bedroom-sets",
  "furniture-wardrobes-dressers": "/furniture/wardrobes-dressers",
  "furniture-dining-tables-chairs": "/furniture/dining-tables-chairs",
  "furniture-coffee-side-tables": "/furniture/coffee-side-tables",
  "furniture-office-seating": "/furniture/office-seating",
  "furniture-office-desks-suites": "/furniture/office-desks-suites",
  "furniture-conference-tables": "/furniture/conference-tables",
  "furniture-outdoor": "/furniture/outdoor",
  "furniture-accent-occasional": "/furniture/accent-occasional",
  "showers-panels": "/sanitaryware-bath/shower",
  "baths-jacuzzis": "/sanitaryware-bath/bathtub",
  "toilets-bidets": "/sanitaryware-bath/toilet",
};

export function hrefForSubcategorySlug(slug: string): string {
  return BUILT_SUBCATEGORY_HREFS[slug] ?? "#";
}

// Every top-level category is currently built (all 5), but this stays an
// explicit allowlist rather than `` `/${slug}` `` unconditionally — a
// renamed or removed top-level category then degrades to "#" (a visibly
// dead link, fixable) instead of a live 404 a customer could actually
// click into.
export const BUILT_TOP_LEVEL_HREFS: Record<string, string> = {
  furniture: "/furniture",
  "tiles-wall-finishes": "/tiles-wall-finishes",
  lighting: "/lighting",
  "sanitaryware-bath": "/sanitaryware-bath",
  "doors-windows-joinery": "/doors-windows-joinery",
};

export function hrefForTopLevelSlug(slug: string): string {
  return BUILT_TOP_LEVEL_HREFS[slug] ?? "#";
}
