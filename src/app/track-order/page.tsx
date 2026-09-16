import type { Metadata } from "next";
import { SiteNavSection } from "@/components/site-nav-section";
import { SiteFooterSection } from "@/components/site-footer-section";
import { TrackOrderForm } from "@/components/track-order-form";

export const metadata: Metadata = {
  title: "Track Order — The Finishing Hub",
  description: "Track the status of your Finishing Hub order.",
};

export default function TrackOrderPage() {
  return (
    <div className="bg-cream font-sans text-ink antialiased">
      <SiteNavSection />
      <div className="mx-auto max-w-[520px] px-5 py-16 lg:py-24">
        <h1 className="mb-3 font-serif text-3xl text-ink">Track your order</h1>
        <p className="mb-8 text-sm text-[#6b6155]">
          Enter your order reference and email to check its status.
        </p>
        <TrackOrderForm />
      </div>
      <SiteFooterSection />
    </div>
  );
}
