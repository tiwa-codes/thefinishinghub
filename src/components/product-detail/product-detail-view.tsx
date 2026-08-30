import { ListingBreadcrumb, type BreadcrumbCrumb } from "@/components/listing/listing-breadcrumb";
import { FeaturedProductsGrid, type FeaturedProduct } from "@/components/category/featured-products-grid";
import { ProductGallery, type GalleryImage } from "./product-gallery";
import { ProductPurchasePanel } from "./product-purchase-panel";
import type { ProductVariantOption } from "./variant-picker";
import { Price } from "@/components/price";

// Generic store policy, not per-product — the source design's specific
// "5 working days / 6–8 weeks" numbers were about bed upholstery
// specifically, and this view now serves every category, so those exact
// figures don't carry over honestly to e.g. tiles or lighting.
const DELIVERY_NOTE =
  "Delivered nationwide. In-stock pieces ship from the Abuja showroom; made-to-order pieces may take longer — ask in showroom for lead times.";

export function ProductDetailView({
  productId,
  breadcrumb,
  categoryPath,
  name,
  priceKobo,
  requiresQuote,
  description,
  images,
  variants,
  defaultVariantId,
  complements,
}: {
  productId: string;
  breadcrumb: BreadcrumbCrumb[];
  categoryPath: string;
  name: string;
  priceKobo: number | null;
  requiresQuote: boolean;
  description: string;
  images: GalleryImage[];
  variants: ProductVariantOption[];
  defaultVariantId: string;
  complements: FeaturedProduct[];
}) {
  return (
    <>
      <section className="mx-auto max-w-[1440px] px-5 pt-6 lg:px-10 lg:pt-8">
        <ListingBreadcrumb crumbs={breadcrumb} />
      </section>

      <section className="mx-auto grid max-w-[1440px] grid-cols-1 gap-10 px-5 pt-4 lg:grid-cols-[1.25fr_1fr] lg:gap-16 lg:px-10 lg:pt-[30px]">
        <ProductGallery images={images} productName={name} />

        <div className="pt-1">
          {categoryPath && (
            <div className="mb-3.5 font-mono text-[11px] uppercase tracking-[0.14em] text-[#9a8a5c]">
              {categoryPath}
            </div>
          )}
          <h1 className="mb-3 font-serif text-3xl font-normal leading-[1.1] text-ink lg:text-4xl">
            {name}
          </h1>
          <div className="mb-[22px] font-serif text-2xl text-forest">
            {requiresQuote || priceKobo == null ? (
              "Request a Quote"
            ) : (
              <Price kobo={priceKobo} />
            )}
          </div>
          {description && (
            <p className="mb-7 max-w-[520px] text-[15px] leading-[1.7] text-[#4a4339]">
              {description}
            </p>
          )}

          <ProductPurchasePanel
            productId={productId}
            variants={variants}
            defaultVariantId={defaultVariantId}
            requiresQuote={requiresQuote}
          />

          <p className="border-t border-[#ddd5c4] pt-6 text-[14px] leading-[1.7] text-[#4a4339]">
            {DELIVERY_NOTE}
          </p>
        </div>
      </section>

      <FeaturedProductsGrid title="Complete the room" products={complements} />
    </>
  );
}
