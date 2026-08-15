import Link from "next/link";

export function BookADesignerBand({
  title,
  description,
  ctaHref = "/#showroom",
  ctaLabel = "Book a designer",
}: {
  title: string;
  description: string;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  return (
    <section className="mx-auto max-w-[1440px] px-5 pb-16 pt-10 lg:px-10 lg:pb-24 lg:pt-14">
      <div className="flex flex-col items-start gap-8 bg-deep-forest px-6 py-10 text-cream lg:flex-row lg:items-center lg:justify-between lg:gap-10 lg:px-[60px] lg:py-14">
        <div className="max-w-[640px]">
          <div className="mb-3.5 text-xs uppercase tracking-[0.2em] text-gold-bright">
            Interior design
          </div>
          <h2 className="mb-3 font-serif text-2xl font-normal leading-[1.15] lg:text-[30px]">
            {title}
          </h2>
          <p className="text-[15.5px] leading-[1.7] text-[#c6cfc4]">
            {description}
          </p>
        </div>
        <Link
          href={ctaHref}
          className="whitespace-nowrap rounded-[2px] bg-gold px-[30px] py-[15px] text-sm font-semibold tracking-wide text-forest no-underline hover:bg-gold-bright"
        >
          {ctaLabel}
        </Link>
      </div>
    </section>
  );
}
