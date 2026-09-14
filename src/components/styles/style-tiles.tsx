import Image from "next/image";
import Link from "next/link";
import { UNSPLASH_BLUR_DATA_URL, unsplashUrl } from "@/lib/unsplash";

// Shared between the homepage's "Find Your Style" section and the /styles
// index page — same tiles, same images, per the /styles page spec ("Do
// not source new images for this page... match the homepage tile image
// exactly"). Image ids match shop-by-style's hero use of the Villa image
// (also reused for the hero Villa slide) and the Contemporary tile.
export const STYLE_TILES = [
  {
    slug: "villa",
    name: "Villa",
    descriptor: "Presidential. Ornate. Built to impress.",
    imageId: "1600210491892-03d54c0aaf87",
  },
  {
    slug: "contemporary",
    name: "Contemporary",
    descriptor: "Minimal. Refined. Made to last.",
    imageId: "1600210492486-724fe5c67fb0",
  },
];

export function StyleTiles() {
  return (
    <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-4 px-5 lg:grid-cols-2 lg:gap-6 lg:px-10">
      {STYLE_TILES.map((tile) => (
        <Link
          key={tile.slug}
          href={`/styles/${tile.slug}`}
          className="group relative block h-[340px] overflow-hidden rounded-[2px] no-underline lg:h-[420px]"
        >
          <Image
            src={unsplashUrl(tile.imageId, 1200)}
            alt={`${tile.name} style interior`}
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            placeholder="blur"
            blurDataURL={UNSPLASH_BLUR_DATA_URL}
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(0deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.25) 55%, rgba(0,0,0,0.05) 80%)",
            }}
          />
          <div className="absolute inset-x-0 bottom-0 p-6 lg:p-9">
            <h3 className="mb-2 font-serif text-3xl text-cream lg:text-[44px]">
              {tile.name}
            </h3>
            <p className="mb-4 text-sm text-cream/85 lg:text-base">
              {tile.descriptor}
            </p>
            <span className="inline-block text-sm font-semibold uppercase tracking-wide text-gold-bright">
              Explore →
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
