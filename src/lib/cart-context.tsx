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
  // Auth state, reactive — updates on signup/login/logout without a page
  // reload, so /checkout can flip from "sign in to continue" to the real
  // form the instant an anonymous session converts to a permanent one.
  // null until the initial session bootstrap resolves.
  userId: string | null;
  isAnonymous: boolean | null;
  email: string | null;
  add: (variantId: string, quantity?: number) => Promise<void>;
  // Cart page quantity stepper/remove: unlike add() (atomic upsert via
  // RPC, since concurrent "add" clicks can race), these operate on a
  // single row the client already has loaded, so a direct update/delete
  // is safe — RLS ("auth.uid() = user_id") scopes it to the owner either
  // way. The caller already knows the before/after quantity from its own
  // local state, so it passes the count delta directly instead of this
  // context re-reading the row first (that read-then-write shape is
  // exactly what add_to_cart's RPC was introduced to avoid).
  setItemQuantity: (cartItemId: string, quantity: number, delta: number) => Promise<void>;
  removeItem: (cartItemId: string, quantity: number) => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

async function loadCartCount(
  supabase: ReturnType<typeof createClient>,
  uid: string,
): Promise<number> {
  const { data: cartRows, error } = await supabase
    .from("cart_items")
    .select("quantity")
    .eq("user_id", uid)
    .returns<{ quantity: number }[]>();

  if (error) {
    console.error("Failed to load cart:", error.message);
    return 0;
  }

  return (cartRows ?? []).reduce((sum, row) => sum + row.quantity, 0);
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(0);
  const [ready, setReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAnonymous, setIsAnonymous] = useState<boolean | null>(null);
  const [email, setEmail] = useState<string | null>(null);

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
      let anon = session?.user?.is_anonymous ?? null;
      let userEmail = session?.user?.email ?? null;

      if (!uid) {
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error) {
          console.error("Anonymous sign-in failed:", error.message);
          return;
        }
        uid = data.user?.id ?? null;
        anon = data.user?.is_anonymous ?? true;
        userEmail = data.user?.email ?? null;
      }

      if (!uid || cancelled) return;

      const cartCount = await loadCartCount(supabase, uid);
      if (cancelled) return;

      setUserId(uid);
      setIsAnonymous(anon);
      setEmail(userEmail);
      setCount(cartCount);
      setReady(true);
    }

    bootstrap();

    // Reactive: fires on signup (anonymous -> permanent linking), login
    // (including to a different, pre-existing account), and logout — none
    // of which the bootstrap effect above sees on its own, since it only
    // runs once on mount.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (cancelled) return;
      const uid = session?.user?.id ?? null;
      setUserId(uid);
      setIsAnonymous(session?.user?.is_anonymous ?? null);
      setEmail(session?.user?.email ?? null);
      if (uid) {
        setCount(await loadCartCount(supabase, uid));
      } else {
        setCount(0);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const add = useCallback(
    async (variantId: string, quantity: number = 1) => {
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
        p_quantity: quantity,
      });

      if (error) {
        console.error("Failed to add cart item:", error.message);
        return;
      }

      setCount((c) => c + quantity);
    },
    [userId],
  );

  const setItemQuantity = useCallback(
    async (cartItemId: string, quantity: number, delta: number) => {
      if (!userId) return;
      const supabase = createClient();
      const { error } = await supabase
        .from("cart_items")
        .update({ quantity })
        .eq("id", cartItemId);

      if (error) {
        console.error("Failed to update cart item quantity:", error.message);
        return;
      }

      setCount((c) => c + delta);
    },
    [userId],
  );

  const removeItem = useCallback(
    async (cartItemId: string, quantity: number) => {
      if (!userId) return;
      const supabase = createClient();
      const { error } = await supabase.from("cart_items").delete().eq("id", cartItemId);

      if (error) {
        console.error("Failed to remove cart item:", error.message);
        return;
      }

      setCount((c) => c - quantity);
    },
    [userId],
  );

  return (
    <CartContext.Provider
      value={{ count, ready, userId, isAnonymous, email, add, setItemQuantity, removeItem }}
    >
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
