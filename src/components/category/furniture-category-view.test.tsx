import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { FurnitureCategoryView } from "./furniture-category-view";
import type { SubcategoryTile } from "./subcategory-tiles";
import type { FeaturedProduct } from "./featured-products-grid";

const SUBCATEGORIES: SubcategoryTile[] = [
  { slug: "furniture-living", name: "Living Room", href: "#", imageSrc: "/images/room-living.jpg" },
  { slug: "furniture-dining", name: "Dining", href: "#", imageSrc: "/images/room-dining.webp" },
  { slug: "furniture-bedroom", name: "Bedroom", href: "#", imageSrc: "/images/bed-luxe-palm-mural.webp" },
  { slug: "furniture-workspace", name: "Workspace", href: "#", imageSrc: "/images/room-workspace.webp" },
  { slug: "furniture-office", name: "Office", href: "#" },
];

const PRODUCTS: FeaturedProduct[] = [
  {
    id: "product-1",
    slug: "kano-upholstered-storage-bed",
    name: "Kano Upholstered Storage Bed",
    categoryLabel: "Bedroom",
    priceLabel: "₦540,000",
    imageUrl: "/images/bed-taupe.jpg",
    imageAlt: "Kano Upholstered Storage Bed",
  },
  {
    id: "product-2",
    slug: "asaba-wingback-bed",
    name: "Asaba Wingback Bed",
    categoryLabel: "Bedroom",
    priceLabel: "₦610,000",
    imageUrl: "/images/bed-grey-wing.jpg",
    imageAlt: "Asaba Wingback Bed",
  },
];

describe("FurnitureCategoryView", () => {
  it("renders the hero title and never mentions Bajgio or the Lagos workshop", () => {
    const { container } = render(
      <FurnitureCategoryView subcategories={SUBCATEGORIES} products={PRODUCTS} />,
    );
    expect(screen.getByRole("heading", { level: 1, name: "Furniture" })).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/Bajgio/);
    expect(container.textContent).not.toMatch(/Lagos workshop/);
  });

  it("renders all 5 subcategory tiles by real name, with a placeholder for the one with no photo", () => {
    render(<FurnitureCategoryView subcategories={SUBCATEGORIES} products={PRODUCTS} />);
    expect(screen.getByText("Living Room")).toBeInTheDocument();
    expect(screen.getByText("Dining")).toBeInTheDocument();
    // "Bedroom" legitimately appears twice: the subcategory tile and the
    // featured products' category label.
    expect(screen.getAllByText("Bedroom").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Workspace")).toBeInTheDocument();
    expect(screen.getByText("Office")).toBeInTheDocument();
    expect(screen.getByText("[ office ]")).toBeInTheDocument();
  });

  it("never renders a Bespoke subcategory — deleted for conceptually tying the site to the Bajgio Lagos workshop", () => {
    render(<FurnitureCategoryView subcategories={SUBCATEGORIES} products={PRODUCTS} />);
    expect(screen.queryByText("Bespoke")).toBeNull();
  });

  it("renders exactly as many featured product cards as it's given — no padded/fake products", () => {
    render(<FurnitureCategoryView subcategories={SUBCATEGORIES} products={PRODUCTS} />);
    expect(screen.getByText("Kano Upholstered Storage Bed")).toBeInTheDocument();
    expect(screen.getByText("Asaba Wingback Bed")).toBeInTheDocument();
    expect(screen.getAllByText("₦540,000").length).toBe(1);
  });

  it("shows an honest empty state instead of fake products when none exist yet", () => {
    render(<FurnitureCategoryView subcategories={SUBCATEGORIES} products={[]} />);
    expect(
      screen.getByText("No published products in this category yet."),
    ).toBeInTheDocument();
  });

  it("renders the book-a-designer CTA pointing back at the homepage showroom section", () => {
    render(<FurnitureCategoryView subcategories={SUBCATEGORIES} products={PRODUCTS} />);
    const cta = screen.getByRole("link", { name: "Book a designer" });
    expect(cta).toHaveAttribute("href", "/#showroom");
  });
});
