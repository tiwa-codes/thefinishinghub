import Link from "next/link";

export function TradeDesk() {
  return (
    <section className="mx-auto max-w-[1440px] px-5 py-14 lg:px-10 lg:py-[84px]">
      <div className="flex flex-col items-start gap-8 rounded-[3px] bg-[#ebe5db] px-6 py-10 lg:flex-row lg:items-center lg:justify-between lg:gap-12 lg:px-[60px] lg:py-14">
        <div className="max-w-[620px]">
          <div className="mb-[14px] text-xs uppercase tracking-[0.2em] text-gold">
            Designers &amp; Trade
          </div>
          <h2 className="mb-3.5 font-serif text-2xl font-normal leading-[1.2] text-ink lg:text-[30px]">
            Trade pricing for professional buyers.
          </h2>
          <p className="text-[15.5px] leading-[1.7] text-[#4a4339]">
            Interior designers, architects, contractors and developers work
            with a dedicated account and trade pricing across all five
            categories.
          </p>
        </div>
        <div className="flex w-full flex-shrink-0 flex-col gap-3 lg:w-auto">
          <Link
            href="/trade/apply"
            className="whitespace-nowrap rounded-[2px] bg-forest px-8 py-[15px] text-center text-sm font-semibold tracking-wide text-cream no-underline hover:bg-deep-forest"
          >
            Apply for trade pricing
          </Link>
          <Link
            href="#"
            className="p-1.5 text-center text-[13px] font-medium text-forest no-underline"
          >
            Speak to the trade desk
          </Link>
        </div>
      </div>
    </section>
  );
}
