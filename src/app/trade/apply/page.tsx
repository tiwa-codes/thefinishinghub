import type { Metadata } from "next";
import { SiteNavSection } from "@/components/site-nav-section";
import { SiteFooterSection } from "@/components/site-footer-section";
import { TradeApplicationForm } from "@/components/trade-application-form";

export const metadata: Metadata = {
  title: "Trade Program — The Finishing Hub",
  description:
    "Apply for TFH's trade program — preferred pricing, priority access and dedicated service for architects, designers and contractors.",
};

const BENEFITS = [
  {
    title: "Members-only pricing",
    body: "Preferred rates across furniture, tiles and sanitaryware. Pricing scales with your order volume.",
  },
  {
    title: "Priority access",
    body: "First look at new arrivals and limited pieces before they go to the floor.",
  },
  {
    title: "Dedicated account manager",
    body: "One point of contact for all orders, deliveries and after-sales queries.",
  },
  {
    title: "Flexible payment terms",
    body: "Staged payment options available for large project orders. Subject to approval.",
  },
];

export default function TradeApplyPage() {
  return (
    <div className="bg-cream font-sans text-ink antialiased">
      <SiteNavSection />

      {/* Section 1 — Hero */}
      <section className="bg-deep-forest px-5 py-14 text-center text-cream lg:py-20">
        <h1 className="mb-3 font-serif text-3xl lg:text-4xl">Trade Program</h1>
        <p className="mx-auto max-w-2xl text-cream/80">
          Members-only pricing and priority service for architects, interior
          designers, contractors and developers.
        </p>
      </section>

      {/* Section 2 — Benefits */}
      <section className="mx-auto max-w-[1000px] px-5 py-16 lg:px-10 lg:py-24">
        <h2 className="mb-10 text-center font-serif text-3xl font-normal text-ink">
          What members get
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {BENEFITS.map((benefit) => (
            <div key={benefit.title} className="rounded-[2px] border border-[#ddd5c4] bg-white p-6">
              <h3 className="mb-2 font-serif text-lg text-ink">{benefit.title}</h3>
              <p className="text-sm leading-[1.7] text-[#6b6155]">{benefit.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Section 3 — Application form */}
      <section className="bg-deep-forest">
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-10 px-5 py-16 text-cream lg:grid-cols-2 lg:gap-16 lg:px-10 lg:py-24">
          <div>
            <h2 className="mb-4 font-serif text-3xl font-normal leading-[1.15] lg:text-[36px]">
              Apply for a trade account
            </h2>
            <p className="text-[15px] leading-[1.7] text-[#c6cfc4]">
              We review all applications personally. Most are approved within
              2 business days.
            </p>
          </div>
          <TradeApplicationForm />
        </div>
      </section>

      <SiteFooterSection />
    </div>
  );
}
