"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { koboToNairaInput, nairaInputToKobo } from "@/lib/format";
import { revalidateAdminPaths } from "@/lib/admin/revalidate";
import { fetchCategoryTree, findTopLevelSlugForCategory } from "@/lib/admin/category-tree";

type VariantFormRow = {
  id?: string;
  sku: string;
  finish: string;
  color: string;
  size: string;
  priceInput: string;
  isDefault: boolean;
  inStock: boolean;
};

type StoredVariant = {
  id: string;
  sku: string;
  finish: string | null;
  color: string | null;
  size: string | null;
  price_kobo: number;
  is_default: boolean;
  in_stock: boolean;
};

export function ProductVariantsTab({
  productId,
  productSlug,
}: {
  productId: string;
  productSlug: string | null;
}) {
  const [rows, setRows] = useState<VariantFormRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  async function load() {
    const supabase = createClient();
    const { data } = await supabase
      .from("product_variants")
      .select("id, sku, finish, color, size, price_kobo, is_default, in_stock")
      .eq("product_id", productId)
      .order("created_at")
      .returns<StoredVariant[]>();
    setRows(
      (data ?? []).map((v) => ({
        id: v.id,
        sku: v.sku,
        finish: v.finish ?? "",
        color: v.color ?? "",
        size: v.size ?? "",
        priceInput: koboToNairaInput(v.price_kobo),
        isDefault: v.is_default,
        inStock: v.in_stock,
      })),
    );
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  function updateRow(index: number, patch: Partial<VariantFormRow>) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function setDefault(index: number) {
    setRows((prev) => prev.map((r, i) => ({ ...r, isDefault: i === index })));
  }

  function addRow() {
    setRows((prev) => [
      ...prev,
      {
        sku: "",
        finish: "",
        color: "",
        size: "",
        priceInput: "",
        isDefault: prev.length === 0,
        inStock: true,
      },
    ]);
  }

  function removeRow(index: number) {
    setRows((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (
        prev[index]?.isDefault &&
        next.length > 0 &&
        !next.some((r) => r.isDefault)
      ) {
        next[0] = { ...next[0], isDefault: true };
      }
      return next;
    });
  }

  async function handleSave() {
    setError(null);
    setSavedMessage(null);

    // Form-level enforcement of the DB's one_default_variant_per_product
    // constraint (and the "never zero variants" rule) — this must reject
    // an invalid state before ever reaching Supabase, not rely on the DB
    // to bounce it back.
    if (rows.length === 0) {
      setError("A product needs at least one variant.");
      return;
    }
    const defaultCount = rows.filter((r) => r.isDefault).length;
    if (defaultCount !== 1) {
      setError("Mark exactly one variant as the default.");
      return;
    }
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!r.sku.trim()) {
        setError(`Row ${i + 1}: SKU is required.`);
        return;
      }
      if (nairaInputToKobo(r.priceInput) === null) {
        setError(`Row ${i + 1}: enter a valid price greater than ₦0.`);
        return;
      }
    }

    setBusy(true);
    const supabase = createClient();

    const currentIds = new Set(rows.filter((r) => r.id).map((r) => r.id!));
    const { data: existingBeforeSave } = await supabase
      .from("product_variants")
      .select("id")
      .eq("product_id", productId);
    const removedIds = (existingBeforeSave ?? [])
      .map((v) => v.id)
      .filter((id) => !currentIds.has(id));

    for (const id of removedIds) {
      await supabase.from("product_variants").delete().eq("id", id);
    }

    // Clear every existing row's default flag first so the new default
    // never briefly coexists with the old one across these separate
    // statements — the DB constraint is checked per-statement.
    const existingIds = rows.filter((r) => r.id).map((r) => r.id!);
    if (existingIds.length > 0) {
      await supabase
        .from("product_variants")
        .update({ is_default: false })
        .in("id", existingIds);
    }

    for (const r of rows.filter((r) => r.id)) {
      await supabase
        .from("product_variants")
        .update({
          sku: r.sku.trim(),
          finish: r.finish.trim() || null,
          color: r.color.trim() || null,
          size: r.size.trim() || null,
          price_kobo: nairaInputToKobo(r.priceInput)!,
          is_default: r.isDefault,
          in_stock: r.inStock,
        })
        .eq("id", r.id!);
    }

    for (const r of rows.filter((r) => !r.id)) {
      await supabase.from("product_variants").insert({
        product_id: productId,
        sku: r.sku.trim(),
        finish: r.finish.trim() || null,
        color: r.color.trim() || null,
        size: r.size.trim() || null,
        price_kobo: nairaInputToKobo(r.priceInput)!,
        is_default: r.isDefault,
        in_stock: r.inStock,
      });
    }

    if (productSlug) {
      // Same reasoning as the Details tab: a price change here can also
      // show up on the homepage's New Arrivals and the top-level category
      // landing page's Featured pieces, both still on the cached ISR
      // client — without revalidating them too, a price edit here
      // wouldn't show up there for up to the 1-hour ISR window.
      const pathsToRevalidate = [`/products/${productSlug}`, "/"];
      const { data: productRow } = await supabase
        .from("products")
        .select("category_id")
        .eq("id", productId)
        .maybeSingle();
      if (productRow) {
        const tree = await fetchCategoryTree(supabase);
        const topLevelSlug = findTopLevelSlugForCategory(tree, productRow.category_id);
        if (topLevelSlug) pathsToRevalidate.push(`/${topLevelSlug}`);
      }
      await revalidateAdminPaths(pathsToRevalidate);
    }

    await load();
    setBusy(false);
    setSavedMessage("Saved.");
  }

  if (loading) return <p className="text-sm text-[#8a8073]">Loading…</p>;

  return (
    <div>
      <div className="overflow-x-auto rounded-[2px] border border-[#ddd5c4] bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[#ddd5c4] text-xs uppercase tracking-[0.06em] text-[#8a8073]">
              <th className="px-3 py-2.5 font-medium">Default</th>
              <th className="px-3 py-2.5 font-medium">SKU</th>
              <th className="px-3 py-2.5 font-medium">Finish</th>
              <th className="px-3 py-2.5 font-medium">Color</th>
              <th className="px-3 py-2.5 font-medium">Size</th>
              <th className="px-3 py-2.5 font-medium">Price (₦)</th>
              <th className="px-3 py-2.5 font-medium">In stock</th>
              <th className="px-3 py-2.5 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eee7d8]">
            {rows.map((r, i) => (
              <tr key={r.id ?? `new-${i}`}>
                <td className="px-3 py-2">
                  <input
                    type="radio"
                    name="default-variant"
                    checked={r.isDefault}
                    onChange={() => setDefault(i)}
                    aria-label={`Set row ${i + 1} as default variant`}
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    value={r.sku}
                    onChange={(e) => updateRow(i, { sku: e.target.value })}
                    className="w-28 rounded-[2px] border border-[#cfc6b6] px-2 py-1.5 text-sm outline-none focus:border-forest"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    value={r.finish}
                    onChange={(e) => updateRow(i, { finish: e.target.value })}
                    className="w-24 rounded-[2px] border border-[#cfc6b6] px-2 py-1.5 text-sm outline-none focus:border-forest"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    value={r.color}
                    onChange={(e) => updateRow(i, { color: e.target.value })}
                    className="w-24 rounded-[2px] border border-[#cfc6b6] px-2 py-1.5 text-sm outline-none focus:border-forest"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    value={r.size}
                    onChange={(e) => updateRow(i, { size: e.target.value })}
                    className="w-20 rounded-[2px] border border-[#cfc6b6] px-2 py-1.5 text-sm outline-none focus:border-forest"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={r.priceInput}
                    onChange={(e) => updateRow(i, { priceInput: e.target.value })}
                    className="w-28 rounded-[2px] border border-[#cfc6b6] px-2 py-1.5 text-sm outline-none focus:border-forest"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    checked={r.inStock}
                    onChange={(e) => updateRow(i, { inStock: e.target.checked })}
                  />
                </td>
                <td className="px-3 py-2">
                  <button
                    type="button"
                    onClick={() => removeRow(i)}
                    className="text-xs font-medium text-[#b3261e] hover:underline"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-[#8a8073]">
                  No variants yet — add at least one to publish this product.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={addRow}
          className="rounded-[2px] border border-forest px-4 py-2 text-sm font-medium text-forest hover:bg-forest hover:text-cream"
        >
          Add variant
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={handleSave}
          className="rounded-[2px] bg-forest px-5 py-2 text-sm font-medium text-cream hover:bg-deep-forest disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? "Saving…" : "Save variants"}
        </button>
      </div>
      {error && <p className="mt-2 text-[13px] text-[#b3261e]">{error}</p>}
      {savedMessage && <p className="mt-2 text-[13px] text-forest">{savedMessage}</p>}
    </div>
  );
}
