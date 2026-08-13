import Link from "next/link";
import { PlaceholderBlock } from "@/components/placeholder-block";

export function DesignServices() {
  return (
    <section className="bg-forest text-cream">
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 items-center gap-10 px-5 py-14 lg:grid-cols-2 lg:gap-[72px] lg:px-10 lg:py-[88px]">
        <div>
          <div className="mb-4 text-xs uppercase tracking-[0.2em] text-gold-bright">
            Interior design
          </div>
          <h2 className="mb-5 font-serif text-2xl font-normal leading-[1.15] lg:text-[34px]">
            Design services, end to end.
          </h2>
          <p className="mb-[30px] max-w-[480px] text-base leading-[1.7] text-[#c6cfc4]">
            Residential and commercial interiors, from concept and space
            planning through to sourcing, joinery and install. We draw on
            everything in the showroom, and source or commission the rest.
          </p>
          <Link
            href="#"
            className="inline-block rounded-[2px] bg-gold px-7 py-3.5 text-sm font-semibold tracking-wide text-forest no-underline hover:bg-gold-bright"
          >
            Start a project
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-[200px] overflow-hidden rounded-[3px]">
            <PlaceholderBlock label="[ concept board ]" tone="dark" className="h-full" />
          </div>
          <div className="mt-8 h-[200px] overflow-hidden rounded-[3px]">
            <PlaceholderBlock label="[ install shot ]" tone="dark" className="h-full" />
          </div>
        </div>
      </div>
    </section>
  );
}
