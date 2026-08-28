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
