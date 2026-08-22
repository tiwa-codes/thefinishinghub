import Image from "next/image";
import Link from "next/link";
import { PlaceholderBlock } from "@/components/placeholder-block";
import { publicAssetExists } from "@/lib/public-asset";
import { CATEGORIES } from "./home-data";

export function ShopByCategory() {
  const hasFurnitureImage = publicAssetExists("images/category-furniture.jpg");

  return (
    <section id="categories" className="mx-auto max-w-[1440px] px-5 pb-16 pt-14 lg:px-10 lg:pb-24 lg:pt-[84px]">
      <div className="mb-11 max-w-[560px]">
        <div className="mb-[14px] text-xs uppercase tracking-[0.2em] text-gold">
          Shop by category
        </div>
        <h2 className="font-serif text-2xl font-normal leading-[1.15] text-ink lg:text-[34px]">
          Everything we sell, arranged the way you&apos;d build a room.
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:grid-rows-[300px_300px] lg:gap-5">
        <Link
          href="/furniture"
          className="relative h-[280px] overflow-hidden rounded-[3px] bg-[#ebe5db] no-underline lg:col-span-2 lg:row-span-2 lg:h-auto"
        >
          {hasFurnitureImage ? (
            <Image
              src="/images/category-furniture.jpg"
              alt="Furniture & Furnishings"
              fill
              sizes="(min-width: 1024px) 66vw, 100vw"
              className="object-cover object-[center_62%]"
            />
          ) : (
            <PlaceholderBlock label="[ furniture ]" className="absolute inset-0" />
          )}
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to top, rgba(7,40,24,0.6), transparent 55%)" }}
          />
          <div className="absolute bottom-[26px] left-7">
            <div className="font-serif text-[26px] leading-[1.1] text-cream">
              Furniture &amp; Furnishings
            </div>
            <div className="mt-1.5 text-[13px] tracking-wide text-gold-bright">
              Sofas · Beds · Dining · Office
            </div>
          </div>
        </Link>

        {CATEGORIES.map((cat) => {
          const hasImage = cat.image ? publicAssetExists(cat.image.replace(/^\//, "")) : false;
          return (
            <Link
              key={cat.name}
              href={cat.href}
              className="relative h-[220px] overflow-hidden rounded-[3px] bg-[#ebe5db] no-underline lg:h-auto"
            >
              {hasImage && cat.image ? (
                <Image
                  src={cat.image}
                  alt={cat.name}
                  fill
                  sizes="(min-width: 1024px) 33vw, 100vw"
                  className="object-cover"
                />
              ) : (
                <PlaceholderBlock label={cat.placeholderLabel} className="absolute inset-0" />
              )}
              <div
                className="absolute inset-0"
                style={{ background: "linear-gradient(to top, rgba(7,40,24,0.58), transparent 52%)" }}
              />
              <div className="absolute bottom-[18px] left-5 right-5">
                <div className="font-serif text-[19px] leading-[1.15] text-cream">
                  {cat.name}
                </div>
                <div className="mt-[5px] text-xs text-[#cbd2c8]">{cat.sub}</div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
