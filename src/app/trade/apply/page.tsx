import Link from "next/link";
import type { Metadata } from "next";
import { SiteNavSection } from "@/components/site-nav-section";
import { SiteFooterSection } from "@/components/site-footer-section";
import { createClient } from "@/lib/supabase/server";
import { TradeApplyForm } from "@/components/trade/trade-apply-form";

export const metadata: Metadata = { title: "Apply for Trade Pricing — The Finishing Hub" };

const STATUS_COPY: Record<string, string> = {
  pending: "Your application is under review — we'll follow up soon.",
  approved: "Your trade account is approved. Trade pricing is already applied across the site.",
  rejected: "Your application wasn't approved. Contact the trade desk if you'd like to discuss it.",
};

export default async function TradeApplyPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="bg-cream font-sans text-ink antialiased">
      <SiteNavSection />
      <section className="mx-auto max-w-[520px] px-5 py-16 lg:py-24">
        <h1 className="mb-3 font-serif text-3xl font-normal text-ink">Apply for Trade Pricing</h1>
        <p className="mb-8 text-[15px] leading-[1.7] text-[#6b6155]">
          Interior designers, architects, contractors and developers can apply for a
          dedicated trade account with negotiated pricing across all five categories.
        </p>

        {!user || user.is_anonymous ? (
          <div>
            <p className="mb-5 text-[15px] text-[#6b6155]">
              Sign in or create an account first — trade pricing is tied to your account.
            </p>
            <Link
              href="/account/login?redirect=/trade/apply"
              className="inline-block rounded-[2px] bg-forest px-6 py-3.5 text-sm font-semibold tracking-wide text-cream no-underline hover:bg-deep-forest"
            >
              Sign in
            </Link>
          </div>
        ) : (
          <TradeApplySection userId={user.id} />
        )}
      </section>
      <SiteFooterSection />
    </div>
  );
}

async function TradeApplySection({ userId }: { userId: string }) {
  const supabase = createClient();
  const { data: existing } = await supabase
    .from("trade_accounts")
    .select("status")
    .eq("id", userId)
    .maybeSingle();

  if (existing) {
    return (
      <p className="text-[15px] leading-[1.7] text-[#4a4339]">
        {STATUS_COPY[existing.status] ?? `Application status: ${existing.status}`}
      </p>
    );
  }

  return <TradeApplyForm userId={userId} />;
}
