"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ListingBreadcrumb, type BreadcrumbCrumb } from "@/components/listing/listing-breadcrumb";
import { NewArrivalsGrid, type NewArrivalProductCard } from "@/components/home/new-arrivals-grid";
import { ProductGallery, type GalleryImage } from "./product-gallery";
import { VariantSelector, type ProductVariant } from "./variant-selector";
import { WishlistButton } from "./wishlist-button";
import { useCart } from "@/lib/cart-context";
import { Price } from "@/components/price";

const SHOWROOM_PHONE_DISPLAY = "+234 (0) 803 311 7302";
const SHOWROOM_PHONE_TEL = "tel:+2348033117302";
const ADD_TO_CART_SUCCESS_MS = 1500;

function ShieldIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3Z"></path>
    </svg>
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

  return (
    <>
      <section className="mx-auto max-w-[1440px] px-5 pt-6 lg:px-10 lg:pt-8">
        <ListingBreadcrumb crumbs={breadcrumb} />
      </section>

      <section className="mx-auto grid max-w-[1440px] grid-cols-1 gap-10 px-5 pt-4 lg:grid-cols-[1.25fr_1fr] lg:gap-16 lg:px-10 lg:pt-[30px]">
        <ProductGallery images={images} productName={name} videoUrl={videoUrl} />

        <div className="pt-1">
          <div className="mb-3.5 font-mono text-[11px] uppercase tracking-[0.14em] text-[#9a8a5c]">
            {categoryName}
            {styleName && <span> · {styleName}</span>}
          </div>

          <h1 className="mb-3 font-serif text-3xl font-normal leading-[1.1] text-ink lg:text-4xl">
            {name}
          </h1>

          <div className="mb-4 font-serif text-2xl text-forest">
            {selectedVariant?.priceKobo == null ? (
              <span className="text-[#8a8073]">Price on request</span>
            ) : (
              <Price kobo={selectedVariant.priceKobo} />
            )}
          </div>

          {warrantyYears != null && (
            <div className="mb-2.5 flex items-center gap-2 text-gold">
              <ShieldIcon />
              <span className="text-sm font-bold">{warrantyYears}-Year Warranty</span>
            </div>
          )}

          {origin && (
            <div className="mb-6 flex items-center gap-2 text-[#4a4339]">
              <span className="h-2 w-2 rounded-full bg-forest" aria-hidden="true"></span>
              <span className="text-sm">Made in {origin}</span>
            </div>
          )}

          <VariantSelector
            variants={variants}
            selectedId={selectedVariant?.id ?? ""}
            onSelect={setSelectedVariantId}
          />

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

          <WishlistButton productId={productId} />

          <Link
            href="/#showroom"
            className="mt-3 block rounded-[2px] border border-forest px-5 py-4 text-center font-sans text-sm font-semibold tracking-wide text-forest no-underline hover:bg-forest hover:text-cream"
          >
            Book a viewing at the showroom
          </Link>

          {description && (
            <>
              <div className="my-7 border-t border-[#ddd5c4]" />
              <p className="mb-2 text-[15px] leading-[1.7] text-[#4a4339]">{description}</p>
            </>
          )}

          {/* TODO: add a features[] column to products — until then, there's
              no structured way to render a feature list, so this section
              is skipped entirely rather than guessing from free text. */}

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

      {/* Showroom editorial banner */}
      <section className="mt-16 bg-forest text-cream lg:mt-20">
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
