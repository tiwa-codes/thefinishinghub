import Image from "next/image";
import Link from "next/link";
import { UNSPLASH_BLUR_DATA_URL, unsplashUrl } from "@/lib/unsplash";

export function FinishedRoom() {
  return (
    <section className="bg-forest text-cream">
      <div className="grid grid-cols-1 lg:h-screen lg:grid-cols-2">
        <div className="relative h-[320px] lg:h-full">
          <Image
            src={unsplashUrl("1615529182904-14819c35db37", 1200)}
            alt="A finished living room with matching tiles, lighting, and furniture"
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            placeholder="blur"
            blurDataURL={UNSPLASH_BLUR_DATA_URL}
            className="object-cover"
          />
        </div>
        <div className="flex flex-col justify-center px-6 py-14 lg:px-16 lg:py-0">
          <div className="mb-5 text-xs uppercase tracking-[0.25em] text-gold-bright">
            THE FINISHED ROOM
          </div>
          <h2 className="mb-6 max-w-[460px] text-balance font-serif text-2xl font-normal leading-[1.2] text-cream lg:text-[38px]">
            A room comes together when the finishes agree.
          </h2>
          <p className="mb-8 max-w-[440px] text-[15px] leading-[1.7] text-cream/75 lg:text-base">
            We stock furniture, tiles, lighting, sanitaryware and doors from
            one showroom — so the porcelain, the pendant and the joinery are
            chosen in the same room, against the same light.
          </p>
          <Link
            href="/about"
            className="inline-block w-fit cursor-pointer border-b border-gold pb-1 text-sm font-medium tracking-wide text-gold-bright no-underline hover:text-gold"
          >
            See the approach →
          </Link>
        </div>
      </div>
    </section>
  );
}
