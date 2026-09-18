import type { Metadata } from "next";
import Image from "next/image";
import { SiteNavSection } from "@/components/site-nav-section";
import { SiteFooterSection } from "@/components/site-footer-section";
import { DesignEnquiryForm } from "@/components/design-enquiry-form";
import { UNSPLASH_BLUR_DATA_URL, unsplashUrl } from "@/lib/unsplash";

export const metadata: Metadata = {
  title: "Interior Design Services — The Finishing Hub",
  description:
    "TFH Interior Design offers end-to-end residential and commercial design in Abuja, Nigeria. Concept, sourcing, delivery and installation.",
};

function ConceptIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 20 20.5 3.5a1.5 1.5 0 0 1 2 2L4.5 22 2 22l0-2.5Z"></path>
      <path d="M14 5.5 18.5 10"></path>
    </svg>
  );
}

function SourcingIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 8 12 3l9 5v8l-9 5-9-5Z"></path>
      <path d="M3 8 12 13l9-5"></path>
      <path d="M12 13v8"></path>
    </svg>
  );
}

function DeliveryIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 16V6a1 1 0 0 1 1-1h9v11"></path>
      <path d="M13 9h4l4 4v3h-3"></path>
      <circle cx="7.5" cy="17.5" r="1.8"></circle>
      <circle cx="16.5" cy="17.5" r="1.8"></circle>
    </svg>
  );
}

const PILLARS = [
  {
    icon: ConceptIcon,
    title: "Concept & Planning",
    body: "Space planning, mood boards, and material palettes. We start by understanding how you want the space to feel.",
  },
  {
    icon: SourcingIcon,
    title: "Sourcing & Supply",
    body: "Every piece chosen against the others, in real light. No guesswork about what works together.",
  },
  {
    icon: DeliveryIcon,
    title: "Delivery & Install",
    body: "White-glove delivery and installation in Abuja. We don't leave until the room is right.",
  },
];

export default function InteriorDesignPage() {
  return (
    <div className="bg-cream font-sans text-ink antialiased">
      <SiteNavSection />

      {/* Section 1 — Hero */}
      <section className="relative flex min-h-[70vh] items-end overflow-hidden text-cream">
        <Image
          src={unsplashUrl("1616486338812-3dadae4b4ace", 1600)}
          alt="Interior design service"
          fill
          priority
          sizes="100vw"
          placeholder="blur"
          blurDataURL={UNSPLASH_BLUR_DATA_URL}
          className="object-cover"
        />
        <div className="absolute inset-0 bg-ink/55" />
        <div className="relative mx-auto max-w-[1440px] px-5 pb-14 lg:px-10 lg:pb-20">
          <div className="mb-4 text-xs uppercase tracking-[0.25em] text-gold-bright">
            Interior Design
          </div>
          <h1 className="mb-3 max-w-xl font-serif text-4xl font-normal leading-[1.1] lg:text-5xl">
            Design services, end to end.
          </h1>
          <p className="max-w-md text-cream/85 lg:text-lg">From first concept to finished space.</p>
        </div>
      </section>

      {/* Section 2 — What we do */}
      <section className="mx-auto max-w-3xl px-5 py-16 text-center lg:py-24">
        <h2 className="mb-5 font-serif text-3xl font-normal text-ink">A complete design service</h2>
        <p className="mb-14 text-[15px] leading-[1.8] text-[#4a4339]">
          We offer residential and commercial interior design across Abuja and
          Nigeria. Every project draws on the full TFH showroom — furniture,
          tiles, lighting, sanitaryware and doors — so the design and the
          sourcing happen in the same room. For anything outside our
          showroom, we source or commission.
        </p>
        <div className="grid grid-cols-1 gap-10 text-left sm:grid-cols-3 sm:text-center">
          {PILLARS.map((pillar) => (
            <div key={pillar.title} className="flex flex-col items-start sm:items-center">
              <div className="mb-4 text-gold">
                <pillar.icon />
              </div>
              <h3 className="mb-2 font-serif text-lg text-ink">{pillar.title}</h3>
              <p className="text-sm leading-[1.7] text-[#6b6155]">{pillar.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Section 3 — Start a project */}
      <section className="bg-deep-forest">
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-10 px-5 py-16 text-cream lg:grid-cols-2 lg:gap-16 lg:px-10 lg:py-24">
          <div>
            <h2 className="mb-4 font-serif text-3xl font-normal leading-[1.15] lg:text-[36px]">
              Tell us about your project
            </h2>
            <p className="text-[15px] leading-[1.7] text-[#c6cfc4]">
              Fill in the form and our team will be in touch within 24 hours
              to discuss next steps.
            </p>
          </div>
          <DesignEnquiryForm />
        </div>
      </section>

      <SiteFooterSection />
    </div>
  );
}
