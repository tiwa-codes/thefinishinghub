import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export type CategoryRow = {
  id: string;
  slug: string;
  name: string;
  parent_id: string | null;
  display_order: number;
};

export type TopLevelWithSubs = CategoryRow & {
  subcategories: CategoryRow[];
};

// Client-safe (browser Supabase client) equivalent of lib/categories.ts's
// getCategoryTree — that one is server-only (react `cache`, createPublicClient)
// and used for public nav/footer rendering. Admin pages run as client
// components against the staff-scoped browser client, so they need their
// own fetch, but the same "group subs under their top-level parent" shape.
export async function fetchCategoryTree(
  supabase: SupabaseClient<Database>,
): Promise<TopLevelWithSubs[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("id, slug, name, parent_id, display_order")
    .order("display_order");

  if (error || !data) return [];

  const topLevel = data.filter((row) => row.parent_id === null);

  return topLevel.map((top) => ({
    ...top,
    subcategories: data
      .filter((row) => row.parent_id === top.id)
      .sort((a, b) => a.display_order - b.display_order),
  }));
}

// Flattened, breadcrumb-labeled list for filter dropdowns and category
// pickers — every category (top-level and sub) is a valid product
// category_id target, so both need to be selectable.
export function flattenCategoryTree(
  tree: TopLevelWithSubs[],
): { id: string; label: string }[] {
  return tree.flatMap((top) => [
    { id: top.id, label: top.name },
    ...top.subcategories.map((sub) => ({
      id: sub.id,
      label: `${top.name} › ${sub.name}`,
    })),
  ]);
}

// A product's category_id may be a top-level id directly (categories
// with no subcategories yet) or a subcategory id — either way, this
// resolves which top-level category page (the one still on the cached
// ISR client, unlike the filter-driven listing pages) could be showing
// this product's price via its Featured pieces section, so admin saves
// know what else needs revalidating besides the product's own PDP.
export function findTopLevelSlugForCategory(
  tree: TopLevelWithSubs[],
  categoryId: string,
): string | null {
  for (const top of tree) {
    if (top.id === categoryId) return top.slug;
    if (top.subcategories.some((sub) => sub.id === categoryId)) return top.slug;
  }
  return null;
}

// Same "resolve up to the top-level parent" lookup as above, returning
// the top-level category's own name — used by /admin/reports to group
// revenue by top-level category regardless of whether a given product is
// filed directly under a top-level category or one of its subcategories.
export function findTopLevelCategoryForId(
  tree: TopLevelWithSubs[],
  categoryId: string | null,
): { id: string; name: string } | null {
  if (!categoryId) return null;
  for (const top of tree) {
    if (top.id === categoryId) return { id: top.id, name: top.name };
    if (top.subcategories.some((sub) => sub.id === categoryId)) {
      return { id: top.id, name: top.name };
    }
  }
  return null;
}
