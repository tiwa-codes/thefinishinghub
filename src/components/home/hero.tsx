import Image from "next/image";
import Link from "next/link";
import { PlaceholderBlock } from "@/components/placeholder-block";
import { publicAssetExists } from "@/lib/public-asset";

export function Hero() {
  const hasHeroImage = publicAssetExists("images/hero-living-room.png");

  return (
    <section className="relative h-[560px] overflow-hidden bg-forest lg:h-[640px]">
      <div className="absolute inset-0">
        {hasHeroImage ? (
          <Image
            src="/images/hero-living-room.png"
            alt="Living room, finished"
            fill
            priority
            sizes="100vw"
            className="object-cover object-[center_42%]"
          />
        ) : (
          <PlaceholderBlock
            label="[ hero — living room scene ]"
            tone="dark"
            className="absolute inset-0"
          />
        )}
      </div>
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, rgba(7,40,24,0.86) 0%, rgba(7,40,24,0.6) 42%, rgba(7,40,24,0.15) 78%, rgba(7,40,24,0.05) 100%)",
        }}
      />
      <div className="relative mx-auto flex h-full max-w-[1440px] items-center px-5 lg:px-10">
        <div className="max-w-[560px]">
          <div className="mb-5 text-xs uppercase tracking-[0.2em] text-gold-bright">
            FURNITURE · FINISHING · INTERIORS
          </div>
          <h1 className="mb-5 text-balance font-serif text-[32px] font-normal leading-[1.15] text-cream lg:text-[52px] lg:leading-[1.08]">
            Furniture, Finishes, and Interiors for the Finished Home.
          </h1>
          <p className="mb-8 max-w-[440px] text-[15px] leading-[1.6] text-[#d7ddd4] lg:text-[17px]">
            Five categories under one roof in Abuja. Delivered nationwide.
          </p>
          <Link
            href="#categories"
            className="inline-block rounded-[2px] bg-gold px-6 py-3.5 text-sm font-semibold tracking-wide text-forest no-underline hover:bg-gold-bright lg:px-[30px] lg:py-[15px]"
          >
            Shop the collection
          </Link>
        </div>
      </div>
    </section>
  );
}
