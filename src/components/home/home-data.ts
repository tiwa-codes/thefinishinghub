export type Category = {
  name: string;
  sub: string;
  placeholderLabel: string;
  image?: string;
};

export const CATEGORIES: Category[] = [
  {
    name: "Tiles & Wall Finishes",
    sub: "Porcelain · Marble · Mosaic",
    placeholderLabel: "[ tiles ]",
    image: "/images/category-tiles.jpg",
  },
  {
    name: "Lighting & Automation",
    sub: "Chandeliers · Pendants · Smart",
    placeholderLabel: "[ lighting ]",
    image: "/images/category-lighting.jpg",
  },
  {
    name: "Sanitaryware & Bath",
    sub: "Basins · Baths · Showers · Taps",
    placeholderLabel: "[ bathroom ]",
  },
  {
    name: "Doors, Windows & Joinery",
    sub: "Interior · Security · Casement",
    placeholderLabel: "[ doors ]",
  },
];

export type Project = {
  name: string;
  meta: string;
  placeholderLabel: string;
};

export const PROJECTS: Project[] = [
  { name: "Maitama Residence", meta: "Abuja · 2025", placeholderLabel: "[ living room ]" },
  { name: "Gudu Duplex", meta: "Abuja · 2024", placeholderLabel: "[ full interior ]" },
  { name: "Wuse Office Suite", meta: "Abuja · 2024", placeholderLabel: "[ workspace ]" },
];
