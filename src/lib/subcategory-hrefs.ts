// Subcategory listing pages don't follow a predictable slug->path rule
// the way top-level categories do (nesting varies, "furniture-" prefixes
// get dropped for readability), so — unlike top-level — built ones are
// listed explicitly here. Anything not listed stays "#" until it exists.
// Exported so every place that needs a subcategory link (nav, /furniture's
// tiles, product breadcrumbs, the homepage's Shop by Room tiles) reads
// the same single source instead of keeping its own copy that can drift
// out of sync.
//
// Deliberately dependency-free (no React, no Supabase): lib/categories.ts
// pulls in React's cache() at module scope for getCategoryTree(), which
// only resolves inside Next.js's own runtime — importing it from a
// component that Vitest/RTL renders directly (not just server pages)
// crashes with "cache is not a function". Anything that only needs href
// resolution should import from here instead.
export const BUILT_SUBCATEGORY_HREFS: Record<string, string> = {
  "furniture-living": "/furniture/living",
  "furniture-dining": "/furniture/dining",
  "furniture-bedroom": "/furniture/bedroom",
};

export function hrefForSubcategorySlug(slug: string): string {
  return BUILT_SUBCATEGORY_HREFS[slug] ?? "#";
}
