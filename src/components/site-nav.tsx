"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { PlaceholderBlock } from "@/components/placeholder-block";
import type { TopLevelCategory } from "@/lib/categories";
import {
  DESIGN_RESOURCE_TILES,
  resourceTileImageUrl,
  MEGA_MENU_SUBCATEGORIES,
  NAV_CATEGORY_ORDER,
  SHOP_BY_SPACE,
  SHOP_BY_STYLE,
} from "@/lib/mega-menu-data";
import { UNSPLASH_BLUR_DATA_URL } from "@/lib/unsplash";

const SCROLL_THRESHOLD = 60;

const RIGHT_ZONE_LINKS = [
  { key: "design-resources", label: "Design Resources", href: "/resources" },
  { key: "new-arrivals", label: "New Arrivals", href: "/#new-arrivals" },
  { key: "trade-program", label: "Trade Program", href: "/trade/apply" },
];

function ChevronDownIcon({ className = "" }: { className?: string }) {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"></path>
    </svg>
  );
}

// lucide-react isn't a dependency here (nothing in this codebase uses it —
// every nav icon is a hand-written inline SVG, matching the "no new
// dependencies" constraint), so this mirrors lucide's "User" glyph by hand
// rather than installing the package for one icon.
function UserIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="4"></circle>
      <path d="M4 20.5a8 8 0 0 1 16 0"></path>
    </svg>
  );
}

function BagIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 8h12l1 13H5L6 8Z"></path>
      <path d="M9 8V6a3 3 0 0 1 6 0v2"></path>
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <line x1="6" y1="6" x2="18" y2="18"></line>
      <line x1="18" y1="6" x2="6" y2="18"></line>
    </svg>
  );
}

function HamburgerIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <line x1="3" y1="6" x2="21" y2="6"></line>
      <line x1="3" y1="12" x2="21" y2="12"></line>
      <line x1="3" y1="18" x2="21" y2="18"></line>
    </svg>
  );
}

function SpaceIcon({ slug }: { slug: string }) {
  // A single shared glyph is intentional here — these are wayfinding
  // bullets next to a name + description, not a per-room icon library.
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" data-space={slug}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="2"></rect>
      <path d="M3.5 15.5 9 10l4 4 3-3 4.5 4.5"></path>
    </svg>
  );
}

type DropdownKey = string;

export function SiteNav({ categories }: { categories: TopLevelCategory[] }) {
  const { count } = useCart();
  const [openKey, setOpenKey] = useState<DropdownKey | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileAccordion, setMobileAccordion] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);

  const headerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > SCROLL_THRESHOLD);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Click-to-open dropdowns: clicking outside the nav, or Escape, closes
  // whatever is open. Clicking a trigger toggles it (handleTriggerClick).
  useEffect(() => {
    if (!openKey) return;

    function onDocumentClick(e: MouseEvent) {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setOpenKey(null);
      }
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenKey(null);
    }

    document.addEventListener("click", onDocumentClick);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("click", onDocumentClick);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [openKey]);

  function handleTriggerClick(key: DropdownKey, e?: { preventDefault: () => void }) {
    e?.preventDefault();
    setOpenKey((current) => (current === key ? null : key));
  }

  function closeMobile() {
    setMobileOpen(false);
    setMobileAccordion(null);
  }

  const orderedCategories = NAV_CATEGORY_ORDER.map((slug) =>
    categories.find((cat) => cat.slug === slug),
  ).filter((cat): cat is TopLevelCategory => Boolean(cat));

  const openCategory = orderedCategories.find((cat) => cat.slug === openKey) ?? null;

  return (
    <header
      ref={headerRef}
      className={`sticky top-0 z-50 bg-forest text-cream transition-colors duration-200 ${
        scrolled ? "border-b border-gold/25" : ""
      }`}
    >
      {/* Row 1: logo, right-zone links + CTA + icons. Row 2 (category
          links) gets its own full-width row below rather than sharing
          this one — with 8 categories + "Shop by" plus a fully-loaded
          right zone, a single shared row doesn't have enough width at
          1440px (measured: content needs ~650px, a shared row only
          leaves ~435px). Matches the reference site's two-row pattern. */}
      <div className="mx-auto flex h-[72px] max-w-[1440px] items-center gap-6 px-5 lg:h-20 lg:px-10">
        <Link
          href="/"
          className="flex flex-shrink-0 items-center gap-[15px] no-underline"
        >
          <Image
            src="/images/tfh-monogram.png"
            alt="TFH"
            width={48}
            height={48}
            priority
            className="h-9 w-auto lg:h-11"
          />
          <span className="flex flex-col leading-[1.1]">
            <span className="whitespace-nowrap font-serif text-lg text-cream lg:text-[22px]">
              The Finishing Hub
            </span>
            <span className="mt-[3px] text-[11px] uppercase tracking-[0.32em] text-gold">
              Abuja
            </span>
          </span>
        </Link>

        <div className="hidden min-w-0 flex-1 justify-center lg:flex">
          <input
            type="search"
            aria-label="Search by product, category, or style"
            placeholder="Search by product, category, or style"
            disabled
            className="w-full max-w-[440px] rounded-[2px] border border-cream/25 bg-transparent px-4 py-2.5 text-sm text-cream outline-none placeholder:text-cream/50 focus:border-gold-bright disabled:cursor-not-allowed"
          />
        </div>

        <div className="hidden flex-shrink-0 items-center gap-5 lg:flex">
          <nav aria-label="Discover and services" className="flex items-center gap-4 text-[13px]">
            {RIGHT_ZONE_LINKS.map((item) =>
              item.key === "design-resources" ? (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={(e) => handleTriggerClick(item.key, e)}
                  aria-haspopup="true"
                  aria-expanded={openKey === item.key}
                  className="flex cursor-pointer items-center gap-0.5 whitespace-nowrap font-medium text-cream no-underline hover:text-gold-bright"
                >
                  <span>{item.label}</span>
                  <ChevronDownIcon className="opacity-70" />
                </Link>
              ) : (
                <Link
                  key={item.key}
                  href={item.href}
                  className="whitespace-nowrap font-medium text-cream no-underline hover:text-gold-bright"
                >
                  {item.label}
                </Link>
              ),
            )}
          </nav>

          <Link href="/account" aria-label="Account" className="flex cursor-pointer items-center text-cream hover:text-gold-bright">
            <UserIcon />
          </Link>

          <Link href="#" aria-label="Wishlist" className="flex cursor-pointer items-center text-cream hover:text-gold-bright">
            <HeartIcon />
          </Link>

          <Link href="/cart" aria-label={`Cart, ${count} item${count === 1 ? "" : "s"}`} className="relative flex cursor-pointer items-center text-cream hover:text-gold-bright">
            <BagIcon />
            {count > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[10px] font-semibold text-ink">
                {count}
              </span>
            )}
          </Link>
        </div>

        <button
          type="button"
          aria-label="Menu"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
          className="flex h-11 w-11 flex-shrink-0 cursor-pointer items-center justify-center text-cream lg:hidden"
        >
          {mobileOpen ? <CloseIcon /> : <HamburgerIcon />}
        </button>
      </div>

      {/* Row 2: category links + the "Visit the Showroom" CTA, full-width —
          see the row-1 comment above for why categories aren't sharing a
          row with the logo/search/right zone. */}
      <div className="hidden h-12 border-t border-cream/10 lg:block">
        <div className="mx-auto flex h-full max-w-[1440px] items-center px-5 lg:px-10">
          <nav
            aria-label="Product categories"
            className="flex min-w-0 flex-1 items-center justify-center gap-6 overflow-x-auto text-sm"
          >
            {orderedCategories.map((cat) => (
              <Link
                key={cat.id}
                href={cat.href}
                onClick={(e) =>
                  MEGA_MENU_SUBCATEGORIES[cat.slug]
                    ? handleTriggerClick(cat.slug, e)
                    : undefined
                }
                aria-haspopup="true"
                aria-expanded={openKey === cat.slug}
                className="flex h-12 flex-shrink-0 cursor-pointer items-center gap-1 whitespace-nowrap font-medium text-cream no-underline hover:text-gold-bright"
              >
                <span>{cat.navLabel}</span>
                {MEGA_MENU_SUBCATEGORIES[cat.slug] && (
                  <ChevronDownIcon className="opacity-70" />
                )}
              </Link>
            ))}
            <button
              type="button"
              onClick={() => handleTriggerClick("shop-by")}
              aria-haspopup="true"
              aria-expanded={openKey === "shop-by"}
              className="flex h-12 flex-shrink-0 cursor-pointer items-center gap-1 whitespace-nowrap bg-transparent font-medium text-cream hover:text-gold-bright"
            >
              <span>Shop by</span>
              <ChevronDownIcon className="opacity-70" />
            </button>
          </nav>

          <Link
            href="/#showroom"
            className="ml-6 flex-shrink-0 whitespace-nowrap rounded-[2px] bg-gold px-4 py-2 text-[13px] font-semibold tracking-wide text-ink no-underline hover:bg-gold-bright"
          >
            Visit the Showroom
          </Link>
        </div>
      </div>

      {/* Desktop category mega-menu */}
      {openCategory && MEGA_MENU_SUBCATEGORIES[openCategory.slug] && (
        <div className="hidden border-t border-gold/25 bg-forest lg:block">
          <div className="mx-auto flex max-w-[1440px] gap-16 px-10 pb-10 pt-8">
            <div className="grid flex-1 grid-cols-2 gap-x-10 gap-y-3 self-start">
              {MEGA_MENU_SUBCATEGORIES[openCategory.slug].map((sub) => (
                <Link
                  key={sub.slug}
                  href={sub.href}
                  className="w-fit border-b border-transparent py-1 text-sm text-[#e6ede6] no-underline hover:border-gold-bright hover:text-gold-bright"
                >
                  {sub.name}
                </Link>
              ))}
            </div>
            <div className="w-[30%] flex-shrink-0">
              <div className="relative h-40 w-full overflow-hidden rounded-[2px]">
                <PlaceholderBlock label={openCategory.name} tone="dark" />
              </div>
              <div className="mt-3 text-[11px] uppercase tracking-[0.2em] text-gold">
                Explore {openCategory.name}
              </div>
              <div className="mt-3 flex flex-col gap-2">
                <Link
                  href={`/explore/${openCategory.slug}`}
                  className="text-sm text-cream no-underline hover:text-gold-bright"
                >
                  Explore {openCategory.name}
                </Link>
                <Link
                  href={`/${openCategory.slug}`}
                  className="text-sm text-cream no-underline hover:text-gold-bright"
                >
                  Shop All {openCategory.name}
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shop by dropdown */}
      {openKey === "shop-by" && (
        <div className="hidden border-t border-gold/25 bg-forest lg:block">
          <div className="mx-auto grid max-w-[1440px] grid-cols-2 gap-16 px-10 pb-10 pt-8">
            <div>
              <div className="mb-4 text-[11px] uppercase tracking-[0.2em] text-gold">
                Shop by Space
              </div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                {SHOP_BY_SPACE.map((space) => (
                  <Link
                    key={space.slug}
                    href={`/spaces/${space.slug}`}
                    className="flex items-start gap-3 no-underline hover:[&_.space-name]:text-gold-bright"
                  >
                    <span className="mt-0.5 text-gold">
                      <SpaceIcon slug={space.slug} />
                    </span>
                    <span>
                      <span className="space-name block text-sm font-medium text-cream">
                        {space.name}
                      </span>
                      <span className="mt-0.5 block text-xs text-cream/60">
                        {space.description}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-4 flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-[0.2em] text-gold">
                  Shop by Style
                </span>
                <Link href="/styles" className="text-xs text-cream no-underline hover:text-gold-bright">
                  View all styles →
                </Link>
              </div>
              <div className="flex flex-col gap-3">
                {SHOP_BY_STYLE.map((style) => (
                  <Link
                    key={style.slug}
                    href={`/styles/${style.slug}`}
                    className="flex items-center gap-4 rounded-[2px] border border-cream/10 p-2 no-underline hover:border-gold-bright"
                  >
                    <span className="relative h-14 w-20 flex-shrink-0 overflow-hidden rounded-[2px]">
                      <PlaceholderBlock label={style.name} tone="dark" />
                    </span>
                    <span className="text-sm font-medium text-cream">{style.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Design Resources dropdown — 2x2 grid of editorial image tiles */}
      {openKey === "design-resources" && (
        <div className="hidden border-t border-gold/25 bg-forest lg:block">
          <div className="mx-auto grid max-w-[1440px] grid-cols-2 gap-8 px-10 pb-10 pt-8 lg:grid-cols-4">
            {DESIGN_RESOURCE_TILES.map((tile) => (
              <Link key={tile.key} href={tile.href} className="group block no-underline">
                <div className="relative mb-3 aspect-[3/2] w-full overflow-hidden rounded-[2px]">
                  <Image
                    src={resourceTileImageUrl(tile)}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 22vw, 45vw"
                    placeholder={tile.imageId ? "blur" : undefined}
                    blurDataURL={tile.imageId ? UNSPLASH_BLUR_DATA_URL : undefined}
                    className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02]"
                  />
                </div>
                <div className="mb-1 w-fit border-b border-transparent font-serif text-[15px] text-cream group-hover:border-gold-bright group-hover:text-gold-bright">
                  {tile.title}
                </div>
                <div className="text-[12px] text-cream/60">{tile.description}</div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Mobile drawer */}
      {mobileOpen && createPortal(
        <div role="dialog" aria-modal="true" aria-label="Mobile menu" className="fixed inset-0 z-[60] flex bg-forest lg:hidden">
          <div className="flex h-full w-full flex-col overflow-y-auto px-5 py-6">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-serif text-lg text-cream">The Finishing Hub</span>
              <button
                type="button"
                aria-label="Close menu"
                onClick={closeMobile}
                className="flex h-11 w-11 cursor-pointer items-center justify-center text-cream"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="flex flex-col">
              {orderedCategories.map((cat) => {
                const subs = MEGA_MENU_SUBCATEGORIES[cat.slug];
                const expanded = mobileAccordion === cat.slug;
                return (
                  <div key={cat.id} className="border-b border-cream/10">
                    <button
                      type="button"
                      onClick={() => setMobileAccordion(expanded ? null : cat.slug)}
                      aria-expanded={expanded}
                      className="flex min-h-[44px] w-full cursor-pointer items-center justify-between py-3.5 text-left text-sm font-medium text-cream"
                    >
                      {cat.name}
                      {subs && (
                        <ChevronDownIcon
                          className={`transition-transform ${expanded ? "rotate-180" : ""}`}
                        />
                      )}
                    </button>
                    {expanded && subs && (
                      <div className="flex flex-col gap-3 pb-4 pl-2">
                        {subs.map((sub) => (
                          <Link
                            key={sub.slug}
                            href={sub.href}
                            onClick={closeMobile}
                            className="text-sm text-cream/80 no-underline"
                          >
                            {sub.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="border-b border-cream/10">
                <button
                  type="button"
                  onClick={() => setMobileAccordion(mobileAccordion === "shop-by-space" ? null : "shop-by-space")}
                  aria-expanded={mobileAccordion === "shop-by-space"}
                  className="flex min-h-[44px] w-full cursor-pointer items-center justify-between py-3.5 text-left text-sm font-medium text-cream"
                >
                  Shop by Space
                  <ChevronDownIcon
                    className={`transition-transform ${mobileAccordion === "shop-by-space" ? "rotate-180" : ""}`}
                  />
                </button>
                {mobileAccordion === "shop-by-space" && (
                  <div className="flex flex-col gap-3 pb-4 pl-2">
                    {SHOP_BY_SPACE.map((space) => (
                      <Link
                        key={space.slug}
                        href={`/spaces/${space.slug}`}
                        onClick={closeMobile}
                        className="text-sm text-cream/80 no-underline"
                      >
                        {space.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-b border-cream/10">
                <button
                  type="button"
                  onClick={() => setMobileAccordion(mobileAccordion === "shop-by-style" ? null : "shop-by-style")}
                  aria-expanded={mobileAccordion === "shop-by-style"}
                  className="flex min-h-[44px] w-full cursor-pointer items-center justify-between py-3.5 text-left text-sm font-medium text-cream"
                >
                  Shop by Style
                  <ChevronDownIcon
                    className={`transition-transform ${mobileAccordion === "shop-by-style" ? "rotate-180" : ""}`}
                  />
                </button>
                {mobileAccordion === "shop-by-style" && (
                  <div className="flex flex-col gap-3 pb-4 pl-2">
                    {SHOP_BY_STYLE.map((style) => (
                      <Link
                        key={style.slug}
                        href={`/styles/${style.slug}`}
                        onClick={closeMobile}
                        className="text-sm text-cream/80 no-underline"
                      >
                        {style.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              {RIGHT_ZONE_LINKS.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={closeMobile}
                  className="text-sm font-medium text-cream no-underline"
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/account"
                onClick={closeMobile}
                className="text-sm font-medium text-cream no-underline"
              >
                Account
              </Link>
            </div>

            <Link
              href="/#showroom"
              onClick={closeMobile}
              className="mt-6 block rounded-[2px] bg-gold px-5 py-3 text-center text-[13px] font-semibold tracking-wide text-ink no-underline"
            >
              Visit the Showroom
            </Link>
          </div>
        </div>,
        document.body,
      )}
    </header>
  );
}
