"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { createClient } from "@/lib/supabase/client";
import { formatNaira } from "@/lib/format";
import { LoginForm } from "@/components/account/login-form";
import { SignupForm } from "@/components/account/signup-form";
import type { CartLineItem } from "@/components/cart/cart-view";

// create_order (see supabase/migrations/20260829090000_customer_checkout.sql)
// raises these as plain exception messages — map to copy a customer can act
// on. Anything else falls through to a generic message.
function friendlyOrderError(message: string): string {
  if (message.includes("CART_HAS_QUOTE_ITEMS")) {
    return "Your cart has an item that needs a quote before it can be ordered online — remove it, or call the showroom to arrange it, then try again.";
  }
  if (message.includes("CART_EMPTY")) {
    return "Your cart is empty.";
  }
  if (message.includes("ANONYMOUS_CHECKOUT_BLOCKED") || message.includes("NOT_AUTHENTICATED")) {
    return "Please sign in to complete checkout.";
  }
  return "Something went wrong placing your order — please try again or call +234 (0) 803 311 7302.";
}

function OrderSummary({ items }: { items: CartLineItem[] }) {
  const subtotalKobo = items.reduce((sum, it) => sum + it.unitPriceKobo * it.quantity, 0);

  return (
    <div className="border border-[#ddd5c4] bg-white px-[30px] py-8 lg:sticky lg:top-6">
      <h2 className="mb-6 font-serif text-xl font-normal text-ink">Order Summary</h2>
      <div className="mb-6 flex flex-col gap-3">
        {items.map((item) => (
          <div key={item.cartItemId} className="flex justify-between gap-3 text-sm">
            <span className="text-[#4a4339]">
              {item.name}
              {item.config && <span className="text-[#8a8073]"> — {item.config}</span>}
              <span className="text-[#8a8073]"> × {item.quantity}</span>
            </span>
            <span className="whitespace-nowrap text-[#6b6155]">
              {formatNaira(item.unitPriceKobo * item.quantity)}
            </span>
          </div>
        ))}
      </div>
      <p className="mb-5 text-[12.5px] leading-[1.6] text-[#8a8073]">
        Delivery cost is confirmed with the showroom before payment.
      </p>
      <div className="flex justify-between border-t border-[#ddd5c4] pt-4 font-serif text-[19px] text-ink">
        <span>Total</span>
        <span>{formatNaira(subtotalKobo)}</span>
      </div>
    </div>
  );
}

function EmptyCheckout() {
  return (
    <section className="mx-auto max-w-[640px] px-5 py-[120px] text-center lg:py-[160px]">
      <h1 className="mb-3 font-serif text-3xl font-normal text-ink">Your cart is empty.</h1>
      <p className="mb-[34px] text-[15px] text-[#6b6155]">
        Add something to your cart before checking out.
      </p>
      <Link
        href="/#categories"
        className="inline-block rounded-[2px] bg-gold px-7 py-[15px] text-sm font-semibold tracking-wide text-forest no-underline hover:bg-gold-bright"
      >
        Shop the collection
      </Link>
    </section>
  );
}

function SuccessState({ orderNumber }: { orderNumber: string | null }) {
  return (
    <section className="mx-auto max-w-[560px] px-5 py-[100px] text-center lg:py-[140px]">
      <h1 className="mb-3 font-serif text-3xl font-normal text-ink">Order received.</h1>
      {orderNumber && (
        <p className="mb-2 font-mono text-sm text-[#6b6155]">{orderNumber}</p>
      )}
      <p className="mb-[34px] text-[15px] leading-[1.7] text-[#6b6155]">
        We&apos;ll call you shortly to confirm delivery and complete payment. Your cart
        is untouched, in case you&apos;d like to keep browsing and add to the order.
      </p>
      <Link
        href="/account"
        className="inline-block rounded-[2px] bg-forest px-7 py-[15px] text-sm font-semibold tracking-wide text-cream no-underline hover:bg-deep-forest"
      >
        View my orders
      </Link>
    </section>
  );
}

function AuthGate({ items }: { items: CartLineItem[] }) {
  const [mode, setMode] = useState<"signup" | "login">("signup");

  // SignupForm shows its own "check your email" terminal state (this
  // project requires email confirmation — is_anonymous only flips once
  // that link is clicked, so there's nothing to hand back here). LoginForm
  // succeeds instantly instead — it doesn't need to *do* anything on
  // success either: CartProvider's onAuthStateChange listener flips
  // useCart().isAnonymous the moment the session updates, which re-renders
  // CheckoutView straight into the real form below.
  const noop = () => {};

  return (
    <section className="mx-auto grid max-w-[1000px] grid-cols-1 gap-10 px-5 py-12 lg:grid-cols-[1.2fr_1fr] lg:gap-14 lg:py-16">
      <div>
        <h1 className="mb-2 font-serif text-[28px] font-normal text-ink">
          Sign in to check out
        </h1>
        <p className="mb-7 text-[15px] leading-[1.6] text-[#6b6155]">
          Create an account or sign in to complete your order — the items already in
          your cart will carry over.
        </p>
        <div className="mb-6 flex gap-1 border-b border-[#ddd5c4]">
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`border-b-2 px-1 py-2.5 text-sm font-semibold tracking-wide ${
              mode === "signup"
                ? "border-forest text-forest"
                : "border-transparent text-[#8a8073]"
            }`}
          >
            Create account
          </button>
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`ml-5 border-b-2 px-1 py-2.5 text-sm font-semibold tracking-wide ${
              mode === "login"
                ? "border-forest text-forest"
                : "border-transparent text-[#8a8073]"
            }`}
          >
            Sign in
          </button>
        </div>
        {mode === "signup" ? (
          <SignupForm />
        ) : (
          <>
            <LoginForm onSuccess={noop} />
            <Link
              href="/account/forgot-password"
              className="mt-3.5 inline-block text-[13px] text-[#6b6155] underline"
            >
              Forgot password?
            </Link>
          </>
        )}
      </div>
      <OrderSummary items={items} />
    </section>
  );
}

export function CheckoutView({
  initialItems,
  initialEmail,
}: {
  initialItems: CartLineItem[];
  initialEmail: string | null;
}) {
  const { ready, isAnonymous, email: contextEmail } = useCart();
  const [name, setName] = useState("");
  const [email, setEmail] = useState(initialEmail ?? "");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState<"idle" | "pending" | "error" | "success">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  // Pre-fill from the reactive account email once it's known (covers
  // signing in from this same page, where contextEmail only becomes
  // non-null after the auth gate resolves) — but don't clobber anything
  // the customer has already typed.
  useEffect(() => {
    if (contextEmail && !email) setEmail(contextEmail);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contextEmail]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("pending");
    setErrorMessage(null);

    const supabase = createClient();
    // create_order returns `orders` (a single row, not SETOF) — PostgREST
    // hands that back as a plain object already, not an array, so no
    // `.single()` unwrap is needed (or valid) here.
    const { data, error } = await supabase.rpc("create_order", {
      p_customer_name: name.trim(),
      p_customer_email: email.trim(),
      p_customer_phone: phone.trim(),
      p_shipping_address: { address: address.trim() },
    });

    if (error) {
      setStatus("error");
      setErrorMessage(friendlyOrderError(error.message));
      return;
    }

    setOrderNumber((data as { order_number: string } | null)?.order_number ?? null);
    setStatus("success");
  }

  if (!ready) {
    return <div className="px-5 py-24 text-center text-sm text-[#8a8073]">Loading…</div>;
  }

  if (status === "success") {
    return <SuccessState orderNumber={orderNumber} />;
  }

  if (initialItems.length === 0) {
    return <EmptyCheckout />;
  }

  if (isAnonymous) {
    return <AuthGate items={initialItems} />;
  }

  return (
    <section className="mx-auto grid max-w-[1200px] grid-cols-1 gap-10 px-5 py-12 lg:grid-cols-[1.4fr_1fr] lg:gap-14 lg:px-10 lg:py-16">
      <div>
        <h1 className="mb-7 font-serif text-[28px] font-normal text-ink">Checkout</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="checkout-name"
              className="mb-1.5 block text-xs uppercase tracking-[0.08em] text-[#6b6155]"
            >
              Full name
            </label>
            <input
              id="checkout-name"
              required
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-[2px] border border-[#cfc6b6] bg-white px-4 py-3 font-sans text-sm text-ink outline-none focus:border-forest"
            />
          </div>
          <div>
            <label
              htmlFor="checkout-email"
              className="mb-1.5 block text-xs uppercase tracking-[0.08em] text-[#6b6155]"
            >
              Email
            </label>
            <input
              id="checkout-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-[2px] border border-[#cfc6b6] bg-white px-4 py-3 font-sans text-sm text-ink outline-none focus:border-forest"
            />
          </div>
          <div>
            <label
              htmlFor="checkout-phone"
              className="mb-1.5 block text-xs uppercase tracking-[0.08em] text-[#6b6155]"
            >
              Phone
            </label>
            <input
              id="checkout-phone"
              type="tel"
              required
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-[2px] border border-[#cfc6b6] bg-white px-4 py-3 font-sans text-sm text-ink outline-none focus:border-forest"
            />
          </div>
          <div>
            <label
              htmlFor="checkout-address"
              className="mb-1.5 block text-xs uppercase tracking-[0.08em] text-[#6b6155]"
            >
              Delivery address
            </label>
            <textarea
              id="checkout-address"
              required
              rows={3}
              autoComplete="street-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street, area, city, state"
              className="w-full resize-none rounded-[2px] border border-[#cfc6b6] bg-white px-4 py-3 font-sans text-sm text-ink outline-none focus:border-forest"
            />
            <p className="mt-1.5 text-[12.5px] text-[#8a8073]">
              We&apos;ll call you to confirm delivery — no cost is calculated here.
            </p>
          </div>

          {status === "error" && (
            <p className="text-[13px] text-[#b3261e]">
              {errorMessage ?? "Something went wrong — please try again."}
            </p>
          )}

          <button
            type="submit"
            disabled={status === "pending"}
            className="mt-2 rounded-[2px] bg-gold px-4 py-4 font-sans text-sm font-semibold tracking-wide text-forest hover:bg-gold-bright disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === "pending" ? "Placing order…" : "Place Order"}
          </button>
          <p className="text-center text-[12.5px] leading-[1.7] text-[#8a8073]">
            Payment isn&apos;t collected here yet — we&apos;ll call you at
            +234 (0) 803 311 7302 to confirm and complete payment.
          </p>
        </form>
      </div>
      <OrderSummary items={initialItems} />
    </section>
  );
}
