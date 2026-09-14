import type { Metadata } from "next";
import { SiteNavSection } from "@/components/site-nav-section";
import { SiteFooterSection } from "@/components/site-footer-section";

export const metadata: Metadata = {
  title: "Gallery — The Finishing Hub",
  description: "Room scenes and project inspiration from The Finishing Hub.",
};

// Stub — no content yet, just enough that the nav's Gallery tile doesn't 404.
export default function GalleryPage() {
  return (
    <div className="bg-cream font-sans text-ink antialiased">
      <SiteNavSection />
      <div className="mx-auto max-w-[1440px] px-5 py-24 text-center lg:px-10">
        <h1 className="mb-4 font-serif text-3xl font-normal text-ink lg:text-4xl">Gallery</h1>
        <p className="text-ink/60">Coming soon.</p>
      </div>
      <SiteFooterSection />
    </div>
  );
}
