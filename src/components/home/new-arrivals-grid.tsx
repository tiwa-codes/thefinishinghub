import Image from "next/image";
import Link from "next/link";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { PlaceholderBlock } from "@/components/placeholder-block";

export type NewArrivalProductCard = {
  id: string;
  variantId: string;
  categoryLabel: string;
  name: string;
  spec: string | null;
  priceLabel: string;
  imageUrl: string | null;
  imageAlt: string;
};

// Pure/presentational — takes plain data so it can be unit-tested with
// fixtures. Data fetching lives in NewArrivalsSection (an async Server
// Component), which React Testing Library can't render directly.
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
          className="block overflow-hidden rounded-[3px] bg-cream"
        >
          <Link href="#" className="block no-underline">
            <div className="relative h-[260px] overflow-hidden bg-[#e2dccf]">
              {product.imageUrl ? (
                <Image
                  src={product.imageUrl}
                  alt={product.imageAlt}
                  fill
                  sizes="(min-width: 1024px) 25vw, 50vw"
                  className="object-cover object-[center_58%]"
                />
              ) : (
                <PlaceholderBlock
                  label="[ no photo yet ]"
                  className="absolute inset-0"
                />
              )}
            </div>
            <div className="px-5 pb-[22px] pt-[18px]">
              <div className="mb-[7px] text-[11px] uppercase tracking-[0.12em] text-[#9a8a5c]">
                {product.categoryLabel}
              </div>
              <div className="mb-1 font-serif text-lg leading-tight text-ink">
                {product.name}
              </div>
              {product.spec && (
                <div className="mb-3.5 text-[13px] text-[#6b6155]">
                  {product.spec}
                </div>
              )}
            </div>
          </Link>
          <div className="flex items-center justify-between px-5 pb-[22px]">
            <span className="font-serif text-[17px] text-forest">
              {product.priceLabel}
            </span>
            <AddToCartButton variantId={product.variantId} />
          </div>
        </div>
      ))}
    </div>
  );
}
