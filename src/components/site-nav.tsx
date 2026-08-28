"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import type { TopLevelCategory } from "@/lib/categories";

export function SiteNav({ categories }: { categories: TopLevelCategory[] }) {
  const { count } = useCart();
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  function closeSearch() {
    setSearchOpen(false);
    setSearchQuery("");
  }

  const openCategory = categories.find((cat) => cat.slug === openSlug) ?? null;

  return (
    <div onMouseLeave={() => setOpenSlug(null)}>
      {/* Utility bar */}
      <div className="bg-deep-forest text-[#cfd8cf]">
        <div className="mx-auto flex h-8 max-w-[1440px] items-center justify-between gap-6 px-5 text-xs tracking-wide lg:px-10">
          <span className="hidden truncate lg:block">
            Suites 2B–2E, AA Lukoro Plaza · Gudu District, Abuja · Mon–Sat,
            9am–6pm
          </span>
          <div className="flex items-center gap-3 lg:gap-4">
            <span className="hidden text-gold-bright sm:inline">
              +234 (0) 803 311 7302
            </span>
            <span className="hidden opacity-40 sm:inline">·</span>
            <Link href="#" className="hover:text-gold-bright">
              Account
            </Link>
            <span className="opacity-40">·</span>
            <Link href="/cart" className="hover:text-gold-bright">
              Cart · {count}
            </Link>
          </div>
        </div>
      </div>

      {/* Main nav.
          Grid is `auto 1fr auto`, not `1fr auto 1fr`: the logo and the
          search+CTA cluster are content-sized and never compressed below
          their own minimum — critical for the wordmark, which must not
          shrink (see CLAUDE.md) and has no wrap/overflow protection of
          its own. The nav links are the flexible middle column, centered
          (`justify-center`) within whatever space is left; if content
          ever doesn't fit — e.g. a future category name change — it
          scrolls horizontally rather than spilling into the logo or CTA.
          That structural protection is what actually prevents overlap,
          not the breakpoint. The nav renders `navLabel` (categories.
          nav_label, short form) rather than `name` specifically because
          the full names never fit the row even at 1440px, the widest
          this header gets (capped by max-w-[1440px]) — with the short
          labels there's a genuine ~27px margin on each side of the nav
          even at the tightest point (this lg breakpoint's minimum,
          1024px), so lg is safe here; it wasn't with the full names. */}
      <div className="sticky top-0 z-50 bg-forest text-cream">
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-5 lg:grid lg:h-[84px] lg:grid-cols-[auto_1fr_auto] lg:gap-x-6 lg:px-10">
          <Link
            href="/"
            className="flex flex-shrink-0 items-center gap-[15px] no-underline lg:justify-self-start"
          >
            <Image
              src="/images/tfh-monogram.png"
              alt="TFH"
              width={48}
              height={48}
              priority
              className="h-9 w-auto lg:h-12"
            />
            <span className="flex flex-col leading-[1.1]">
              <span className="whitespace-nowrap font-serif text-lg text-cream lg:text-[23px]">
                The Finishing Hub
              </span>
              <span className="mt-[3px] text-[11px] uppercase tracking-[0.32em] text-gold">
                Abuja
              </span>
            </span>
          </Link>

          <nav
            aria-label="Product categories"
            className="hidden h-full min-w-0 items-center justify-center gap-[26px] overflow-x-auto lg:flex"
          >
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={cat.href}
                onMouseEnter={() =>
                  setOpenSlug(cat.subcategories.length > 0 ? cat.slug : null)
                }
                className="flex h-[84px] flex-shrink-0 items-center gap-[5px] whitespace-nowrap text-sm font-medium text-cream no-underline hover:text-gold-bright"
              >
                <span>{cat.navLabel}</span>
                {cat.subcategories.length > 0 && (
                  <span className="text-[8px] opacity-70">&#9660;</span>
                )}
              </Link>
            ))}
          </nav>

          <div className="hidden flex-shrink-0 items-center gap-[18px] lg:flex lg:justify-self-end">
            {searchOpen ? (
              // Native GET form — submitting navigates the browser
              // straight to /search?q=<value>, no client-side routing
              // logic needed.
              <form action="/search" method="get" className="flex items-center gap-2">
                <input
                  type="search"
                  name="q"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") closeSearch();
                  }}
                  placeholder="Search products…"
                  aria-label="Search products"
                  className="w-40 rounded-[2px] border border-cream/30 bg-transparent px-2.5 py-1.5 text-sm text-cream outline-none placeholder:text-cream/50 focus:border-gold-bright lg:w-56"
                />
                <button
                  type="button"
                  aria-label="Close search"
                  onClick={closeSearch}
                  className="inline-flex items-center text-cream hover:text-gold-bright"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                  </svg>
                </button>
              </form>
            ) : (
              <button
                type="button"
                aria-label="Search"
                onClick={() => setSearchOpen(true)}
                className="inline-flex items-center text-cream hover:text-gold-bright"
              >
                <svg
                  width="19"
                  height="19"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                >
                  <circle cx="11" cy="11" r="7"></circle>
                  <line x1="21" y1="21" x2="16.5" y2="16.5"></line>
                </svg>
              </button>
            )}
            <Link
              href="/#showroom"
              className="whitespace-nowrap rounded-[2px] bg-gold px-5 py-3 text-[13px] font-semibold tracking-wide text-forest no-underline hover:bg-gold-bright"
            >
              Visit the Showroom
            </Link>
          </div>

          <button
            type="button"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
            className="flex flex-shrink-0 items-center justify-center text-cream lg:hidden"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              {mobileOpen ? (
                <>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                </>
              ) : (
                <>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </>
              )}
            </svg>
          </button>
        </div>

        {/* Desktop mega-menu */}
        {openCategory && openCategory.subcategories.length > 0 && (
          <div className="hidden border-t border-gold/25 bg-forest lg:block">
            <div className="mx-auto max-w-[1440px] px-10 pb-[34px] pt-[26px]">
              <div className="mb-[18px] font-serif text-[13px] uppercase tracking-[0.16em] text-gold">
                {openCategory.name}
              </div>
              <div className="grid grid-cols-5 gap-x-10 gap-y-3">
                {openCategory.subcategories.map((sub) => (
                  <Link
                    key={sub.id}
                    href={sub.href}
                    className="py-1 text-sm text-[#e6ede6] no-underline hover:text-gold-bright"
                  >
                    {sub.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Mobile menu panel */}
        {mobileOpen && (
          <div className="border-t border-gold/25 bg-forest px-5 py-6 lg:hidden">
            <div className="flex flex-col">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={cat.href}
                  onClick={() => setMobileOpen(false)}
                  className="border-b border-cream/10 py-3.5 text-sm font-medium text-cream no-underline"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
            <Link
              href="/#showroom"
              onClick={() => setMobileOpen(false)}
              className="mt-6 block rounded-[2px] bg-gold px-5 py-3 text-center text-[13px] font-semibold tracking-wide text-forest no-underline"
            >
              Visit the Showroom
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
