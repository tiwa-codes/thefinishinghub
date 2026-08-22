import { CategoryHero } from "./category-hero";
import { SubcategoryTiles, type SubcategoryTile } from "./subcategory-tiles";
import { FeaturedProductsGrid, type FeaturedProduct } from "./featured-products-grid";
import { BookADesignerBand } from "./book-a-designer-band";

// Shared by every top-level category page. Subcategory tiles only render
// when the category actually has some — Tiles, Lighting and Doors have
// none seeded yet, and an empty section would just be dead space.
export function CategoryView({
  title,
  heroDescription,
  heroImageSrc,
  heroImageAlt,
  subcategoriesTitle,
  subcategories,
  featuredTitle,
  products,
  designerTitle,
  designerDescription,
}: {
  title: string;
  heroDescription: string;
  heroImageSrc?: string;
  heroImageAlt: string;
  subcategoriesTitle?: string;
  subcategories: SubcategoryTile[];
  featuredTitle: string;
  products: FeaturedProduct[];
  designerTitle: string;
  designerDescription: string;
}) {
  return (
    <>
      <CategoryHero
        title={title}
        description={heroDescription}
        imageSrc={heroImageSrc}
        imageAlt={heroImageAlt}
      />
      {subcategories.length > 0 && (
        <SubcategoryTiles
          title={subcategoriesTitle ?? `Shop ${title} by type`}
          subcategories={subcategories}
        />
      )}
      <FeaturedProductsGrid
        title={featuredTitle}
        viewAllHref="#"
        viewAllLabel={`View all ${title.toLowerCase()}`}
        products={products}
      />
      <BookADesignerBand title={designerTitle} description={designerDescription} />
    </>
  );
}
