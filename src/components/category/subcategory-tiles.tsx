import Link from "next/link";
import Image from "next/image";
import { PlaceholderBlock } from "@/components/placeholder-block";

export type SubcategoryTile = {
  slug: string;
  name: string;
  href: string;
  imageSrc?: string;
};

export function SubcategoryTiles({
  title,
  subcategories,
}: {
  title: string;
  subcategories: SubcategoryTile[];
}) {
  return (
    <section className="mx-auto max-w-[1440px] px-5 pb-10 pt-14 lg:px-10 lg:pb-10 lg:pt-[84px]">
      <h2 className="mb-8 font-serif text-2xl font-normal text-ink lg:mb-9 lg:text-[30px]">
        {title}
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-[22px]">
        {subcategories.map((subcat) => (
          <Link
            key={subcat.slug}
            href={subcat.href}
            className="relative block h-[260px] overflow-hidden bg-[#e2dccf] no-underline lg:h-[340px]"
          >
            {subcat.imageSrc ? (
              <Image
                src={subcat.imageSrc}
                alt={subcat.name}
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover"
              />
            ) : (
              <PlaceholderBlock
                label={`[ ${subcat.name.toLowerCase()} ]`}
                className="absolute inset-0"
              />
            )}
            <span
              className="absolute bottom-[22px] left-[26px] font-serif text-xl text-cream lg:text-2xl"
              style={{ textShadow: "0 1px 12px rgba(7,40,24,0.6)" }}
            >
              {subcat.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
