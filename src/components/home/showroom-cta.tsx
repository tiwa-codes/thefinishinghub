import Image from "next/image";
import Link from "next/link";
import { UNSPLASH_BLUR_DATA_URL, unsplashUrl } from "@/lib/unsplash";

// Real contact facts, verbatim from CLAUDE.md — do not invent or
// approximate. Covered by page.test.tsx's "shows the real contact facts
// verbatim in the Visit section" guard.
const ADDRESS =
  "Suites 2B–2E, AA Lukoro Plaza, Plot 1120, Oladipo Diya Way, Gudu District, Abuja";
const PHONE_DISPLAY = "+234 (0) 803 311 7302";
const PHONE_TEL = "tel:+2348033117302";
const HOURS = "Mon–Sat, 9am–6pm";

export function ShowroomCta() {
  return (
    <section id="showroom" className="relative min-h-[500px] overflow-hidden text-cream">
      <Image
        src={unsplashUrl("1621293954908-907159247fc8", 1600)}
        alt="The Finishing Hub showroom interior"
        fill
        sizes="100vw"
        placeholder="blur"
        blurDataURL={UNSPLASH_BLUR_DATA_URL}
        className="object-cover"
      />
      <div className="absolute inset-0 bg-ink/65" />
      <div className="relative mx-auto flex min-h-[500px] max-w-[1440px] items-center px-6 py-16 lg:px-16">
        <div className="max-w-[520px]">
          <h2 className="mb-5 font-serif text-2xl font-normal leading-[1.15] text-cream lg:text-[36px]">
            Experience It In Person
          </h2>
          <p className="mb-8 text-[15px] leading-[1.7] text-cream/85 lg:text-base">
            Our Abuja showroom spans thousands of square feet of curated
            furniture, tiles, sanitaryware, and lighting — all on display and
            ready to touch. Come in, bring your floor plan, and leave with a
            vision.
          </p>
          <div className="mb-8 flex flex-col gap-2.5 text-[14px] leading-normal text-cream/90">
            <div className="flex gap-3">
              <span className="min-w-[70px] text-xs uppercase tracking-[0.1em] text-gold-bright">
                Address
              </span>
              <span>{ADDRESS}</span>
            </div>
            <div className="flex gap-3">
              <span className="min-w-[70px] text-xs uppercase tracking-[0.1em] text-gold-bright">
                Hours
              </span>
              <span>{HOURS}</span>
            </div>
            <div className="flex gap-3">
              <span className="min-w-[70px] text-xs uppercase tracking-[0.1em] text-gold-bright">
                Phone
              </span>
              <span>{PHONE_DISPLAY}</span>
            </div>
          </div>
          <Link
            href={PHONE_TEL}
            className="inline-block w-fit cursor-pointer rounded-[2px] bg-gold px-7 py-3.5 text-sm font-semibold tracking-wide text-ink no-underline hover:bg-gold-bright"
          >
            Book a Showroom Visit
          </Link>
        </div>
      </div>
    </section>
  );
}
