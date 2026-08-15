"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";

type CartContextValue = {
  count: number;
  ready: boolean;
  add: (variantId: string) => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(0);
  const [ready, setReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    async function bootstrap() {
      // Anonymous sign-in must complete before any cart read/write —
      // cart_items rows are keyed to auth.uid() and RLS requires it.
      const {
        data: { session },
      } = await supabase.auth.getSession();
      let uid = session?.user?.id ?? null;

      if (!uid) {
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error) {
          console.error("Anonymous sign-in failed:", error.message);
          return;
        }
        uid = data.user?.id ?? null;
      }

      if (!uid || cancelled) return;

      const { data: cartRows, error: cartError } = await supabase
        .from("cart_items")
        .select("quantity")
        .eq("user_id", uid)
        .returns<{ quantity: number }[]>();

      if (cartError) {
        console.error("Failed to load cart:", cartError.message);
      }

      if (cancelled) return;
      setUserId(uid);
      setCount((cartRows ?? []).reduce((sum, row) => sum + row.quantity, 0));
      setReady(true);
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const add = useCallback(
    async (variantId: string) => {
      if (!userId) return;
      const supabase = createClient();

      // Atomic upsert (add_to_cart RPC, tfh_schema_v2_cart_rpc.sql) —
      // insert ... on conflict (user_id, variant_id) do update set
      // quantity = quantity + excluded.quantity, in a single statement.
      // Replaces an earlier read-then-write that could race under rapid
      // double-clicks (two requests both reading "no existing row," both
      // inserting; or both reading the same quantity and both writing
      // quantity+1, losing an increment).
      const { error } = await supabase.rpc("add_to_cart", {
        p_variant_id: variantId,
        p_quantity: 1,
      });

      if (error) {
        console.error("Failed to add cart item:", error.message);
        return;
      }

      setCount((c) => c + 1);
    },
    [userId],
  );

  return (
    <CartContext.Provider value={{ count, ready, add }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return ctx;
}
