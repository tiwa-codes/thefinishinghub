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

export type Product = {
  category: string;
  name: string;
  spec: string;
  price: string;
  placeholderLabel: string;
  image?: string;
};

export const NEW_ARRIVALS: Product[] = [
  {
    category: "Bedroom",
    name: "Kano Upholstered Storage Bed",
    spec: "Faux leather, gas-lift storage",
    price: "From ₦540,000",
    placeholderLabel: "[ bed ]",
    image: "/images/bed-taupe.jpg",
  },
  {
    category: "Bedroom",
    name: "Asaba Wingback Bed",
    spec: "Channel-tufted headboard",
    price: "From ₦610,000",
    placeholderLabel: "[ bed ]",
    image: "/images/bed-grey-wing.jpg",
  },
  {
    category: "Lighting",
    name: "Gudu Brass Pendant",
    spec: "Aged brass, dimmable",
    price: "₦145,000",
    placeholderLabel: "[ pendant ]",
  },
  {
    category: "Tiles",
    name: "Carrara Porcelain, 60×120",
    spec: "Matt, per m²",
    price: "₦18,500",
    placeholderLabel: "[ tile ]",
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
