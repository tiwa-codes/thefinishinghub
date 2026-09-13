// Hardcoded mega-menu content for SiteNav. Subcategory names/slugs mirror
// the real categories table (supabase/migrations/20260913120000_*.sql) —
// a later pass can replace this with a live query without changing the
// shape components consume.
import { hrefForSubcategorySlug } from "@/lib/subcategory-hrefs";

export type MegaMenuLink = { name: string; slug: string; href: string };

function link(name: string, slug: string): MegaMenuLink {
  return { name, slug, href: hrefForSubcategorySlug(slug) };
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
    link("Sofas", "furniture-sofas"),
    link("Beds & Bedroom Sets", "furniture-beds-bedroom-sets"),
    link("Wardrobes & Dressers", "furniture-wardrobes-dressers"),
    link("Dining Tables & Chairs", "furniture-dining-tables-chairs"),
    link("Coffee & Side Tables", "furniture-coffee-side-tables"),
    link("Office Seating", "furniture-office-seating"),
    link("Office Desks & Suites", "furniture-office-desks-suites"),
    link("Conference Tables", "furniture-conference-tables"),
    link("Outdoor Furniture", "furniture-outdoor"),
    link("Accent & Occasional Pieces", "furniture-accent-occasional"),
  ],
  "tiles-wall-finishes": [
    link("Floor Tiles", "tiles-floor"),
    link("Wall Tiles", "tiles-wall"),
    link("Large Format Tiles", "tiles-large-format"),
    link("Mosaic Tiles", "tiles-mosaic"),
    link("Paving & Pavers", "tiles-paving-pavers"),
    link("Trims & Edging", "tiles-trims-edging"),
  ],
  "sanitaryware-bath": [
    link("Showers & Panels", "showers-panels"),
    link("Baths & Jacuzzis", "baths-jacuzzis"),
    link("Toilets & Bidets", "toilets-bidets"),
    link("Basins & Sinks", "sanitary-basins-sinks"),
    link("Vanities", "sanitary-vanities"),
    link("Bathroom Accessories", "sanitary-bathroom-accessories"),
    link("Faucets & Mixers", "sanitary-faucets-mixers"),
    link("Plumbing Accessories", "sanitary-plumbing-accessories"),
  ],
  lighting: [
    link("Indoor Lighting", "lighting-indoor"),
    link("Outdoor Lighting", "lighting-outdoor"),
    link("Chandeliers & Statement Lights", "lighting-chandeliers"),
    link("LED Strip & Mood Lighting", "lighting-led-strip"),
    link("Smart Switches & Automation", "lighting-smart-switches"),
  ],
  "doors-windows-joinery": [
    link("Security Doors", "doors-security"),
    link("Pine Wood Doors", "doors-pine-wood"),
    link("WPC & PVC Doors", "doors-wpc-pvc"),
    link("Glass & Sliding Doors", "doors-glass-sliding"),
    link("Smart Locks & Door Handles", "doors-smart-locks"),
  ],
  kitchens: [
    link("Cabinets & Islands", "kitchens-cabinets-islands"),
    link("Kitchen Faucets & Sinks", "kitchens-faucets-sinks"),
    link("Countertops & Surfaces", "kitchens-countertops"),
    link("Storage & Organizers", "kitchens-storage"),
  ],
  outdoor: [
    link("Garden Furniture", "outdoor-garden-furniture"),
    link("Outdoor Flooring & Paving", "outdoor-flooring-paving"),
    link("Planters & Pots", "outdoor-planters-pots"),
    link("Water Features & Décor", "outdoor-water-features"),
    link("Garden Lighting", "outdoor-garden-lighting"),
  ],
  decor: [
    link("Mirrors", "decor-mirrors"),
    link("Rugs", "decor-rugs"),
    link("Wall Décor", "decor-wall-decor"),
    link("Pillows", "decor-pillows"),
    link("Decorative Objects", "decor-decorative-objects"),
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

export type ResourceColumn = { title: string; links: { name: string; href: string }[] };

export const DESIGN_RESOURCE_COLUMNS: ResourceColumn[] = [
  {
    title: "Discover",
    links: [
      { name: "Style Guides", href: "/resources/style-guides" },
      { name: "Room Inspiration", href: "/resources/room-inspiration" },
    ],
  },
  {
    title: "Buying Guides",
    links: [
      { name: "How to Choose Tiles", href: "/resources/how-to-choose-tiles" },
      { name: "How to Choose Furniture", href: "/resources/how-to-choose-furniture" },
      { name: "How to Choose Sanitaryware", href: "/resources/how-to-choose-sanitaryware" },
    ],
  },
  {
    title: "Care & Installation",
    links: [
      { name: "Care & Maintenance", href: "/resources/care-maintenance" },
      { name: "Installation Guides", href: "/resources/installation-guides" },
    ],
  },
  {
    title: "About",
    links: [
      { name: "About Our Products", href: "/resources/about-our-products" },
      { name: "Our Showroom", href: "/resources/our-showroom" },
    ],
  },
];
