"use client";

import { useTradeAccount } from "@/lib/trade-account-context";
import { formatNaira } from "@/lib/format";

// Every price on the site renders through this. requires_quote products
// never reach here at all — every call site already branches on
// requiresQuote before rendering a price (unchanged, still true after
// this component's introduction), so there is no code path where this
// component computes discount math against a null/quote-required price.
//
// alreadyDiscounted: true for cart/checkout, where the number came from
// getCartItems/create_order — both now read prices through
// public_product_variants (20260901090000_create_order_trade_pricing.sql),
// so it's already the real, server-computed, trade-aware total. Applying
// the discount again here would double-discount it. Everywhere else
// (PDP, listing cards, search, "Complete the Room") is a statically
// cacheable page that can't personalize server-side, so kobo is the raw
// catalog price and this component computes the discount client-side
// from TradeAccountContext.
export function Price({
  kobo,
  alreadyDiscounted = false,
  hideLabel = false,
  className,
}: {
  kobo: number;
  alreadyDiscounted?: boolean;
  // For a row that shows the same discounted price twice (e.g. a cart
  // line's small unit price next to its own bold line total) — the
  // number stays honest either way, this just avoids stamping "Trade
  // Price" redundantly next to itself.
  hideLabel?: boolean;
  className?: string;
}) {
  const { isTradeCustomer, discountPercent } = useTradeAccount();

  const applyDiscount = isTradeCustomer && discountPercent != null && !alreadyDiscounted;
  const displayKobo = applyDiscount
    ? Math.round(kobo * (1 - (discountPercent as number) / 100))
    : kobo;
  const showLabel = isTradeCustomer && discountPercent != null && !hideLabel;

  return (
    <span className={className}>
      {formatNaira(displayKobo)}
      {showLabel && (
        <span className="ml-1.5 whitespace-nowrap text-[10.5px] font-semibold uppercase tracking-[0.06em] text-gold">
          Trade Price
        </span>
      )}
    </span>
  );
}
