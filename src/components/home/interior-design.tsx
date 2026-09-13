import Image from "next/image";
import Link from "next/link";
import { UNSPLASH_BLUR_DATA_URL, unsplashUrl } from "@/lib/unsplash";

export function InteriorDesign() {
  return (
    <section className="bg-forest text-cream">
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-10 px-6 py-14 lg:grid-cols-2 lg:gap-16 lg:px-16 lg:py-24">
        <div className="flex flex-col justify-center">
          <div className="mb-5 text-xs uppercase tracking-[0.25em] text-gold-bright">
            INTERIOR DESIGN
          </div>
          <h2 className="mb-6 max-w-[460px] text-balance font-serif text-2xl font-normal leading-[1.2] text-cream lg:text-[40px]">
            Design services, end to end.
          </h2>
          <p className="mb-8 max-w-[460px] text-[15px] leading-[1.7] text-cream/75 lg:text-base">
            Residential and commercial interiors, from concept and space
            planning through to sourcing, joinery and install. We draw on
            everything in the showroom, and source or commission the rest.
          </p>
          <Link
            href="/interior-design"
            className="inline-block w-fit cursor-pointer rounded-[2px] bg-gold px-7 py-3.5 text-sm font-semibold tracking-wide text-ink no-underline hover:bg-gold-bright"
          >
            Start a project
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="relative aspect-[3/4] overflow-hidden rounded-[2px]">
            <Image
              src={unsplashUrl("1616486338812-3dadae4b4ace", 800)}
              alt="A professionally designed, high-end living room"
              fill
              sizes="(min-width: 1024px) 25vw, 50vw"
              placeholder="blur"
              blurDataURL={UNSPLASH_BLUR_DATA_URL}
              className="object-cover"
            />
          </div>
          <div className="relative mt-8 aspect-[3/4] overflow-hidden rounded-[2px]">
            <Image
              src={unsplashUrl("1503387762-592deb58ef4e", 800)}
              alt="A craftsman drafting an interior design plan"
              fill
              sizes="(min-width: 1024px) 25vw, 50vw"
              placeholder="blur"
              blurDataURL={UNSPLASH_BLUR_DATA_URL}
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
