import { getCategoryTree } from "@/lib/categories";
import { SiteNav } from "./site-nav";

// Async Server Component: fetches the category tree, then hands it to the
// interactive client SiteNav. Kept separate because RTL/jsdom can't render
// an async Server Component directly (see page.test.tsx).
export async function SiteNavSection() {
  const categories = await getCategoryTree();
  return <SiteNav categories={categories} />;
}
