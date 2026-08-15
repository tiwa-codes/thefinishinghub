import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";

export type CategoryNode = {
  id: string;
  slug: string;
  name: string;
  href: string;
};

export type TopLevelCategory = CategoryNode & {
  subcategories: CategoryNode[];
};

// Subcategory listing pages don't follow a predictable slug->path rule
// the way top-level categories do (nesting varies, "furniture-" prefixes
// get dropped for readability), so — unlike top-level — built ones are
// listed explicitly here. Anything not listed stays "#" until it exists.
const BUILT_SUBCATEGORY_HREFS: Record<string, string> = {
  "furniture-living": "/furniture/living",
};

type CategoryRow = {
  id: string;
  slug: string;
  name: string;
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
    .select("id, slug, name, parent_id, display_order")
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
    // Every top-level category gets a real, predictable path — even one
    // that 404s (no page built yet) is reachable and fixable later; "#"
    // is a permanent dead end a user can't tell apart from a bug.
    href: `/${cat.slug}`,
    subcategories: rows
      .filter((row) => row.parent_id === cat.id)
      .sort((a, b) => a.display_order - b.display_order)
      .map((sub) => ({
        id: sub.id,
        slug: sub.slug,
        name: sub.name,
        href: BUILT_SUBCATEGORY_HREFS[sub.slug] ?? "#",
      })),
  }));
});
