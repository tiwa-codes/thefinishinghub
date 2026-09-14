import Image from "next/image";
import Link from "next/link";
import { PlaceholderBlock } from "@/components/placeholder-block";
import { Price } from "@/components/price";

export type StyleProductCard = {
  id: string;
  slug: string;
  name: string;
  categoryLabel: string;
  priceKobo: number | null;
  imageUrl: string | null;
  imageAlt: string;
};

// Same card visual language as NewArrivalsGrid (home/new-arrivals-grid.tsx)
// — deliberately a separate, simpler component rather than reusing that
// one directly: no add-to-cart button here (style pages don't select a
// variant), and price falls back to "Price on request" rather than
// branching on requires_quote (the /styles spec only asks for a null
// price_kobo check).
export function StyleProductGrid({ products }: { products: StyleProductCard[] }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {products.map((product) => (
        <Link
          key={product.id}
          href={`/products/${product.slug}`}
          className="block overflow-hidden rounded-[3px] bg-cream no-underline"
        >
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
              <PlaceholderBlock label="[ no photo yet ]" className="absolute inset-0" />
            )}
          </div>
          <div className="px-5 pb-[22px] pt-[18px]">
            <div className="mb-[7px] text-[11px] uppercase tracking-[0.12em] text-[#9a8a5c]">
              {product.categoryLabel}
            </div>
            <div className="mb-3 font-serif text-lg leading-tight text-ink">
              {product.name}
            </div>
            {product.priceKobo == null ? (
              <span className="font-serif text-[17px] text-forest">Price on request</span>
            ) : (
              <Price kobo={product.priceKobo} className="font-serif text-[17px] text-forest" />
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
