// Subcategory slugs in the categories table were seeded inconsistently —
// some carry a redundant top-level prefix (furniture-sofas, tiles-floor,
// sanitary-basins-sinks), others already read clean (showers-panels,
// baths-jacuzzis, toilets-bidets). Rather than rename the stored slugs
// (a live-data migration touching every product-catalog subcategory),
// this maps each one to the clean, human-typeable URL segment the
// /[categorySlug]/[subcategorySlug] route actually uses — a bidirectional
// lookup table, same "explicit list, no blind rule" spirit as the
// original href allowlist this file used to hold.
//
// Every subcategory in the catalog is listed here — the dynamic
// subcategory route (src/app/[categorySlug]/[subcategorySlug]/page.tsx)
// covers all of them now, so nothing needs to degrade to "#" anymore.
//
// Deliberately dependency-free (no React, no Supabase): lib/categories.ts
// pulls in React's cache() at module scope for getCategoryTree(), which
// only resolves inside Next.js's own runtime — importing it from a
// component that Vitest/RTL renders directly (not just server pages)
// crashes with "cache is not a function". Anything that only needs href
// resolution should import from here instead.
export const CLEAN_TO_REAL_SUBCATEGORY_SLUG: Record<string, string> = {
  sofas: "furniture-sofas",
  "beds-bedroom-sets": "furniture-beds-bedroom-sets",
  "wardrobes-dressers": "furniture-wardrobes-dressers",
  "dining-tables-chairs": "furniture-dining-tables-chairs",
  "coffee-side-tables": "furniture-coffee-side-tables",
  "office-seating": "furniture-office-seating",
  "office-desks-suites": "furniture-office-desks-suites",
  "conference-tables": "furniture-conference-tables",
  "outdoor-furniture": "furniture-outdoor",
  "accent-occasional": "furniture-accent-occasional",

  "floor-tiles": "tiles-floor",
  "wall-tiles": "tiles-wall",
  "large-format-tiles": "tiles-large-format",
  "mosaic-tiles": "tiles-mosaic",
  "paving-pavers": "tiles-paving-pavers",
  "trims-edging": "tiles-trims-edging",

  "basins-sinks": "sanitary-basins-sinks",
  vanities: "sanitary-vanities",
  "bathroom-accessories": "sanitary-bathroom-accessories",
  "faucets-mixers": "sanitary-faucets-mixers",
  "plumbing-accessories": "sanitary-plumbing-accessories",
  "showers-panels": "showers-panels",
  "baths-jacuzzis": "baths-jacuzzis",
  "toilets-bidets": "toilets-bidets",

  "security-doors": "doors-security",
  "pine-wood-doors": "doors-pine-wood",
  "wpc-pvc-doors": "doors-wpc-pvc",
  "glass-sliding-doors": "doors-glass-sliding",
  "smart-locks-door-handles": "doors-smart-locks",

  "indoor-lighting": "lighting-indoor",
  "outdoor-lighting": "lighting-outdoor",
  "chandeliers-statement-lights": "lighting-chandeliers",
  "led-strip-mood-lighting": "lighting-led-strip",
  "smart-switches-automation": "lighting-smart-switches",

  "cabinets-islands": "kitchens-cabinets-islands",
  "kitchen-faucets-sinks": "kitchens-faucets-sinks",
  "countertops-surfaces": "kitchens-countertops",
  "storage-organizers": "kitchens-storage",

  "garden-furniture": "outdoor-garden-furniture",
  "outdoor-flooring-paving": "outdoor-flooring-paving",
  "planters-pots": "outdoor-planters-pots",
  "water-features-decor": "outdoor-water-features",
  "garden-lighting": "outdoor-garden-lighting",

  mirrors: "decor-mirrors",
  rugs: "decor-rugs",
  "wall-decor": "decor-wall-decor",
  pillows: "decor-pillows",
  "decorative-objects": "decor-decorative-objects",
};

const REAL_TO_CLEAN_SUBCATEGORY_SLUG: Record<string, string> = Object.fromEntries(
  Object.entries(CLEAN_TO_REAL_SUBCATEGORY_SLUG).map(([clean, real]) => [real, clean]),
);

// DB row -> URL segment. Falls back to the stored slug itself for
// anything not in the table above (there shouldn't be any, but a new
// subcategory added straight in the DB should still get a working link
// rather than silently degrading to "#").
export function cleanSubcategorySlug(realSlug: string): string {
  return REAL_TO_CLEAN_SUBCATEGORY_SLUG[realSlug] ?? realSlug;
}

// URL segment -> DB row. Same fallback reasoning in reverse, for resolving
// an incoming request.
export function realSubcategorySlug(cleanSlug: string): string {
  return CLEAN_TO_REAL_SUBCATEGORY_SLUG[cleanSlug] ?? cleanSlug;
}

export function hrefForSubcategorySlug(topLevelSlug: string, realSlug: string): string {
  return `/${topLevelSlug}/${cleanSubcategorySlug(realSlug)}`;
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
