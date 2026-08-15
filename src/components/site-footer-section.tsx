import { getCategoryTree } from "@/lib/categories";
import { SiteFooter } from "./site-footer";

// Async Server Component: fetches the category tree, then hands the
// top-level categories to the presentational SiteFooter. Kept separate
// because RTL/jsdom can't render an async Server Component directly.
export async function SiteFooterSection() {
  const categories = await getCategoryTree();
  return (
    <SiteFooter
      shopCategories={categories.map(({ id, slug, name, href }) => ({
        id,
        slug,
        name,
        href,
      }))}
    />
  );
}
