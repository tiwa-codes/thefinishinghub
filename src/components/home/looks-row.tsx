"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { UNSPLASH_BLUR_DATA_URL } from "@/lib/unsplash";

export type LookCard = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  imageUrl: string;
  styleName: string | null;
  productNames: string[];
};

function ArrowIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {direction === "left" ? (
        <polyline points="15 18 9 12 15 6"></polyline>
      ) : (
        <polyline points="9 18 15 12 9 6"></polyline>
      )}
    </svg>
  );
}

const CARD_WIDTH = 340;

export function LooksRow({ looks }: { looks: LookCard[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  function scroll(direction: "left" | "right") {
    scrollerRef.current?.scrollBy({
      left: direction === "left" ? -CARD_WIDTH - 24 : CARD_WIDTH + 24,
      behavior: "smooth",
    });
  }

  return (
    <div>
      <div className="mb-8 flex items-end justify-between lg:mb-10">
        <div>
          <div className="mb-3 text-xs uppercase tracking-[0.25em] text-gold">
            Get Inspired
          </div>
          <h2 className="font-serif text-2xl font-normal text-ink lg:text-[34px]">
            Explore <em className="italic">trending</em> looks
          </h2>
        </div>
        <div className="hidden flex-shrink-0 gap-2.5 lg:flex">
          <button
            type="button"
            aria-label="Scroll looks left"
            onClick={() => scroll("left")}
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-ink/20 text-ink hover:border-ink/50"
          >
            <ArrowIcon direction="left" />
          </button>
          <button
            type="button"
            aria-label="Scroll looks right"
            onClick={() => scroll("right")}
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-ink/20 text-ink hover:border-ink/50"
          >
            <ArrowIcon direction="right" />
          </button>
        </div>
      </div>

      {/* No Tailwind plugin for hiding scrollbars — plain scoped CSS
          instead of adding a dependency for one rule. */}
      <style>{`
        .looks-row-scroller::-webkit-scrollbar { display: none; }
      `}</style>
      <div
        ref={scrollerRef}
        className="looks-row-scroller flex gap-6 overflow-x-auto pb-2"
        style={{ scrollSnapType: "x mandatory", scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {looks.map((look) => (
          <Link
            key={look.id}
            href={`/looks/${look.slug}`}
            className="block flex-shrink-0 no-underline"
            style={{ width: CARD_WIDTH, scrollSnapAlign: "start" }}
          >
            <div className="relative mb-3 aspect-[3/4] w-full overflow-hidden rounded-[8px] bg-[#e2dccf]">
              <Image
                src={look.imageUrl}
                alt={look.title}
                fill
                sizes="340px"
                placeholder="blur"
                blurDataURL={UNSPLASH_BLUR_DATA_URL}
                className="object-cover"
              />
            </div>
            {look.styleName && (
              <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-gold">
                {look.styleName}
              </div>
            )}
            <div className="mb-1.5 font-serif text-lg text-ink">{look.title}</div>
            {look.description && (
              <p className="mb-2 line-clamp-2 text-sm text-[#6b6155]">{look.description}</p>
            )}
            <span className="mb-2 inline-block text-sm font-medium text-gold">
              Shop this look →
            </span>
            {look.productNames.length > 0 && (
              <p className="text-[12px] text-[#9a8a5c]">{look.productNames.join(", ")}</p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
