import Image from "next/image";
import { PlaceholderBlock } from "@/components/placeholder-block";

export function CategoryHero({
  eyebrow = "Category",
  title,
  description,
  imageSrc,
  imageAlt,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  imageSrc?: string;
  imageAlt: string;
}) {
  return (
    <section className="relative h-[380px] overflow-hidden bg-[#0b3221] lg:h-[500px]">
      {imageSrc ? (
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
      ) : (
        <PlaceholderBlock
          label="[ photography coming soon ]"
          tone="dark"
          align="top"
          className="absolute inset-0"
        />
      )}
      <div
        className="absolute inset-0"
        style={{
          // Two layered washes, not one thin left-to-right fade: the old
          // gradient dropped to 12% opacity by 80% width, so a busy photo
          // (tile/bath/door showroom shots aren't calm single-subject
          // scenes like the furniture hero) stayed at near-full contrast
          // across most of its width and visually fought the text instead
          // of sitting behind it. This keeps a legible-on-the-left wash
          // for the copy, never lets the right edge drop below a
          // moderate floor, and adds a second bottom-anchored wash so the
          // text zone specifically sits on calmer ground.
          background:
            "linear-gradient(90deg, rgba(7,40,24,0.88) 0%, rgba(7,40,24,0.6) 42%, rgba(7,40,24,0.42) 100%), linear-gradient(0deg, rgba(7,40,24,0.55) 0%, rgba(7,40,24,0) 55%)",
        }}
      />
      <div className="relative mx-auto flex h-full max-w-[1440px] flex-col justify-end px-5 pb-8 lg:px-10 lg:pb-[52px]">
        <div className="mb-3.5 text-xs uppercase tracking-[0.2em] text-gold-bright">
          {eyebrow}
        </div>
        <h1 className="mb-3.5 font-serif text-[36px] font-normal leading-[1.05] text-cream lg:text-[56px] lg:leading-[1.02]">
          {title}
        </h1>
        <p className="max-w-[520px] text-[15px] leading-[1.6] text-[#d7ddd4] lg:text-base">
          {description}
        </p>
      </div>
    </section>
  );
}
