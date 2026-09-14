"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type LookProductRow = {
  id: string;
  display_order: number;
  products: { id: string; name: string } | null;
};

type ProductRow = {
  id: string;
  name: string;
};

export function LookProductsEditor({ lookId }: { lookId: string }) {
  const [items, setItems] = useState<{ id: string; productId: string; name: string }[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const dragId = useRef<string | null>(null);

  async function load() {
    const supabase = createClient();
    const { data } = await supabase
      .from("look_products")
      .select("id, display_order, products ( id, name )")
      .eq("look_id", lookId)
      .order("display_order")
      .returns<LookProductRow[]>();
    setItems(
      (data ?? [])
        .filter((row): row is LookProductRow & { products: NonNullable<LookProductRow["products"]> } => row.products != null)
        .map((row) => ({ id: row.id, productId: row.products.id, name: row.products.name })),
    );
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lookId]);

  useEffect(() => {
    const term = query.trim();
    if (!term) {
      setResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("products")
        .select("id, name")
        .ilike("name", `%${term}%`)
        .limit(8)
        .returns<ProductRow[]>();
      setResults((data ?? []).filter((p) => !items.some((i) => i.productId === p.id)));
    }, 250);
    return () => clearTimeout(timeout);
  }, [query, items]);

  async function addProduct(product: ProductRow) {
    const supabase = createClient();
    const { data } = await supabase
      .from("look_products")
      .insert({ look_id: lookId, product_id: product.id, display_order: items.length })
      .select("id")
      .single();
    if (data) {
      setItems((prev) => [...prev, { id: data.id, productId: product.id, name: product.name }]);
    }
    setQuery("");
    setResults([]);
  }

  async function removeItem(id: string) {
    const supabase = createClient();
    await supabase.from("look_products").delete().eq("id", id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  async function persistOrder(next: typeof items) {
    const supabase = createClient();
    await Promise.all(
      next.map((item, index) =>
        supabase.from("look_products").update({ display_order: index }).eq("id", item.id),
      ),
    );
  }

  function handleDrop(targetId: string) {
    if (!dragId.current || dragId.current === targetId) return;
    setItems((prev) => {
      const from = prev.findIndex((i) => i.id === dragId.current);
      const to = prev.findIndex((i) => i.id === targetId);
      if (from === -1 || to === -1) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      persistOrder(next);
      return next;
    });
    dragId.current = null;
  }

  if (loading) return <p className="text-sm text-[#8a8073]">Loading…</p>;

  return (
    <div>
      <div className="relative mb-4 max-w-sm">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products to add…"
          className="w-full rounded-[2px] border border-[#cfc6b6] px-3 py-2 text-sm text-ink outline-none focus:border-forest"
        />
        {results.length > 0 && (
          <ul className="absolute z-10 mt-1 w-full rounded-[2px] border border-[#ddd5c4] bg-white shadow-sm">
            {results.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => addProduct(p)}
                  className="block w-full px-3 py-2 text-left text-sm text-ink hover:bg-cream"
                >
                  {p.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <ul className="flex flex-col gap-1.5">
        {items.map((item) => (
          <li
            key={item.id}
            draggable
            onDragStart={() => (dragId.current = item.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(item.id)}
            className="flex cursor-grab items-center justify-between rounded-[2px] border border-[#e4ddd0] bg-white px-3 py-2 text-sm text-ink"
          >
            <span>⠿ {item.name}</span>
            <button
              type="button"
              onClick={() => removeItem(item.id)}
              className="text-xs font-medium text-[#b3261e] hover:underline"
            >
              Remove
            </button>
          </li>
        ))}
        {items.length === 0 && (
          <li className="px-3 py-4 text-sm text-[#8a8073]">No products tagged yet.</li>
        )}
      </ul>
    </div>
  );
}
