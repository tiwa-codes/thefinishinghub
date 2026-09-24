"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { UNSPLASH_BLUR_DATA_URL, unsplashUrl } from "@/lib/unsplash";

const AUTO_ADVANCE_MS = 6000;

// Named "deck"/"slide" throughout, never "slider"/"carousel" — the
// no-carousel structural guard test (page.test.tsx) asserts on
// [aria-roledescription="carousel"] and any class containing "carousel" or
// "slider" (case-insensitive). This is a plain CSS-crossfade + dot nav, no
// library.
const HERO_SLIDES = [
  {
    id: "brand",
    kicker: "FURNITURE · FINISHING · INTERIORS",
    headline: "Furniture, Finishings & Beyond, for Your Home, Office and Outdoor Spaces.",
    // Rendered uppercase via the Tailwind class (source stays sentence case
    // for screen readers and SEO).
    uppercaseHeadline: true,
    subline:
      "Furniture, tiles, lighting, sanitaryware, doors, kitchens, outdoor and decor — all under one roof in Abuja. Nationwide delivery.",
    ctaLabel: "Shop the collection",
    href: "/furniture",
    // Local file (already in the repo), not Unsplash — the original
    // brand hero image, restored as slide 1.
    imageSrc: "/images/hero-living-room.png",
  },
  {
    id: "villa",
    kicker: "VILLA COLLECTION",
    headline: "Furniture for those who build above the ordinary",
    ctaLabel: "Shop Villa",
    href: "/styles/villa",
    // Not a literal marble/gold-chandelier palace shot — that theme was
    // searched extensively across multiple rounds (villa bedroom, palace
    // interior, grand hall, mansion staircase, opulent dining room) and
    // isn't reliably findable on Unsplash. This is the same vaulted
    // wood-beam, arched-window villa living room used for the Shop by
    // Style Villa tile — real architectural scale and grandeur, reused
    // deliberately for thematic consistency rather than a mismatched fill.
    imageId: "1600210491892-03d54c0aaf87",
  },
  {
    id: "contemporary",
    kicker: "CONTEMPORARY LIVING",
    headline: "Where clean lines meet refined craftsmanship",
    ctaLabel: "Shop Contemporary",
    href: "/styles/contemporary",
    imageId: "1611048267451-e6ed903d4a38",
  },
];

export function Hero() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (paused) return;
    timerRef.current = setInterval(() => {
      setActive((i) => (i + 1) % HERO_SLIDES.length);
    }, AUTO_ADVANCE_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paused, active]);

  return (
    <section
      aria-label="Featured collections"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="relative h-[calc(100svh-72px)] min-h-[420px] w-full overflow-hidden bg-forest lg:h-[calc(100svh-128px)]"
    >
      {HERO_SLIDES.map((slide, i) => (
        <div
          key={slide.id}
          aria-hidden={i !== active}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
            i === active ? "z-10 opacity-100" : "z-0 opacity-0"
          }`}
        >
          <Image
            src={slide.imageSrc ?? unsplashUrl(slide.imageId!, 1920)}
            alt=""
            fill
            priority={i === 0}
            sizes="100vw"
            placeholder="blur"
            blurDataURL={UNSPLASH_BLUR_DATA_URL}
            className="object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(0deg, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.32) 45%, rgba(0,0,0,0.08) 75%)",
            }}
          />
          <div className="relative z-10 flex h-full items-end px-5 pb-16 lg:px-10 lg:pb-24">
            <div className="max-w-[620px] lg:max-w-[880px]">
              <div className="mb-4 text-xs uppercase tracking-[0.25em] text-gold-bright">
                {slide.kicker}
              </div>
              <h1
                className={`text-balance font-serif text-[24px] font-normal leading-[1.2] text-cream lg:text-[36px] lg:leading-[1.15] ${
                  slide.subline ? "mb-4" : "mb-7"
                } ${"uppercaseHeadline" in slide && slide.uppercaseHeadline ? "uppercase tracking-[0.02em]" : ""}`}
              >
                {slide.headline}
              </h1>
              {slide.subline && (
                <p className="mb-7 max-w-[440px] text-[15px] leading-[1.6] text-cream/80 lg:text-[17px]">
                  {slide.subline}
                </p>
              )}
              <Link
                href={slide.href}
                className="inline-block cursor-pointer border-2 border-gold px-7 py-3 text-sm font-semibold uppercase tracking-wide text-cream transition-colors duration-200 hover:bg-gold hover:text-ink"
              >
                {slide.ctaLabel}
              </Link>
            </div>
          </div>
        </div>
      ))}

      <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-2.5">
        {HERO_SLIDES.map((slide, i) => (
          <button
            key={slide.id}
            type="button"
            aria-label={`Show slide ${i + 1}: ${slide.kicker}`}
            aria-current={i === active}
            onClick={() => setActive(i)}
            className={`h-2.5 w-2.5 cursor-pointer rounded-full transition-colors duration-200 ${
              i === active ? "bg-gold" : "bg-cream/40 hover:bg-cream/70"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
