import Image from "next/image";
import Link from "next/link";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { PlaceholderBlock } from "@/components/placeholder-block";
import { Price } from "@/components/price";

export type NewArrivalProductCard = {
  id: string;
  slug: string;
  variantId: string;
  categoryLabel: string;
  name: string;
  collection: string | null;
  spec: string | null;
  priceKobo: number | null;
  requiresQuote: boolean;
  imageUrl: string | null;
  imageAlt: string;
  secondaryImageUrl: string | null;
  isNew: boolean;
  isBestseller: boolean;
};

// Pure/presentational — takes plain data so it can be unit-tested with
// fixtures. Data fetching lives in NewArrivalsSection (an async Server
// Component), which React Testing Library can't render directly. Also
// used for Related Products on the product detail page — any change here
// applies in both places.
export function NewArrivalsGrid({
  products,
}: {
  products: NewArrivalProductCard[];
}) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {products.map((product) => (
        <div
          key={product.id}
          className="group block overflow-hidden rounded-[3px] bg-cream"
        >
          <Link href={`/products/${product.slug}`} className="block no-underline">
            <div className="relative h-[260px] overflow-hidden bg-[#e2dccf]">
              {product.imageUrl ? (
                <>
                  <Image
                    src={product.imageUrl}
                    alt={product.imageAlt}
                    fill
                    sizes="(min-width: 1024px) 25vw, 50vw"
                    className={`object-cover object-[center_58%] transition-opacity duration-300 ease-in-out ${
                      product.secondaryImageUrl ? "group-hover:opacity-0" : ""
                    }`}
                  />
                  {product.secondaryImageUrl && (
                    <Image
                      src={product.secondaryImageUrl}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 25vw, 50vw"
                      className="absolute inset-0 object-cover object-[center_58%] opacity-0 transition-opacity duration-300 ease-in-out group-hover:opacity-100"
                    />
                  )}
                </>
              ) : (
                <PlaceholderBlock
                  label="[ no photo yet ]"
                  className="absolute inset-0"
                />
              )}

              {product.isBestseller ? (
                <span className="absolute left-3 top-3 z-10 rounded-[2px] bg-forest px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-gold-bright">
                  Bestseller
                </span>
              ) : product.isNew ? (
                <span className="absolute left-3 top-3 z-10 rounded-[2px] bg-gold px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-ink">
                  New
                </span>
              ) : null}
            </div>
            <div className="px-5 pb-[22px] pt-[18px]">
              <div className="mb-1 font-serif text-lg leading-tight text-ink">
                {product.collection || product.name}
              </div>
              <div className="mb-3.5 text-[13px] text-[#6b6155]">
                {product.categoryLabel}
                {product.spec && <span> · {product.spec}</span>}
              </div>
            </div>
          </Link>
          {product.requiresQuote || product.priceKobo == null ? (
            <div className="px-5 pb-[22px] font-serif text-[17px] text-forest">
              Request a Quote
            </div>
          ) : (
            <div className="flex items-center justify-between px-5 pb-[22px]">
              <span className="font-serif text-[17px] text-forest">
                <Price kobo={product.priceKobo} />
              </span>
              <AddToCartButton variantId={product.variantId} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
