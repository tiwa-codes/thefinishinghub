"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatNaira } from "@/lib/format";
import { fetchCategoryTree, flattenCategoryTree } from "@/lib/admin/category-tree";

type ProductListRow = {
  id: string;
  slug: string;
  name: string;
  status: string;
  category_id: string;
  product_variants: { price_kobo: number; is_default: boolean }[];
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductListRow[]>([]);
  const [categoryLabels, setCategoryLabels] = useState<
    { id: string; label: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    // Admin convenience only (e.g. the Overview page's "Drafts" tile links
    // here with ?status=draft) — read on mount rather than via
    // useSearchParams so this page doesn't need a Suspense boundary.
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status");
    if (status) setStatusFilter(status);
  }, []);

  // Category tree feeds the filter dropdown itself and rarely changes —
  // fetched once, independently of the product list below.
  useEffect(() => {
    async function loadCategories() {
      const supabase = createClient();
      const tree = await fetchCategoryTree(supabase);
      setCategoryLabels(flattenCategoryTree(tree));
    }
    loadCategories();
  }, []);

  const loadProducts = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("products")
      .select("id, slug, name, status, category_id, product_variants(price_kobo, is_default)")
      .order("created_at", { ascending: false })
      .returns<ProductListRow[]>();
    setProducts(data ?? []);
    setLoading(false);
  }, []);

  // Re-fetch whenever the category/status filter changes, not just once
  // on mount — a product added or edited elsewhere while this page was
  // already open would otherwise stay invisible (or show stale data)
  // until a manual reload, since switching a filter only re-filtered
  // whatever was already in memory. Deliberately NOT keyed on `search`
  // too — that's a per-keystroke text field, and re-fetching on every
  // character would be worse, not better.
  useEffect(() => {
    loadProducts();
  }, [categoryFilter, statusFilter, loadProducts]);

  const categoryLabelById = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of categoryLabels) map.set(c.id, c.label);
    return map;
  }, [categoryLabels]);

  const filtered = products.filter((p) => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (categoryFilter !== "all" && p.category_id !== categoryFilter) {
      return false;
    }
    if (statusFilter !== "all" && p.status !== statusFilter) {
      return false;
    }
    return true;
  });

  if (loading) {
    return <p className="text-sm text-[#8a8073]">Loading products…</p>;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="font-serif text-2xl text-ink">Products</div>
        <Link
          href="/admin/products/new"
          className="rounded-[2px] bg-forest px-4 py-2.5 text-sm font-medium text-cream hover:bg-deep-forest"
        >
          Add product
        </Link>
      </div>

      <div className="mb-5 flex flex-wrap gap-3">
        <label htmlFor="product-search" className="sr-only">
          Search by name
        </label>
        <input
          id="product-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name…"
          className="w-64 rounded-[2px] border border-[#cfc6b6] px-3 py-2 text-sm text-ink outline-none focus:border-forest"
        />
        <label htmlFor="product-category-filter" className="sr-only">
          Filter by category
        </label>
        <select
          id="product-category-filter"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-[2px] border border-[#cfc6b6] px-3 py-2 text-sm text-ink outline-none focus:border-forest"
        >
          <option value="all">All categories</option>
          {categoryLabels.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        <label htmlFor="product-status-filter" className="sr-only">
          Filter by status
        </label>
        <select
          id="product-status-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-[2px] border border-[#cfc6b6] px-3 py-2 text-sm text-ink outline-none focus:border-forest"
        >
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-[2px] border border-[#ddd5c4] bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[#ddd5c4] text-xs uppercase tracking-[0.06em] text-[#8a8073]">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Price</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eee7d8]">
            {filtered.map((p) => {
              const defaultVariant =
                p.product_variants.find((v) => v.is_default) ??
                p.product_variants[0];
              return (
                <tr key={p.id} className="hover:bg-cream">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/products/${p.id}`}
                      className="text-ink hover:text-forest hover:underline"
                    >
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[#6b6155]">
                    {categoryLabelById.get(p.category_id) ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-[2px] px-2 py-0.5 text-xs ${
                        p.status === "published"
                          ? "bg-[#e4ede7] text-forest"
                          : "bg-[#f0ece1] text-[#8a8073]"
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#6b6155]">
                    {defaultVariant
                      ? formatNaira(defaultVariant.price_kobo)
                      : "—"}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-[#8a8073]">
                  No products match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
