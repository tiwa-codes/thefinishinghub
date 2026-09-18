import type { Metadata } from "next";
import { SiteNavSection } from "@/components/site-nav-section";
import { SiteFooterSection } from "@/components/site-footer-section";

export const metadata: Metadata = {
  title: "Gallery — The Finishing Hub",
  description: "Room scenes and project inspiration from The Finishing Hub.",
};

const TILES = [
  {
    title: "Villa Collection",
    caption: "Presidential spaces, ornate detail, lasting presence.",
  },
  {
    title: "Contemporary Living",
    caption: "Clean lines and considered materials.",
  },
  {
    title: "Completed Projects",
    caption: "Real spaces, finished with TFH.",
  },
  {
    title: "From the Showroom",
    caption: "Pieces on the floor, ready to see in person.",
  },
];

export default function GalleryPage() {
  return (
    <div className="bg-cream font-sans text-ink antialiased">
      <SiteNavSection />

      <section className="bg-deep-forest px-5 py-14 text-center text-cream lg:py-20">
        <div className="mb-3 text-xs uppercase tracking-[0.25em] text-gold-bright">Gallery</div>
        <h1 className="mb-3 font-serif text-3xl lg:text-4xl">Rooms worth finishing.</h1>
        <p className="mx-auto max-w-xl text-cream/80">
          Project photography and showroom looks, coming soon.
        </p>
      </section>

      <div className="mx-auto max-w-[1000px] px-5 py-16 lg:px-10 lg:py-20">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {TILES.map((tile) => (
            <div
              key={tile.title}
              className="flex aspect-[4/3] flex-col justify-end bg-deep-forest p-8 text-cream"
            >
              <h2 className="mb-2 font-serif text-2xl">{tile.title}</h2>
              <p className="text-sm text-cream/75">{tile.caption}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="mb-5 text-[15px] text-[#6b6155]">
            In the meantime, come and see the showroom.
          </p>
          <a
            href="tel:+2348033117302"
            className="inline-block rounded-[2px] bg-gold px-7 py-[15px] text-sm font-semibold tracking-wide text-forest no-underline hover:bg-gold-bright"
          >
            Book a visit
          </a>
        </div>
      </div>

      <SiteFooterSection />
    </div>
  );
}
