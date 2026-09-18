import type { Metadata } from "next";
import { SiteNavSection } from "@/components/site-nav-section";
import { SiteFooterSection } from "@/components/site-footer-section";
import { TrackOrderForm } from "@/components/track-order-form";

export const metadata: Metadata = {
  title: "Find Your Order — The Finishing Hub",
  description: "Look up your Finishing Hub order by reference and email.",
};

export default function TrackOrderPage() {
  return (
    <div className="bg-cream font-sans text-ink antialiased">
      <SiteNavSection />
      <section className="bg-deep-forest px-5 py-14 text-center text-cream lg:py-20">
        <h1 className="mb-3 font-serif text-3xl lg:text-4xl">Find Your Order</h1>
        <p className="mx-auto max-w-xl text-cream/80">
          Enter your order reference and email address to view your order
          status and details.
        </p>
      </section>
      <div className="mx-auto max-w-[560px] px-5 py-14 lg:py-20">
        <TrackOrderForm />
      </div>
      <SiteFooterSection />
    </div>
  );
}
