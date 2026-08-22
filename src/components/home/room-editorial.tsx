import Image from "next/image";
import Link from "next/link";
import { PlaceholderBlock } from "@/components/placeholder-block";
import { publicAssetExists } from "@/lib/public-asset";

export function RoomEditorial() {
  const hasImage = publicAssetExists("images/editorial-full-room-scene.jpg");

  return (
    <section className="mx-auto max-w-[1440px] px-5 py-14 lg:px-10 lg:py-24">
      <div className="grid grid-cols-1 items-stretch overflow-hidden rounded-[3px] lg:grid-cols-[1.4fr_1fr]">
        <div className="relative h-[280px] bg-[#e2dccf] lg:h-auto lg:min-h-[480px]">
          {hasImage ? (
            <Image
              src="/images/editorial-full-room-scene.jpg"
              alt="The finished room"
              fill
              sizes="(min-width: 1024px) 56vw, 100vw"
              className="object-cover object-[center_38%]"
            />
          ) : (
            <PlaceholderBlock label="[ full room scene ]" className="absolute inset-0" />
          )}
        </div>
        <div className="flex flex-col justify-center bg-deep-forest px-6 py-10 text-[#e6ede6] lg:px-14 lg:py-16">
          <div className="mb-5 text-xs uppercase tracking-[0.2em] text-gold-bright">
            The finished room
          </div>
          <h2 className="mb-5 font-serif text-2xl font-normal leading-[1.2] text-cream lg:text-[30px]">
            A room comes together when the finishes agree.
          </h2>
          <p className="mb-7 text-[15.5px] leading-[1.7] text-[#c6cfc4]">
            We stock furniture, tiles, lighting, sanitaryware and doors from
            one showroom — so the porcelain, the pendant and the joinery are
            chosen in the same room, against the same light.
          </p>
          <Link
            href="/#design-services"
            className="self-start border-b border-gold pb-[3px] text-sm font-medium tracking-wide text-gold-bright no-underline"
          >
            See the approach
          </Link>
        </div>
      </div>
    </section>
  );
}
