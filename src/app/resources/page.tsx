import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteNavSection } from "@/components/site-nav-section";
import { SiteFooterSection } from "@/components/site-footer-section";
import { UNSPLASH_BLUR_DATA_URL } from "@/lib/unsplash";
import { DESIGN_RESOURCE_TILES, resourceTileImageUrl } from "@/lib/mega-menu-data";

export const metadata: Metadata = {
  title: "Design Resources — The Finishing Hub",
  description: "Guides, inspiration and tools to help you finish your space.",
};

export default function ResourcesPage() {
  return (
    <div className="bg-cream font-sans text-ink antialiased">
      <SiteNavSection />
      <section className="bg-deep-forest px-5 py-16 text-center text-cream lg:py-24">
        <h1 className="font-serif text-3xl lg:text-5xl">Design Resources</h1>
        <p className="mx-auto mt-4 max-w-xl text-cream/80 lg:text-lg">
          Guides, inspiration and tools to help you finish your space.
        </p>
      </section>

      <div className="mx-auto max-w-[1440px] px-5 py-14 lg:px-10 lg:py-20">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {DESIGN_RESOURCE_TILES.map((tile) => (
            <Link key={tile.key} href={tile.href} className="group block no-underline">
              <div className="relative mb-3 aspect-[3/2] w-full overflow-hidden rounded-[2px]">
                <Image
                  src={resourceTileImageUrl(tile)}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 22vw, 45vw"
                  placeholder={tile.imageId ? "blur" : undefined}
                  blurDataURL={tile.imageId ? UNSPLASH_BLUR_DATA_URL : undefined}
                  className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02]"
                />
              </div>
              <div className="mb-1 w-fit border-b border-transparent font-serif text-[17px] text-ink group-hover:border-forest">
                {tile.title}
              </div>
              <div className="text-[13px] text-[#6b6155]">{tile.description}</div>
            </Link>
          ))}
        </div>
      </div>

      <SiteFooterSection />
    </div>
  );
}
