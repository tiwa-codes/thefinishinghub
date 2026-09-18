import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SiteNavSection } from "@/components/site-nav-section";
import { SiteFooterSection } from "@/components/site-footer-section";
import { CheckoutView } from "@/components/checkout/checkout-view";
import { createClient } from "@/lib/supabase/server";
import { getCartItems } from "@/lib/cart-data";
import type { CartLineItem } from "@/components/cart/cart-view";

// No `revalidate` — reads the calling user's own cart/session via
// cookies(), same reasoning as /cart.
export const metadata: Metadata = {
  title: "Checkout — The Finishing Hub",
};

async function getInitialCheckoutData(): Promise<{
  items: CartLineItem[];
  email: string | null;
}> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { items: [], email: null };

  const { items } = await getCartItems(supabase, user.id);
  return { items, email: user.is_anonymous ? null : (user.email ?? null) };
}

export default async function CheckoutPage() {
  const { items, email } = await getInitialCheckoutData();

  // Nothing to check out — either a genuinely empty cart, or a cart made
  // up entirely of quote-only items (create_order rejects any cart
  // containing one at all, so there's no valid path forward here without
  // going back to remove it first).
  const hasPriceableItem = items.some((item) => !item.requiresQuote && item.unitPriceKobo != null);
  if (items.length === 0 || !hasPriceableItem) {
    redirect("/cart");
  }

  return (
    <div className="bg-cream font-sans text-ink antialiased">
      <SiteNavSection />
      <CheckoutView initialItems={items} initialEmail={email} />
      <SiteFooterSection />
    </div>
  );
}
