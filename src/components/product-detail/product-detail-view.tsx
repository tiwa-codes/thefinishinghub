"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ListingBreadcrumb, type BreadcrumbCrumb } from "@/components/listing/listing-breadcrumb";
import { NewArrivalsGrid, type NewArrivalProductCard } from "@/components/home/new-arrivals-grid";
import { ProductGallery, type GalleryImage } from "./product-gallery";
import { VariantSelector, type ProductVariant } from "./variant-selector";
import { WishlistButton } from "./wishlist-button";
import { ShareRow } from "./share-row";
import { useCart } from "@/lib/cart-context";
import { Price } from "@/components/price";

const SHOWROOM_PHONE_DISPLAY = "+234 (0) 803 311 7302";
const SHOWROOM_PHONE_TEL = "tel:+2348033117302";
const SHOWROOM_WHATSAPP = "https://wa.me/2348033117302";
const ADD_TO_CART_SUCCESS_MS = 1500;

type Dimensions = { width_cm?: number; depth_cm?: number; height_cm?: number } | null;

function ShieldIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3Z"></path>
    </svg>
  );
}

function FactoryIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 21V10l6 4v-4l6 4v-4l6 4v7H3Z"></path>
      <path d="M7 21v-4M12 21v-4M17 21v-4"></path>
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3.5" y="5" width="17" height="15" rx="1.5"></rect>
      <path d="M3.5 9.5h17M8 3v4M16 3v4"></path>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="flex-shrink-0 text-gold">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  );
}

function DividedSection({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto max-w-[1440px] border-t border-[#ddd5c4] px-5 py-10 lg:px-10 lg:py-12">
      <h2 className="mb-6 font-serif text-xl font-normal text-ink">{heading}</h2>
      {children}
    </section>
  );
}

export function ProductDetailView({
  productId,
  breadcrumb,
  categoryName,
  styleName,
  name,
  description,
  warrantyYears,
  origin,
  videoUrl,
  dimensions,
  weightKg,
  materials,
  careInstructions,
  leadTimeDays,
  features,
  manufacturer,
  collection,
  productSlug,
  images,
  variants,
  defaultVariantId,
  related,
}: {
  productId: string;
  breadcrumb: BreadcrumbCrumb[];
  categoryName: string;
  styleName: string | null;
  name: string;
  description: string | null;
  warrantyYears: number | null;
  origin: string | null;
  videoUrl: string | null;
  dimensions: Dimensions;
  weightKg: number | null;
  materials: string | null;
  careInstructions: string | null;
  leadTimeDays: number | null;
  features: string[] | null;
  manufacturer: string | null;
  collection: string | null;
  productSlug: string;
  images: GalleryImage[];
  variants: ProductVariant[];
  defaultVariantId: string;
  related: NewArrivalProductCard[];
}) {
  const { add, ready } = useCart();
  const [selectedVariantId, setSelectedVariantId] = useState(defaultVariantId);
  const [quantity, setQuantity] = useState(1);
  const [pending, setPending] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const selectedVariant = useMemo(
    () => variants.find((v) => v.id === selectedVariantId) ?? variants[0],
    [variants, selectedVariantId],
  );

  const outOfStock = selectedVariant ? !selectedVariant.inStock : false;
  const needsQuote = selectedVariant
    ? selectedVariant.requiresQuote || selectedVariant.priceKobo == null
    : false;
  const addDisabled = !ready || pending || outOfStock || !selectedVariant;

  const specs = selectedVariant
    ? [
        { label: "Finish", value: selectedVariant.finish },
        { label: "Colour", value: selectedVariant.color },
        { label: "Size", value: selectedVariant.size },
      ].filter((s) => s.value)
    : [];

  async function handleAddToCart() {
    if (!selectedVariant) return;
    setPending(true);
    try {
      await add(selectedVariant.id, quantity);
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), ADD_TO_CART_SUCCESS_MS);
    } finally {
      setPending(false);
    }
  }

  const dimensionParts = dimensions
    ? [dimensions.width_cm, dimensions.depth_cm, dimensions.height_cm].filter(
        (v): v is number => v != null,
      )
    : [];
  const dimensionsLabel = dimensionParts.length > 0 ? `${dimensionParts.join(" × ")} cm` : null;

  const specRows = [
    { label: "Dimensions", value: dimensionsLabel },
    { label: "Weight", value: weightKg != null ? `${weightKg} kg` : null },
    { label: "Materials", value: materials },
    { label: "Manufacturer", value: manufacturer },
    { label: "Origin", value: origin },
    { label: "Warranty", value: warrantyYears != null ? `${warrantyYears} years` : null },
  ].filter((row) => row.value);

  const hasFeatures = Array.isArray(features) && features.length > 0;
  const leadTimeLabel = leadTimeDays != null ? `${leadTimeDays} days` : "4–6 weeks";

  return (
    <>
      <section className="mx-auto max-w-[1440px] px-5 pt-6 lg:px-10 lg:pt-8">
        <ListingBreadcrumb crumbs={breadcrumb} />
      </section>

      <section className="mx-auto grid max-w-[1440px] grid-cols-1 gap-10 px-5 pt-4 lg:grid-cols-[1.25fr_1fr] lg:gap-16 lg:px-10 lg:pt-[30px]">
        <ProductGallery images={images} productName={name} videoUrl={videoUrl} />

        <div className="pt-1">
          {collection && (
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              {collection}
            </div>
          )}

          <div className="mb-3.5 font-mono text-[11px] uppercase tracking-[0.14em] text-[#9a8a5c]">
            {categoryName}
            {styleName && <span> · {styleName}</span>}
          </div>

          <h1 className="mb-3 font-serif text-3xl font-normal leading-[1.1] text-ink lg:text-4xl">
            {name}
          </h1>

          <div className="mb-4 font-serif text-2xl text-forest">
            {needsQuote ? (
              <span className="text-[#8a8073]">Price on request</span>
            ) : (
              <Price kobo={selectedVariant!.priceKobo as number} />
            )}
          </div>

          {warrantyYears != null && (
            <div className="mb-2.5 flex items-center gap-2 text-gold">
              <ShieldIcon />
              <span className="text-sm font-bold">{warrantyYears}-Year Warranty</span>
            </div>
          )}

          {origin && (
            <div className="mb-2.5 flex items-center gap-2 text-[#4a4339]">
              <span className="h-2 w-2 rounded-full bg-forest" aria-hidden="true"></span>
              <span className="text-sm">Made in {origin}</span>
            </div>
          )}

          {manufacturer && (
            <div className="mb-6 flex items-center gap-2 text-[#8a8073]">
              <FactoryIcon />
              <span className="text-sm">By {manufacturer}</span>
            </div>
          )}

          <VariantSelector
            variants={variants}
            selectedId={selectedVariant?.id ?? ""}
            onSelect={setSelectedVariantId}
          />

          {needsQuote ? (
            <>
              <a
                href={`${SHOWROOM_WHATSAPP}?text=${encodeURIComponent(
                  `Hi, I'm interested in the ${name}. Could you share pricing?`,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mb-3 block w-full cursor-pointer rounded-[2px] bg-gold px-5 py-4 text-center font-sans text-sm font-semibold tracking-wide text-ink no-underline hover:bg-gold-bright"
              >
                Request a Quote
              </a>
              <Link
                href={SHOWROOM_PHONE_TEL}
                className="mb-3 block text-center text-sm font-medium text-forest no-underline hover:underline"
              >
                Call us — {SHOWROOM_PHONE_DISPLAY}
              </Link>
            </>
          ) : (
            <>
              <div className="mb-[30px]">
                <div className="mb-3 text-xs uppercase tracking-[0.1em] text-[#6b6155]">
                  Quantity
                </div>
                <div className="inline-flex items-center rounded-[2px] border border-[#cbc2b0]">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="h-10 w-10 cursor-pointer border-none bg-transparent text-base text-forest"
                  >
                    −
                  </button>
                  <span className="w-11 text-center text-sm font-medium">{quantity}</span>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                    className="h-10 w-10 cursor-pointer border-none bg-transparent text-base text-forest"
                  >
                    +
                  </button>
                </div>
              </div>

              {outOfStock ? (
                <button
                  type="button"
                  disabled
                  className="mb-3 w-full cursor-not-allowed rounded-[2px] bg-[#cbc2b0] px-5 py-4 font-sans text-sm font-semibold tracking-wide text-[#8a8073]"
                >
                  Out of Stock
                </button>
              ) : (
                <button
                  type="button"
                  disabled={addDisabled}
                  onClick={handleAddToCart}
                  className="mb-3 w-full cursor-pointer rounded-[2px] bg-gold px-5 py-4 font-sans text-sm font-semibold tracking-wide text-ink hover:bg-gold-bright disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {justAdded ? "Added ✓" : "Add to Cart"}
                </button>
              )}
            </>
          )}

          <WishlistButton productId={productId} />

          <Link
            href="/#showroom"
            className="mt-4 flex cursor-pointer items-center gap-1.5 text-sm text-[#8a8073] no-underline hover:text-forest"
          >
            <CalendarIcon />
            Book a showroom viewing →
          </Link>

          {description && (
            <>
              <div className="my-7 border-t border-[#ddd5c4]" />
              <p className="mb-2 text-[15px] leading-[1.7] text-[#4a4339]">{description}</p>
            </>
          )}

          {specs.length > 0 && (
            <div className="mt-7 flex flex-col gap-1.5 border-t border-[#ddd5c4] pt-6 text-sm">
              {specs.map((spec) => (
                <div key={spec.label} className="flex gap-3">
                  <span className="min-w-[60px] text-[#8a8073]">{spec.label}</span>
                  <span className="text-ink">{spec.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Section A — Features */}
      {hasFeatures && (
        <DividedSection heading="Features">
          <div className="grid grid-cols-1 gap-x-10 gap-y-3 sm:grid-cols-2">
            {features!.map((feature) => (
              <div key={feature} className="flex items-start gap-2.5 text-[15px] text-[#4a4339]">
                <span className="mt-0.5">
                  <CheckIcon />
                </span>
                {feature}
              </div>
            ))}
          </div>
        </DividedSection>
      )}

      {/* Section B — Specifications */}
      {specRows.length > 0 && (
        <DividedSection heading="Specifications">
          <dl className="grid grid-cols-1 gap-x-10 gap-y-3 sm:grid-cols-2">
            {specRows.map((row) => (
              <div key={row.label} className="flex gap-4 border-b border-[#eee7d8] pb-3">
                <dt className="min-w-[120px] text-sm text-[#8a8073]">{row.label}</dt>
                <dd className="text-sm text-ink">{row.value}</dd>
              </div>
            ))}
          </dl>
        </DividedSection>
      )}

      {/* Section C — Care & Maintenance */}
      {careInstructions && (
        <DividedSection heading="Care & Maintenance">
          <p className="max-w-2xl text-[15px] leading-[1.8] text-[#4a4339]">{careInstructions}</p>
        </DividedSection>
      )}

      {/* Section D — Delivery & Lead Time (always rendered) */}
      <DividedSection heading="Delivery">
        <p className="mb-3 max-w-2xl text-[15px] leading-[1.8] text-[#4a4339]">
          We deliver nationwide across Nigeria. Standard lead time for furniture is{" "}
          {leadTimeLabel} from order confirmation. White-glove delivery and installation is
          available in Abuja — contact us to arrange.
        </p>
        <p className="text-sm text-[#8a8073]">
          Questions? Call {SHOWROOM_PHONE_DISPLAY} or visit the showroom.
        </p>
      </DividedSection>

      {/* Section E — Share */}
      <DividedSection heading="Share">
        <ShareRow productName={name} productSlug={productSlug} />
      </DividedSection>

      {/* Showroom editorial banner — between Share and Related Products */}
      <section className="bg-forest text-cream">
        <div className="mx-auto flex max-w-[1440px] flex-col items-start justify-between gap-6 px-5 py-14 lg:flex-row lg:items-center lg:px-10 lg:py-16">
          <div>
            <div className="mb-3 text-xs uppercase tracking-[0.25em] text-gold-bright">
              Visit our showroom
            </div>
            <h2 className="max-w-[520px] font-serif text-2xl font-normal leading-[1.2] text-cream lg:text-[32px]">
              See this piece in person before you commit.
            </h2>
          </div>
          <Link
            href={SHOWROOM_PHONE_TEL}
            className="flex-shrink-0 cursor-pointer whitespace-nowrap rounded-[2px] border-2 border-gold px-7 py-3.5 text-sm font-semibold uppercase tracking-wide text-cream no-underline transition-colors duration-200 hover:bg-gold hover:text-ink"
          >
            Book a Visit — {SHOWROOM_PHONE_DISPLAY}
          </Link>
        </div>
      </section>

      {related.length > 0 && (
        <section className="mx-auto max-w-[1440px] px-5 py-14 lg:px-10 lg:py-20">
          <h2 className="mb-8 font-serif text-2xl font-normal text-ink lg:text-[28px]">
            You might also like
          </h2>
          <NewArrivalsGrid products={related} />
        </section>
      )}
    </>
  );
}
