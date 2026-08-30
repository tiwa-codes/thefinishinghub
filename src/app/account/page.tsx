import Link from "next/link";
import type { Metadata } from "next";
import { SiteNavSection } from "@/components/site-nav-section";
import { SiteFooterSection } from "@/components/site-footer-section";
import { createClient } from "@/lib/supabase/server";
import { formatNaira } from "@/lib/format";
import { PayNowButton } from "@/components/checkout/pay-now-button";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";
import { QuoteRequestsSection, type QuoteRequestRow } from "@/components/account/quote-requests-section";

export const metadata: Metadata = {
  title: "My Account — The Finishing Hub",
};

type OrderRow = {
  id: string;
  order_number: string;
  status: string;
  total_kobo: number;
  created_at: string;
  order_items: {
    id: string;
    product_name_snapshot: string;
    variant_label_snapshot: string | null;
    unit_price_kobo: number;
    quantity: number;
  }[];
};

export default async function AccountPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Anonymous sessions (every first-time visitor gets one via
  // CartProvider) satisfy `user` but have no real order history —
  // gate on is_anonymous, not just presence of a session, same
  // reasoning as the /admin staff gate distinguishing "logged in" from
  // "actually staff."
  if (!user || user.is_anonymous) {
    return (
      <div className="bg-cream font-sans text-ink antialiased">
        <SiteNavSection />
        <section className="mx-auto max-w-[480px] px-5 py-24 text-center">
          <h1 className="mb-3 font-serif text-2xl text-ink">My Account</h1>
          <p className="mb-7 text-[15px] text-[#6b6155]">
            Sign in to see your order history.
          </p>
          <Link
            href="/account/login?redirect=/account"
            className="inline-block rounded-[2px] bg-forest px-6 py-3.5 text-sm font-semibold tracking-wide text-cream no-underline hover:bg-deep-forest"
          >
            Sign in
          </Link>
        </section>
        <SiteFooterSection />
      </div>
    );
  }

  const { data: orders } = await supabase
    .from("orders")
    .select(
      `
      id,
      order_number,
      status,
      total_kobo,
      created_at,
      order_items ( id, product_name_snapshot, variant_label_snapshot, unit_price_kobo, quantity )
    `,
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .returns<OrderRow[]>();

  const { data: quoteRequestRows } = await supabase
    .from("quote_requests")
    .select(
      `
      id, status, message, quoted_price_kobo, quoted_notes, created_at,
      products ( name ),
      product_variants ( finish, color, size ),
      orders ( order_number )
    `,
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .returns<
      {
        id: string;
        status: string;
        message: string | null;
        quoted_price_kobo: number | null;
        quoted_notes: string | null;
        created_at: string;
        products: { name: string } | null;
        product_variants: { finish: string | null; color: string | null; size: string | null } | null;
        orders: { order_number: string } | null;
      }[]
    >();

  const quoteRequests: QuoteRequestRow[] = (quoteRequestRows ?? []).map((r) => ({
    id: r.id,
    status: r.status,
    message: r.message,
    quoted_price_kobo: r.quoted_price_kobo,
    quoted_notes: r.quoted_notes,
    created_at: r.created_at,
    product_name: r.products?.name ?? "Product",
    variant_label:
      [r.product_variants?.finish, r.product_variants?.color, r.product_variants?.size]
        .filter(Boolean)
        .join(" · ") || null,
    order_number: r.orders?.order_number ?? null,
  }));

  return (
    <div className="bg-cream font-sans text-ink antialiased">
      <SiteNavSection />
      <section className="mx-auto max-w-[840px] px-5 py-12 lg:px-10">
        <div className="mb-2 font-serif text-2xl text-ink">My Account</div>
        <p className="mb-10 text-sm text-[#8a8073]">{user.email}</p>

        <h2 className="mb-5 font-serif text-xl text-ink">Quote requests</h2>
        <div className="mb-12">
          <QuoteRequestsSection initialRequests={quoteRequests} />
        </div>

        <h2 className="mb-5 font-serif text-xl text-ink">Order history</h2>

        {(orders ?? []).length === 0 ? (
          <p className="text-sm text-[#6b6155]">
            No orders yet — items you buy will show up here.
          </p>
        ) : (
          <div className="flex flex-col gap-5">
            {(orders ?? []).map((order) => (
              <div
                key={order.id}
                className="rounded-[2px] border border-[#ddd5c4] bg-white px-6 py-5"
              >
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-[#eee7d8] pb-4">
                  <div>
                    <div className="font-mono text-sm text-ink">{order.order_number}</div>
                    <div className="text-xs text-[#8a8073]">
                      {new Date(order.created_at).toLocaleDateString("en-NG", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="rounded-[2px] bg-cream px-2.5 py-1 text-xs uppercase tracking-[0.06em] text-[#6b6155]">
                      {ORDER_STATUS_LABELS[order.status] ?? order.status}
                    </div>
                    <div className="mt-1.5 font-serif text-base text-forest">
                      {formatNaira(order.total_kobo)}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {order.order_items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <span className="text-ink">
                        {item.product_name_snapshot}
                        {item.variant_label_snapshot && (
                          <span className="text-[#8a8073]"> — {item.variant_label_snapshot}</span>
                        )}
                        <span className="text-[#8a8073]"> × {item.quantity}</span>
                      </span>
                      <span className="text-[#6b6155]">
                        {formatNaira(item.unit_price_kobo * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
                {order.status === "pending_payment" && (
                  <div className="mt-4 border-t border-[#eee7d8] pt-4">
                    <PayNowButton
                      orderNumber={order.order_number}
                      className="rounded-[2px] bg-gold px-5 py-2.5 text-[13px] font-semibold tracking-wide text-forest hover:bg-gold-bright disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
      <SiteFooterSection />
    </div>
  );
}
