import Image from "next/image";
import Link from "next/link";
import { publicAssetExists } from "@/lib/public-asset";

type FooterLink = { label: string; href: string };
type FooterColumn = { title: string; links: FooterLink[] };

const FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: "Shop",
    links: [
      { label: "Furniture", href: "#" },
      { label: "Tiles & Finishes", href: "#" },
      { label: "Lighting", href: "#" },
      { label: "Bath", href: "#" },
      { label: "Doors & Joinery", href: "#" },
      { label: "New arrivals", href: "#" },
    ],
  },
  {
    title: "Studio",
    links: [
      { label: "Interior Design", href: "#" },
      { label: "Projects", href: "#" },
      { label: "About", href: "#" },
    ],
  },
  {
    title: "Help",
    links: [
      { label: "Delivery", href: "#" },
      { label: "Returns", href: "#" },
      { label: "Track order", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
  {
    title: "Trade",
    links: [
      { label: "Trade pricing", href: "#" },
      { label: "Trade desk", href: "#" },
      { label: "For designers", href: "#" },
      { label: "Apply", href: "#" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-forest text-[#cdd5cc]">
      <div className="mx-auto max-w-[1440px] px-5 pt-12 lg:px-10 lg:pt-[72px]">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 border-b border-gold/20 pb-14 sm:grid-cols-3 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr] lg:gap-10">
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <Image
              src="/images/tfh-lockup.png"
              alt="The Finishing Hub"
              width={280}
              height={96}
              className="-ml-1.5 h-16 w-auto lg:h-24"
            />
            <p className="my-[18px] max-w-[300px] text-sm leading-[1.7] text-[#a9b3a8]">
              Furniture, tiles, lighting, sanitaryware and doors — five
              categories under one roof in Abuja, delivered nationwide.
            </p>
            <div className="flex gap-[18px] text-xs tracking-wide">
              <Link href="#" className="hover:text-gold-bright">
                Instagram
              </Link>
              <Link href="#" className="hover:text-gold-bright">
                Facebook
              </Link>
              <Link href="#" className="hover:text-gold-bright">
                LinkedIn
              </Link>
            </div>
          </div>

          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title}>
              <div className="mb-[18px] text-xs uppercase tracking-[0.14em] text-gold">
                {col.title}
              </div>
              <div className="flex flex-col gap-[11px]">
                {col.links.map((l) => (
                  <Link
                    key={l.label}
                    href={l.href}
                    className="text-sm text-[#a9b3a8] hover:text-cream"
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Trademark row */}
        <div className="flex flex-wrap items-center justify-between gap-6 py-7">
          <div className="flex items-center gap-4">
            <span className="text-xs uppercase tracking-[0.14em] text-[#7f8a7e]">
              A trademark of
            </span>
            <span className="inline-flex h-[42px] w-[90px] items-center justify-center overflow-hidden rounded-full bg-[#ec1c24] px-5 py-1.5">
              {publicAssetExists("images/bajgio-badge.png") ? (
                <Image
                  src="/images/bajgio-badge.png"
                  alt="Bajgio"
                  width={90}
                  height={30}
                  className="h-[30px] w-auto"
                />
              ) : (
                <span role="img" aria-label="Bajgio" className="text-[10px] font-semibold tracking-wide text-white">
                  BAJGIO
                </span>
              )}
            </span>
            <span className="text-[13px] text-[#7f8a7e]">
              Furniture manufacturer · Lagos
            </span>
          </div>
          <div className="flex items-center gap-2 text-[13px] text-[#7f8a7e]">
            <span>Secure payments by</span>
            <span className="font-semibold tracking-wide text-[#cdd5cc]">
              Paystack
            </span>
          </div>
        </div>

        {/* Copyright */}
        <div className="flex flex-wrap items-center justify-between gap-5 border-t border-gold/20 py-[22px] text-[12.5px] text-[#7f8a7e]">
          <span>
            © 2026 The Finishing Hub. A trademark of Bajgio. All rights
            reserved.
          </span>
          <div className="flex gap-[22px]">
            <Link href="#" className="hover:text-[#cdd5cc]">
              Privacy
            </Link>
            <Link href="#" className="hover:text-[#cdd5cc]">
              Terms
            </Link>
            <Link href="#" className="hover:text-[#cdd5cc]">
              Delivery &amp; Returns
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
