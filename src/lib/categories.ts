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

// Only categories with a real page built get a real href; everything
// else stays "#" until that page exists.
const BUILT_CATEGORY_HREFS: Record<string, string> = {
  furniture: "/furniture",
};

function hrefForSlug(slug: string): string {
  return BUILT_CATEGORY_HREFS[slug] ?? "#";
}

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
    href: hrefForSlug(cat.slug),
    subcategories: rows
      .filter((row) => row.parent_id === cat.id)
      .sort((a, b) => a.display_order - b.display_order)
      .map((sub) => ({
        id: sub.id,
        slug: sub.slug,
        name: sub.name,
        href: hrefForSlug(sub.slug),
      })),
  }));
});
