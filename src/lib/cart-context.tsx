"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type CartContextValue = {
  count: number;
  add: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(0);
  const add = () => setCount((c) => c + 1);

  return (
    <CartContext.Provider value={{ count, add }}>
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
