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
          background:
            "linear-gradient(90deg, rgba(7,40,24,0.78), rgba(7,40,24,0.45) 45%, rgba(7,40,24,0.12) 80%)",
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
