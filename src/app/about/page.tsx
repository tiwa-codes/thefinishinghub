import type { Metadata } from "next";
import Image from "next/image";
import { SiteNavSection } from "@/components/site-nav-section";
import { SiteFooterSection } from "@/components/site-footer-section";
import { UNSPLASH_BLUR_DATA_URL, unsplashUrl } from "@/lib/unsplash";

export const metadata: Metadata = {
  title: "About Us — The Finishing Hub",
  description:
    "The Finishing Hub is Abuja's premium furniture, tiles, lighting, sanitaryware and doors showroom. International pieces, expert guidance, nationwide delivery.",
};

const ADDRESS =
  "Suites 2B–2E, AA Lukoro Plaza, Plot 1120, Oladipo Diya Way, Gudu District, Abuja";
const PHONE_DISPLAY = "+234 (0) 803 311 7302";
const PHONE_TEL = "tel:+2348033117302";
const HOURS = "Mon–Sat, 9am–6pm";

const APPROACH_POINTS = [
  "Furniture and finishes chosen to work together",
  "International pieces, Abuja prices",
  "Expert guidance before you buy",
  "Delivery nationwide, installation in Abuja",
];

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="flex-shrink-0 text-gold">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  );
}

export default function AboutPage() {
  return (
    <div className="bg-cream font-sans text-ink antialiased">
      <SiteNavSection />

      {/* Section 1 — Hero */}
      <section className="relative flex min-h-[60vh] items-center justify-center overflow-hidden text-center text-cream">
        <Image
          src="/images/editorial-full-room-scene.jpg"
          alt="A finished Finishing Hub interior"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-ink/55" />
        <div className="relative mx-auto max-w-2xl px-5">
          <div className="mb-4 text-xs uppercase tracking-[0.25em] text-gold-bright">
            Our Story
          </div>
          <h1 className="mb-4 font-serif text-4xl font-normal leading-[1.1] lg:text-5xl">
            Where the Room Comes Together
          </h1>
          <p className="text-cream/85 lg:text-lg">
            A showroom built for those who take finishing seriously.
          </p>
        </div>
      </section>

      {/* Section 2 — The TFH Story */}
      <section className="mx-auto max-w-3xl px-5 py-16 text-center lg:py-24">
        <p className="mb-6 text-[15px] leading-[1.8] text-[#4a4339]">
          The Finishing Hub started with a simple observation: most people
          building or furnishing a home in Nigeria have to shop across a
          dozen different suppliers to finish one room. The furniture from
          one place, the tiles from another, the lights from a third — and
          nothing ever quite agrees when it all arrives. We built TFH to fix
          that.
        </p>
        <p className="text-[15px] leading-[1.8] text-[#4a4339]">
          Our Abuja showroom brings furniture, tiles, sanitaryware, lighting,
          doors and decor under one roof — so you can see how a marble-look
          floor tile looks against a particular sofa in real light, not on a
          screen. We carry international pieces from Italian, French, and
          internationally sourced lines, and our team is here to help you
          find what works — not just what&apos;s in stock.
        </p>
      </section>

      {/* Section 3 — The Approach */}
      <section className="mx-auto grid max-w-[1200px] grid-cols-1 gap-10 px-5 pb-16 lg:grid-cols-2 lg:gap-16 lg:px-10 lg:pb-24">
        <h2 className="font-serif text-3xl font-normal leading-[1.15] text-ink lg:text-[40px]">
          Five categories. One showroom.
        </h2>
        <div className="grid grid-cols-1 gap-x-8 gap-y-4">
          {APPROACH_POINTS.map((point) => (
            <div key={point} className="flex items-start gap-2.5 text-[15px] text-[#4a4339]">
              <span className="mt-0.5">
                <CheckIcon />
              </span>
              {point}
            </div>
          ))}
        </div>
      </section>

      {/* Section 4 — The Showroom */}
      <section className="grid grid-cols-1 bg-deep-forest text-cream lg:grid-cols-2">
        <div className="relative min-h-[340px] lg:min-h-[480px]">
          <Image
            src={unsplashUrl("1621293954908-907159247fc8", 1200)}
            alt="The Finishing Hub showroom interior"
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            placeholder="blur"
            blurDataURL={UNSPLASH_BLUR_DATA_URL}
            className="object-cover"
          />
        </div>
        <div className="flex flex-col justify-center px-6 py-14 lg:px-16 lg:py-0">
          <div className="mb-3.5 text-xs uppercase tracking-[0.25em] text-gold-bright">
            Visit Us
          </div>
          <h2 className="mb-5 font-serif text-3xl font-normal leading-[1.15] lg:text-[36px]">
            Come and see it in person.
          </h2>
          <div className="mb-7 flex flex-col gap-2 text-[15px] leading-[1.7] text-[#c6cfc4]">
            <p>{ADDRESS}</p>
            <p>{HOURS}</p>
            <p>{PHONE_DISPLAY}</p>
          </div>
          <a
            href={PHONE_TEL}
            className="inline-block w-fit rounded-[2px] bg-gold px-[30px] py-[15px] text-sm font-semibold tracking-wide text-forest no-underline hover:bg-gold-bright"
          >
            Book a visit
          </a>
        </div>
      </section>

      {/* No separate trademark line here — CLAUDE.md restricts any mention
          of Bajgio to the shared footer's own trademark line just below,
          which already says exactly this. */}
      <SiteFooterSection />
    </div>
  );
}
