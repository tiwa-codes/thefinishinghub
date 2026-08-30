import Link from "next/link";
import type { Metadata } from "next";
import { SiteNavSection } from "@/components/site-nav-section";
import { SiteFooterSection } from "@/components/site-footer-section";
import { createClient } from "@/lib/supabase/server";
import { confirmPayment } from "@/lib/paystack";

// Reads real order state on every visit — never trust the mere fact that
// Paystack redirected here as proof of payment.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Payment — The Finishing Hub" };

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-cream font-sans text-ink antialiased">
      <SiteNavSection />
      <section className="mx-auto max-w-[560px] px-5 py-[100px] text-center lg:py-[140px]">
        {children}
      </section>
      <SiteFooterSection />
    </div>
  );
}

function AccountLink({ label }: { label: string }) {
  return (
    <Link
      href="/account"
      className="inline-block rounded-[2px] bg-forest px-7 py-[15px] text-sm font-semibold tracking-wide text-cream no-underline hover:bg-deep-forest"
    >
      {label}
    </Link>
  );
}

export default async function CheckoutCallbackPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const rawRef = searchParams.reference ?? searchParams.trxref;
  const reference = Array.isArray(rawRef) ? rawRef[0] : rawRef;

  if (!reference) {
    return (
      <Shell>
        <h1 className="mb-3 font-serif text-3xl font-normal text-ink">
          Something went wrong.
        </h1>
        <p className="mb-[34px] text-[15px] leading-[1.7] text-[#6b6155]">
          No payment reference was provided.
        </p>
        <AccountLink label="View my orders" />
      </Shell>
    );
  }

  // By payment_reference, not order_number — Paystack references are
  // order_number plus a unique per-attempt suffix (see
  // initializeOrderPayment in lib/paystack.ts), so what Paystack sends
  // back here won't match order_number directly.
  const supabase = createClient();
  const { data: order } = await supabase
    .from("orders")
    .select("order_number, status")
    .eq("payment_reference", reference)
    .maybeSingle();

  if (!order) {
    return (
      <Shell>
        <h1 className="mb-3 font-serif text-3xl font-normal text-ink">
          We couldn&apos;t find that order.
        </h1>
        <p className="mb-[34px] text-[15px] leading-[1.7] text-[#6b6155]">
          If you were charged, contact the showroom and we&apos;ll sort it out.
        </p>
        <AccountLink label="View my orders" />
      </Shell>
    );
  }

  let paid = order.status === "paid";
  let failureReason: string | null = null;

  if (!paid) {
    // The webhook may already be en route, or may never land (misconfig,
    // network blip) — same idempotent function either way, so whichever
    // path gets there first is fine and neither can double-apply it.
    const result = await confirmPayment(reference);
    if (result.outcome === "paid" || result.outcome === "already_paid") {
      paid = true;
    } else if (result.outcome === "verification_failed") {
      failureReason = "Payment wasn't completed.";
    } else if (result.outcome === "amount_mismatch") {
      failureReason = "Something doesn't match up with this payment — please contact the showroom.";
    } else {
      failureReason = "We couldn't find that order.";
    }
  }

  if (paid) {
    return (
      <Shell>
        <h1 className="mb-3 font-serif text-3xl font-normal text-ink">
          Payment confirmed.
        </h1>
        <p className="mb-2 font-mono text-sm text-[#6b6155]">{order.order_number}</p>
        <p className="mb-[34px] text-[15px] leading-[1.7] text-[#6b6155]">
          Thank you — we&apos;ll be in touch to arrange delivery.
        </p>
        <AccountLink label="View my orders" />
      </Shell>
    );
  }

  return (
    <Shell>
      <h1 className="mb-3 font-serif text-3xl font-normal text-ink">
        Payment wasn&apos;t completed.
      </h1>
      <p className="mb-2 font-mono text-sm text-[#6b6155]">{order.order_number}</p>
      <p className="mb-[34px] text-[15px] leading-[1.7] text-[#6b6155]">
        {failureReason ?? "Payment wasn't completed."} Your order is still saved —
        you can try again from your account.
      </p>
      <AccountLink label="View my orders" />
    </Shell>
  );
}
