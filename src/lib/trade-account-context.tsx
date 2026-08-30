"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCart } from "@/lib/cart-context";

type TradeAccountContextValue = {
  ready: boolean;
  isTradeCustomer: boolean;
  discountPercent: number | null;
};

const TradeAccountContext = createContext<TradeAccountContextValue | null>(null);

// Depends on CartContext's userId rather than bootstrapping its own
// session — every visitor already has one via CartProvider, and this
// only needs to know WHO, not re-derive that. Re-fetches whenever userId
// changes (login/logout), matching CartContext's own reactivity model —
// it does NOT poll or subscribe to trade_accounts changes, so an
// approval landing while the customer is already logged in and browsing
// won't appear until userId changes or the page reloads (re-mounting
// this provider fresh). Verified live which of those it actually is —
// see the trade-pricing verification report.
export function TradeAccountProvider({ children }: { children: ReactNode }) {
  const { userId, ready: cartReady } = useCart();
  const [ready, setReady] = useState(false);
  const [isTradeCustomer, setIsTradeCustomer] = useState(false);
  const [discountPercent, setDiscountPercent] = useState<number | null>(null);

  useEffect(() => {
    if (!cartReady || !userId) return;
    const uid = userId;
    let cancelled = false;

    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("trade_accounts")
        .select("discount_percent")
        .eq("id", uid)
        .eq("status", "approved")
        .maybeSingle();
      if (cancelled) return;
      setIsTradeCustomer(!!data);
      setDiscountPercent(data?.discount_percent ?? null);
      setReady(true);
    }
    load();

    return () => {
      cancelled = true;
    };
  }, [cartReady, userId]);

  return (
    <TradeAccountContext.Provider value={{ ready, isTradeCustomer, discountPercent }}>
      {children}
    </TradeAccountContext.Provider>
  );
}

export function useTradeAccount() {
  const ctx = useContext(TradeAccountContext);
  if (!ctx) {
    throw new Error("useTradeAccount must be used within a TradeAccountProvider");
  }
  return ctx;
}
