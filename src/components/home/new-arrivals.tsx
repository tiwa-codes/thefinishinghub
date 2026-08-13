import Image from "next/image";
import Link from "next/link";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { PlaceholderBlock } from "@/components/placeholder-block";
import { publicAssetExists } from "@/lib/public-asset";
import { NEW_ARRIVALS } from "./home-data";

export function NewArrivals() {
  return (
    <section className="bg-[#ebe5db]">
      <div className="mx-auto max-w-[1440px] px-5 py-12 lg:px-10 lg:py-[88px]">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-[14px] text-xs uppercase tracking-[0.2em] text-gold">
              New arrivals
            </div>
            <h2 className="font-serif text-2xl font-normal text-ink lg:text-[32px]">
              Recently added to the floor
            </h2>
          </div>
          <Link
            href="#"
            className="border-b border-gold pb-[3px] text-[13px] font-medium tracking-wide text-forest no-underline"
          >
            View all products
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {NEW_ARRIVALS.map((product) => {
            const hasImage = product.image
              ? publicAssetExists(product.image.replace(/^\//, ""))
              : false;
            return (
              <div
                key={product.name}
                className="block overflow-hidden rounded-[3px] bg-cream"
              >
                <Link href="#" className="block no-underline">
                  <div className="relative h-[260px] overflow-hidden bg-[#e2dccf]">
                    {hasImage && product.image ? (
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        sizes="(min-width: 1024px) 25vw, 50vw"
                        className="object-cover object-[center_58%]"
                      />
                    ) : (
                      <PlaceholderBlock
                        label={product.placeholderLabel}
                        className="absolute inset-0"
                      />
                    )}
                  </div>
                  <div className="px-5 pb-[22px] pt-[18px]">
                    <div className="mb-[7px] text-[11px] uppercase tracking-[0.12em] text-[#9a8a5c]">
                      {product.category}
                    </div>
                    <div className="mb-1 font-serif text-lg leading-tight text-ink">
                      {product.name}
                    </div>
                    <div className="mb-3.5 text-[13px] text-[#6b6155]">
                      {product.spec}
                    </div>
                  </div>
                </Link>
                <div className="flex items-center justify-between px-5 pb-[22px]">
                  <span className="font-serif text-[17px] text-forest">
                    {product.price}
                  </span>
                  <AddToCartButton />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
