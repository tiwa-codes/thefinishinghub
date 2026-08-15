import { CategoryHero } from "./category-hero";
import { SubcategoryTiles, type SubcategoryTile } from "./subcategory-tiles";
import { FeaturedProductsGrid, type FeaturedProduct } from "./featured-products-grid";
import { BookADesignerBand } from "./book-a-designer-band";

export function FurnitureCategoryView({
  subcategories,
  products,
}: {
  subcategories: SubcategoryTile[];
  products: FeaturedProduct[];
}) {
  return (
    <>
      <CategoryHero
        title="Furniture"
        description="Sofas, beds, dining and office pieces — plus bespoke work made to order. Shop by the room you're building."
        imageSrc="/images/editorial-full-room-scene.jpg"
        imageAlt="Furniture"
      />
      <SubcategoryTiles
        title="Shop Furniture by room"
        subcategories={subcategories}
      />
      <FeaturedProductsGrid
        title="Featured pieces from Furniture"
        viewAllHref="#"
        viewAllLabel="View all furniture"
        products={products}
      />
      <BookADesignerBand
        title="Book a designer for your furniture project."
        description="Bring a plan or a photo. We'll help you specify pieces from the showroom, or design bespoke pieces made to order."
      />
    </>
  );
}
