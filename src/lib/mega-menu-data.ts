// Hardcoded mega-menu content for SiteNav. Subcategory names/slugs mirror
// the real categories table (supabase/migrations/20260913120000_*.sql) —
// a later pass can replace this with a live query without changing the
// shape components consume.
import { hrefForSubcategorySlug } from "@/lib/subcategory-hrefs";
import { unsplashUrl } from "@/lib/unsplash";

export type MegaMenuLink = { name: string; slug: string; href: string };

function link(topLevelSlug: string, name: string, slug: string): MegaMenuLink {
  return { name, slug, href: hrefForSubcategorySlug(topLevelSlug, slug) };
}

// Left-zone nav order — deliberately not the categories table's
// display_order (Sanitarywares sits before Lighting here, unlike the DB).
export const NAV_CATEGORY_ORDER = [
  "furniture",
  "tiles-wall-finishes",
  "sanitaryware-bath",
  "lighting",
  "doors-windows-joinery",
  "kitchens",
  "outdoor",
  "decor",
];

export const MEGA_MENU_SUBCATEGORIES: Record<string, MegaMenuLink[]> = {
  furniture: [
    link("furniture", "Sofas", "furniture-sofas"),
    link("furniture", "Beds & Bedroom Sets", "furniture-beds-bedroom-sets"),
    link("furniture", "Wardrobes & Dressers", "furniture-wardrobes-dressers"),
    link("furniture", "Dining Tables & Chairs", "furniture-dining-tables-chairs"),
    link("furniture", "Coffee & Side Tables", "furniture-coffee-side-tables"),
    link("furniture", "Office Seating", "furniture-office-seating"),
    link("furniture", "Office Desks & Suites", "furniture-office-desks-suites"),
    link("furniture", "Conference Tables", "furniture-conference-tables"),
    link("furniture", "Outdoor Furniture", "furniture-outdoor"),
    link("furniture", "Accent & Occasional Pieces", "furniture-accent-occasional"),
  ],
  "tiles-wall-finishes": [
    link("tiles-wall-finishes", "Floor Tiles", "tiles-floor"),
    link("tiles-wall-finishes", "Wall Tiles", "tiles-wall"),
    link("tiles-wall-finishes", "Large Format Tiles", "tiles-large-format"),
    link("tiles-wall-finishes", "Mosaic Tiles", "tiles-mosaic"),
    link("tiles-wall-finishes", "Paving & Pavers", "tiles-paving-pavers"),
    link("tiles-wall-finishes", "Trims & Edging", "tiles-trims-edging"),
  ],
  "sanitaryware-bath": [
    link("sanitaryware-bath", "Showers & Panels", "showers-panels"),
    link("sanitaryware-bath", "Baths & Jacuzzis", "baths-jacuzzis"),
    link("sanitaryware-bath", "Toilets & Bidets", "toilets-bidets"),
    link("sanitaryware-bath", "Basins & Sinks", "sanitary-basins-sinks"),
    link("sanitaryware-bath", "Vanities", "sanitary-vanities"),
    link("sanitaryware-bath", "Bathroom Accessories", "sanitary-bathroom-accessories"),
    link("sanitaryware-bath", "Faucets & Mixers", "sanitary-faucets-mixers"),
    link("sanitaryware-bath", "Plumbing Accessories", "sanitary-plumbing-accessories"),
  ],
  lighting: [
    link("lighting", "Indoor Lighting", "lighting-indoor"),
    link("lighting", "Outdoor Lighting", "lighting-outdoor"),
    link("lighting", "Chandeliers & Statement Lights", "lighting-chandeliers"),
    link("lighting", "LED Strip & Mood Lighting", "lighting-led-strip"),
    link("lighting", "Smart Switches & Automation", "lighting-smart-switches"),
  ],
  "doors-windows-joinery": [
    link("doors-windows-joinery", "Security Doors", "doors-security"),
    link("doors-windows-joinery", "Pine Wood Doors", "doors-pine-wood"),
    link("doors-windows-joinery", "WPC & PVC Doors", "doors-wpc-pvc"),
    link("doors-windows-joinery", "Glass & Sliding Doors", "doors-glass-sliding"),
    link("doors-windows-joinery", "Smart Locks & Door Handles", "doors-smart-locks"),
  ],
  kitchens: [
    link("kitchens", "Cabinets & Islands", "kitchens-cabinets-islands"),
    link("kitchens", "Kitchen Faucets & Sinks", "kitchens-faucets-sinks"),
    link("kitchens", "Countertops & Surfaces", "kitchens-countertops"),
    link("kitchens", "Storage & Organizers", "kitchens-storage"),
  ],
  outdoor: [
    link("outdoor", "Garden Furniture", "outdoor-garden-furniture"),
    link("outdoor", "Outdoor Flooring & Paving", "outdoor-flooring-paving"),
    link("outdoor", "Planters & Pots", "outdoor-planters-pots"),
    link("outdoor", "Water Features & Décor", "outdoor-water-features"),
    link("outdoor", "Garden Lighting", "outdoor-garden-lighting"),
  ],
  decor: [
    link("decor", "Mirrors", "decor-mirrors"),
    link("decor", "Rugs", "decor-rugs"),
    link("decor", "Wall Décor", "decor-wall-decor"),
    link("decor", "Pillows", "decor-pillows"),
    link("decor", "Decorative Objects", "decor-decorative-objects"),
  ],
};

export type ShopBySpace = {
  name: string;
  slug: string;
  description: string;
};

export const SHOP_BY_SPACE: ShopBySpace[] = [
  { name: "Bathroom", slug: "bathroom", description: "Fixtures, finishes and fittings for the bath." },
  { name: "Kitchen & Dining", slug: "kitchen-dining", description: "Cabinetry, tables and surfaces for cooking and hosting." },
  { name: "Living Room", slug: "living-room", description: "Sofas, seating and the pieces that anchor a room." },
  { name: "Bedroom", slug: "bedroom", description: "Beds, storage and quiet-hour essentials." },
  { name: "Office", slug: "office", description: "Desks, seating and suites for focused work." },
  { name: "Outdoor", slug: "outdoor", description: "Garden furniture, lighting and paving." },
];

export type ShopByStyle = { name: string; slug: string };

export const SHOP_BY_STYLE: ShopByStyle[] = [
  { name: "Villa", slug: "villa" },
  { name: "Contemporary", slug: "contemporary" },
];

export type ResourceTile = {
  key: string;
  title: string;
  description: string;
  href: string;
  imageSrc?: string;
  imageId?: string;
};

// Replaces the old 4-column text layout with 4 editorial image tiles
// (Edward Martin pattern). Trade Program's image was sourced fresh for
// this ("luxury office meeting room") and verified by direct fetch before
// use; the rest reuse ids already vetted elsewhere in this codebase.
export const DESIGN_RESOURCE_TILES: ResourceTile[] = [
  {
    key: "gallery",
    title: "Gallery",
    description: "Room scenes and project inspiration",
    href: "/gallery",
    imageSrc: "/images/editorial-full-room-scene.jpg",
  },
  {
    key: "interior-design",
    title: "Design Services",
    description: "From first idea to finished space",
    href: "/interior-design",
    imageId: "1616486338812-3dadae4b4ace",
  },
  {
    key: "showroom",
    title: "Our Showroom",
    description: "See every piece in person in Abuja",
    href: "/#showroom",
    imageId: "1621293954908-907159247fc8",
  },
  {
    key: "trade",
    title: "Trade Program",
    description: "Members-only pricing for professionals",
    href: "/trade/apply",
    imageId: "1517502884422-41eaead166d4",
  },
];

export function resourceTileImageUrl(tile: ResourceTile): string {
  return tile.imageSrc ?? unsplashUrl(tile.imageId!, 500);
}
