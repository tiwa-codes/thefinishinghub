import Image from "next/image";
import Link from "next/link";
import { PlaceholderBlock } from "@/components/placeholder-block";
import { publicAssetExists } from "@/lib/public-asset";

// image: stock photography, temporary — swap for a real showroom photo
// when available.
const SHOWROOM_IMAGE = "/images/showroom-interior.jpg";

const CONTACT_ROWS = [
  {
    label: "Address",
    value:
      "Suites 2B–2E, AA Lukoro Plaza, Plot 1120, Oladipo Diya Way, Gudu District, Abuja",
  },
  { label: "Hours", value: "Monday–Saturday, 9am–6pm. Closed Sundays." },
  { label: "Phone", value: "+234 (0) 803 311 7302" },
];

export function VisitShowroom() {
  const hasShowroomImage = publicAssetExists(SHOWROOM_IMAGE.replace(/^\//, ""));

  return (
    <section id="showroom" className="bg-deep-forest text-cream">
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 lg:grid-cols-2">
        <div className="relative h-[260px] lg:h-auto lg:min-h-[440px]">
          {hasShowroomImage ? (
            <Image
              src={SHOWROOM_IMAGE}
              alt="Showroom interior"
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          ) : (
            <PlaceholderBlock
              label="[ showroom interior — Gudu, Abuja ]"
              tone="dark"
              className="h-full"
            />
          )}
        </div>
        <div className="flex flex-col justify-center px-6 py-12 lg:px-16 lg:py-20">
          <div className="mb-[18px] text-xs uppercase tracking-[0.2em] text-gold-bright">
            Visit
          </div>
          <h2 className="mb-4 font-serif text-2xl font-normal leading-[1.15] lg:text-[34px]">
            The showroom is open.
          </h2>
          <p className="mb-[30px] max-w-[440px] text-base leading-[1.7] text-[#c6cfc4]">
            Visit us in Gudu, Abuja. Walk-ins welcome; a booked visit gets you
            a designer.
          </p>
          <div className="mb-8 flex flex-col gap-3 text-[14.5px] leading-normal text-[#dbe2d8]">
            {CONTACT_ROWS.map((row) => (
              <div key={row.label} className="flex gap-3.5">
                <span className="min-w-[78px] pt-0.5 text-xs uppercase tracking-[0.1em] text-gold">
                  {row.label}
                </span>
                <span>{row.value}</span>
              </div>
            ))}
          </div>
          <Link
            href="#"
            className="self-start rounded-[2px] bg-gold px-[30px] py-3.5 text-sm font-semibold tracking-wide text-forest no-underline hover:bg-gold-bright"
          >
            Book a visit
          </Link>
        </div>
      </div>
    </section>
  );
}
