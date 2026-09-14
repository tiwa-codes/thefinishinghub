import Image from "next/image";
import Link from "next/link";
import { UNSPLASH_BLUR_DATA_URL, unsplashUrl } from "@/lib/unsplash";
import { FEATURED_CATEGORIES } from "./home-data";

export function FeaturedCategories() {
  return (
    <section className="bg-cream py-14 lg:py-20">
      <h2 className="text-center font-serif text-2xl font-normal text-ink lg:text-[34px]">
        Shop by Category
      </h2>
      <p className="mx-auto mt-3 max-w-[520px] text-center text-sm text-ink/70 lg:text-base">
        Everything for the home, from foundation to finish.
      </p>

      <div className="mx-auto mt-10 grid max-w-[1200px] grid-cols-1 gap-x-5 gap-y-8 px-5 sm:grid-cols-2 lg:mt-14 lg:grid-cols-4 lg:gap-x-6 lg:px-10">
        {FEATURED_CATEGORIES.map((cat) => (
          <Link
            key={cat.name}
            href={cat.href}
            className="group block no-underline"
          >
            <div className="relative aspect-square overflow-hidden rounded-[2px]">
              <Image
                src={unsplashUrl(cat.imageId, 700)}
                alt={`${cat.name} interior`}
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                placeholder="blur"
                blurDataURL={UNSPLASH_BLUR_DATA_URL}
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
              />
            </div>
            <div className="mt-3 text-center text-[15px] font-medium text-ink group-hover:text-forest">
              {cat.name}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
