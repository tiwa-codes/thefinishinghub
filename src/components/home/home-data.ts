import { hrefForTopLevelSlug } from "@/lib/subcategory-hrefs";

export type FeaturedCategory = {
  name: string;
  href: string;
  imageId: string;
};

// hrefForTopLevelSlug falls back to "#" for a category with no built page
// yet (kitchens/outdoor/decor — categories-table rows only, no route)
// rather than linking to a path that would 404. See lib/subcategory-hrefs.ts.
export const FEATURED_CATEGORIES: FeaturedCategory[] = [
  { name: "Furniture", href: hrefForTopLevelSlug("furniture"), imageId: "1615529182904-14819c35db37" },
  { name: "Tiles", href: hrefForTopLevelSlug("tiles-wall-finishes"), imageId: "1584622650111-993a426fbf0a" },
  { name: "Sanitarywares", href: hrefForTopLevelSlug("sanitaryware-bath"), imageId: "1600566752355-35792bedcfea" },
  { name: "Lighting", href: hrefForTopLevelSlug("lighting"), imageId: "1524758631624-e2822e304c36" },
  { name: "Doors", href: hrefForTopLevelSlug("doors-windows-joinery"), imageId: "1600607687920-4e2a09cf159d" },
  { name: "Kitchens", href: hrefForTopLevelSlug("kitchens"), imageId: "1484154218962-a197022b5858" },
  { name: "Outdoor", href: hrefForTopLevelSlug("outdoor"), imageId: "1600210492493-0946911123ea" },
  { name: "Decor", href: hrefForTopLevelSlug("decor"), imageId: "1600166898405-da9535204843" },
];
