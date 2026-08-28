import Link from "next/link";
import Image from "next/image";
import { PlaceholderBlock } from "@/components/placeholder-block";

export type FeaturedProduct = {
  id: string;
  slug: string;
  name: string;
  categoryLabel: string;
  priceLabel: string;
  requiresQuote: boolean;
  imageUrl: string | null;
  imageAlt: string;
};

export function FeaturedProductsGrid({
  title,
  viewAllHref,
  viewAllLabel,
  products,
}: {
  title: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  products: FeaturedProduct[];
}) {
  return (
    <section className="mx-auto max-w-[1440px] px-5 pb-10 pt-8 lg:px-10 lg:pb-10 lg:pt-[60px]">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4 lg:mb-[34px]">
        <h2 className="font-serif text-xl font-normal text-ink lg:text-[28px]">
          {title}
        </h2>
        {viewAllHref && viewAllLabel && (
          <Link
            href={viewAllHref}
            className="border-b border-gold pb-[3px] text-[13px] font-medium text-forest no-underline"
          >
            {viewAllLabel}
          </Link>
        )}
      </div>

      {products.length === 0 ? (
        <p className="text-sm text-[#8a8073]">
          No published products in this category yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.slug}`}
              className="block text-inherit no-underline"
            >
              <div className="relative mb-4 h-[220px] overflow-hidden bg-[#e2dccf] lg:h-[260px]">
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
              <div className="mb-[7px] font-mono text-[10px] uppercase tracking-[0.12em] text-[#9a8a5c]">
                {product.categoryLabel}
              </div>
              <div className="mb-[5px] font-serif text-lg text-ink">
                {product.name}
              </div>
              <div className="font-serif text-base text-forest">
                {product.requiresQuote ? "Request a Quote" : product.priceLabel}
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
