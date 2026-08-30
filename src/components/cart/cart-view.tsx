"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { PlaceholderBlock } from "@/components/placeholder-block";
import { Price } from "@/components/price";
import type { FeaturedProduct } from "@/components/category/featured-products-grid";

export type CartLineItem = {
  cartItemId: string;
  productSlug: string;
  name: string;
  config: string;
  quantity: number;
  unitPriceKobo: number;
  imageUrl: string | null;
  imageAlt: string;
};

export function CartView({
  initialItems,
  suggestions,
}: {
  initialItems: CartLineItem[];
  suggestions: FeaturedProduct[];
}) {
  const { ready, setItemQuantity, removeItem } = useCart();
  const [items, setItems] = useState(initialItems);

  function changeQuantity(item: CartLineItem, nextQuantity: number) {
    const clamped = Math.max(1, nextQuantity);
    const delta = clamped - item.quantity;
    if (delta === 0) return;
    setItems((prev) =>
      prev.map((it) => (it.cartItemId === item.cartItemId ? { ...it, quantity: clamped } : it)),
    );
    void setItemQuantity(item.cartItemId, clamped, delta);
  }

  function remove(item: CartLineItem) {
    setItems((prev) => prev.filter((it) => it.cartItemId !== item.cartItemId));
    void removeItem(item.cartItemId, item.quantity);
  }

  if (items.length === 0) {
    return (
      <section className="mx-auto max-w-[640px] px-5 py-[120px] text-center lg:py-[160px]">
        <h1 className="mb-3 font-serif text-3xl font-normal text-ink">Your cart is empty.</h1>
        <p className="mb-[34px] text-[15px] text-[#6b6155]">
          Browse the collection or book a showroom visit to see pieces in person.
        </p>
        <div className="flex flex-wrap justify-center gap-3.5">
          <Link
            href="/#categories"
            className="rounded-[2px] bg-gold px-7 py-[15px] text-sm font-semibold tracking-wide text-forest no-underline hover:bg-gold-bright"
          >
            Shop the collection
          </Link>
          <Link
            href="/#showroom"
            className="rounded-[2px] border border-forest px-7 py-[15px] text-sm font-semibold tracking-wide text-forest no-underline hover:bg-forest hover:text-cream"
          >
            Book a visit
          </Link>
        </div>
      </section>
    );
  }

  const subtotalKobo = items.reduce((sum, it) => sum + it.unitPriceKobo * it.quantity, 0);

  return (
    <>
      <section className="mx-auto max-w-[1440px] px-5 pb-2 pt-6 lg:px-10 lg:pt-8">
        <h1 className="font-serif text-[32px] font-normal text-ink">Your Cart</h1>
      </section>

      <section className="mx-auto grid max-w-[1440px] grid-cols-1 gap-10 px-5 pb-16 pt-5 lg:grid-cols-[2fr_1fr] lg:gap-14 lg:px-10 lg:pb-[100px]">
        <div>
          {items.map((item) => (
            <div
              key={item.cartItemId}
              className="grid grid-cols-[72px_1fr] items-center gap-4 border-b border-[#ddd5c4] py-[22px] sm:grid-cols-[96px_1.6fr_auto_auto_auto] sm:gap-5"
            >
              <div className="relative h-[96px] w-[72px] overflow-hidden bg-[#e2dccf] sm:w-[96px]">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.imageAlt}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                ) : (
                  <PlaceholderBlock label="[ no photo yet ]" />
                )}
              </div>

              <div>
                <Link
                  href={`/products/${item.productSlug}`}
                  className="mb-1 block font-serif text-[17px] text-ink no-underline"
                >
                  {item.name}
                </Link>
                {item.config && (
                  <div className="mb-2 text-[13px] text-[#8a8073]">{item.config}</div>
                )}
                <button
                  type="button"
                  disabled={!ready}
                  onClick={() => remove(item)}
                  className="border-none bg-none p-0 text-[12.5px] text-[#8a8073] underline disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Remove
                </button>
              </div>

              <div className="col-span-2 mt-3 sm:col-span-1 sm:mt-0">
                <div className="inline-flex items-center rounded-[2px] border border-[#cbc2b0]">
                  <button
                    type="button"
                    disabled={!ready}
                    aria-label={`Decrease quantity of ${item.name}`}
                    onClick={() => changeQuantity(item, item.quantity - 1)}
                    className="h-8 w-8 border-none bg-transparent text-sm text-forest disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-[13px]">{item.quantity}</span>
                  <button
                    type="button"
                    disabled={!ready}
                    aria-label={`Increase quantity of ${item.name}`}
                    onClick={() => changeQuantity(item, item.quantity + 1)}
                    className="h-8 w-8 border-none bg-transparent text-sm text-forest disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="hidden whitespace-nowrap font-serif text-sm text-[#6b6155] sm:block">
                <Price kobo={item.unitPriceKobo} alreadyDiscounted hideLabel />
              </div>
              <div className="col-span-2 whitespace-nowrap text-right font-serif text-base text-forest sm:col-span-1">
                <Price kobo={item.unitPriceKobo * item.quantity} alreadyDiscounted />
              </div>
            </div>
          ))}

          {suggestions.length > 0 && (
            <div className="mt-14">
              <h2 className="mb-[22px] font-serif text-xl font-normal text-ink">
                You might also like
              </h2>
              <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
                {suggestions.map((product) => (
                  <Link
                    key={product.id}
                    href={`/products/${product.slug}`}
                    className="block text-inherit no-underline"
                  >
                    <div className="relative mb-3 h-[160px] overflow-hidden bg-[#e2dccf]">
                      {product.imageUrl ? (
                        <Image
                          src={product.imageUrl}
                          alt={product.imageAlt}
                          fill
                          sizes="(min-width: 640px) 33vw, 50vw"
                          className="object-cover"
                        />
                      ) : (
                        <PlaceholderBlock label="[ no photo yet ]" />
                      )}
                    </div>
                    <div className="mb-[3px] font-serif text-[14.5px] text-ink">
                      {product.name}
                    </div>
                    <div className="text-[13px] text-forest">
                      {product.requiresQuote || product.priceKobo == null ? (
                        "Request a Quote"
                      ) : (
                        <Price kobo={product.priceKobo} />
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="mt-12 flex flex-wrap items-center justify-between gap-5 bg-[#ebe5db] px-[30px] py-[26px]">
            <p className="m-0 max-w-[480px] text-sm leading-[1.6] text-[#4a4339]">
              Would rather see these pieces in person before buying? Book a showroom
              visit and a designer will walk you through them.
            </p>
            <Link
              href="/#showroom"
              className="whitespace-nowrap rounded-[2px] border border-forest px-[22px] py-3 text-[13px] font-semibold tracking-wide text-forest no-underline hover:bg-forest hover:text-cream"
            >
              Book a showroom visit
            </Link>
          </div>
        </div>

        <div className="border border-[#ddd5c4] bg-white px-[30px] py-8 lg:sticky lg:top-6">
          <h2 className="mb-6 font-serif text-xl font-normal text-ink">Order Summary</h2>
          <div className="mb-4 flex justify-between text-sm text-[#4a4339]">
            <span>Subtotal</span>
            <span>
              <Price kobo={subtotalKobo} alreadyDiscounted hideLabel />
            </span>
          </div>
          <p className="mb-5 text-[12.5px] leading-[1.6] text-[#8a8073]">
            Delivery cost is confirmed with the showroom before payment.
          </p>
          <div className="mb-6 flex justify-between border-t border-[#ddd5c4] pt-4 font-serif text-[19px] text-ink">
            <span>Total</span>
            <span>
              <Price kobo={subtotalKobo} alreadyDiscounted />
            </span>
          </div>
          <Link
            href="/checkout"
            className="mb-[18px] block w-full rounded-[2px] bg-gold px-4 py-4 text-center font-sans text-sm font-semibold tracking-wide text-forest no-underline hover:bg-gold-bright"
          >
            Proceed to Checkout
          </Link>
          <div className="text-center text-[12.5px] leading-[1.8] text-[#8a8073]">
            <div>
              Pay securely online with Paystack, or call +234 (0) 803 311 7302 to
              arrange payment.
            </div>
            <div>
              Questions?{" "}
              <Link href="#" className="text-forest">
                Speak to the trade desk
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
