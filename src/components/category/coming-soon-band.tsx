import Link from "next/link";

const SHOWROOM_PHONE_TEL = "tel:+2348033117302";
const SHOWROOM_PHONE_DISPLAY = "+234 (0) 803 311 7302";

// Shown in place of the featured-products grid for a top-level category
// with zero published products yet (Kitchens, Outdoor, Decor) — a plain
// "no products yet" line reads as broken; this makes clear it's a real,
// upcoming part of the catalog rather than a dead page.
export function ComingSoonBand({ categoryName }: { categoryName: string }) {
  return (
    <section className="mx-auto max-w-[1440px] px-5 py-16 text-center lg:px-10 lg:py-24">
      <h2 className="mb-4 font-serif text-2xl font-normal text-ink lg:text-[32px]">
        Coming Soon
      </h2>
      <p className="mx-auto mb-8 max-w-[520px] text-[15px] leading-[1.7] text-[#6b6155]">
        We&apos;re adding {categoryName} to our showroom. Visit us in person or
        get in touch — we may already have what you&apos;re looking for.
      </p>
      <div className="flex flex-wrap justify-center gap-3.5">
        <Link
          href="/#showroom"
          className="rounded-[2px] bg-gold px-7 py-[15px] text-sm font-semibold tracking-wide text-forest no-underline hover:bg-gold-bright"
        >
          Visit the Showroom
        </Link>
        <Link
          href={SHOWROOM_PHONE_TEL}
          className="rounded-[2px] border border-forest px-7 py-[15px] text-sm font-semibold tracking-wide text-forest no-underline hover:bg-forest hover:text-cream"
        >
          Call us — {SHOWROOM_PHONE_DISPLAY}
        </Link>
      </div>
    </section>
  );
}
