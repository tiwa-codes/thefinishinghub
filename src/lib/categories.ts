import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";
import { hrefForSubcategorySlug, hrefForTopLevelSlug } from "@/lib/subcategory-hrefs";

export type CategoryNode = {
  id: string;
  slug: string;
  name: string;
  // Short form for the primary nav row specifically — that row has no
  // slack even at the site's widest (1440px); breadcrumbs, page
  // headings, and the footer all keep using `name`. Falls back to
  // `name` for anything without one set (today: every subcategory,
  // since only the 5 top-level categories have a nav_label).
  navLabel: string;
  href: string;
};

export type TopLevelCategory = CategoryNode & {
  subcategories: CategoryNode[];
};

// Re-exported for existing consumers importing from "@/lib/categories" —
// the actual implementation lives in lib/subcategory-hrefs.ts (kept
// dependency-free so it's safe to import from components RTL renders
// directly; see that file for why).
export {
  BUILT_SUBCATEGORY_HREFS,
  hrefForSubcategorySlug,
  BUILT_TOP_LEVEL_HREFS,
  hrefForTopLevelSlug,
} from "@/lib/subcategory-hrefs";

type CategoryRow = {
  id: string;
  slug: string;
  name: string;
  nav_label: string | null;
  parent_id: string | null;
  display_order: number;
};

// React's cache() dedupes this within a single render pass — SiteNav and
// SiteFooter each call it independently, but it only hits Supabase once
// per request.
export const getCategoryTree = cache(async (): Promise<TopLevelCategory[]> => {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, slug, name, nav_label, parent_id, display_order")
    .order("display_order")
    .returns<CategoryRow[]>();

  if (error) {
    console.error("Failed to load categories:", error.message);
    return [];
  }

  const rows = data ?? [];
  const topLevel = rows
    .filter((row) => row.parent_id === null)
    .sort((a, b) => a.display_order - b.display_order);

  return topLevel.map((cat) => ({
    id: cat.id,
    slug: cat.slug,
    name: cat.name,
    navLabel: cat.nav_label ?? cat.name,
    // Explicit allowlist (lib/subcategory-hrefs.ts), same pattern as
    // subcategory hrefs below — a renamed/removed top-level category
    // degrades to "#" instead of a live 404.
    href: hrefForTopLevelSlug(cat.slug),
    subcategories: rows
      .filter((row) => row.parent_id === cat.id)
      .sort((a, b) => a.display_order - b.display_order)
      .map((sub) => ({
        id: sub.id,
        slug: sub.slug,
        name: sub.name,
        navLabel: sub.nav_label ?? sub.name,
        href: hrefForSubcategorySlug(sub.slug),
      })),
  }));
});
