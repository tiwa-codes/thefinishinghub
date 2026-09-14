import Image from "next/image";
import Link from "next/link";
import { PlaceholderBlock } from "@/components/placeholder-block";
import { publicAssetExists } from "@/lib/public-asset";

// Restored from the pre-rebuild RoomEditorial component (deleted in
// 4944d09) — that section used this local asset, not an Unsplash image.
const ROOM_IMAGE = "/images/editorial-full-room-scene.jpg";

export function FinishedRoom() {
  const hasImage = publicAssetExists(ROOM_IMAGE.replace(/^\//, ""));

  return (
    <section className="bg-forest text-cream">
      <div className="mx-auto max-w-[1440px] px-5 py-14 lg:px-10 lg:py-20">
        <div className="grid grid-cols-1 overflow-hidden rounded-[3px] lg:grid-cols-2 lg:max-h-[520px]">
          <div className="relative h-[320px] lg:h-[520px]">
            {hasImage ? (
              <Image
                src={ROOM_IMAGE}
                alt="A finished living room with matching tiles, lighting, and furniture"
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover object-[center_38%]"
              />
            ) : (
              <PlaceholderBlock label="[ full room scene ]" tone="dark" className="absolute inset-0" />
            )}
          </div>
          <div className="flex flex-col justify-center bg-deep-forest px-6 py-12 lg:px-14 lg:py-0">
            <div className="mb-5 text-xs uppercase tracking-[0.25em] text-gold-bright">
              THE FINISHED ROOM
            </div>
            <h2 className="mb-6 max-w-[460px] text-balance font-serif text-2xl font-normal leading-[1.2] text-cream lg:text-[30px]">
              A room comes together when the finishes agree.
            </h2>
            <p className="mb-8 max-w-[420px] text-[15px] leading-[1.7] text-cream/75">
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
      </div>
    </section>
  );
}
