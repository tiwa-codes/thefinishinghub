export type Category = {
  name: string;
  href: string;
  sub: string;
  placeholderLabel: string;
  image?: string;
};

export const CATEGORIES: Category[] = [
  {
    name: "Tiles & Wall Finishes",
    href: "/tiles-wall-finishes",
    sub: "Porcelain · Marble · Mosaic",
    placeholderLabel: "[ tiles ]",
    image: "/images/category-tiles.jpg",
  },
  {
    name: "Lighting & Automation",
    href: "/lighting",
    sub: "Chandeliers · Pendants · Smart",
    placeholderLabel: "[ lighting ]",
    image: "/images/category-lighting.jpg",
  },
  {
    name: "Sanitaryware & Bath",
    href: "/sanitaryware-bath",
    sub: "Basins · Baths · Showers · Taps",
    placeholderLabel: "[ bathroom ]",
    image: "/images/category-sanitaryware.webp",
  },
  {
    name: "Doors, Windows & Joinery",
    href: "/doors-windows-joinery",
    sub: "Interior · Security · Casement",
    placeholderLabel: "[ doors ]",
    image: "/images/category-doors.webp",
  },
];

export type Project = {
  name: string;
  meta: string;
  placeholderLabel: string;
  image?: string;
};

// image: stock photography, temporary — swap for real project photos
// when available (falls back to PlaceholderBlock in ProjectsGallery if
// the file is ever missing).
export const PROJECTS: Project[] = [
  {
    name: "Maitama Residence",
    meta: "Abuja · 2025",
    placeholderLabel: "[ living room ]",
    image: "/images/project-maitama-living-room.jpg",
  },
  {
    name: "Gudu Duplex",
    meta: "Abuja · 2024",
    placeholderLabel: "[ full interior ]",
    image: "/images/project-gudu-full-interior.jpg",
  },
  {
    name: "Wuse Office Suite",
    meta: "Abuja · 2024",
    placeholderLabel: "[ workspace ]",
    image: "/images/project-wuse-workspace.jpg",
  },
];
