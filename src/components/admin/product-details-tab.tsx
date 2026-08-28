"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  fetchCategoryTree,
  findTopLevelSlugForCategory,
  type TopLevelWithSubs,
} from "@/lib/admin/category-tree";
import { CategoryPicker } from "@/components/admin/category-picker";
import { revalidateAdminPaths } from "@/lib/admin/revalidate";

type ProductDetails = {
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  category_id: string;
  is_showroom_display: boolean;
  status: string;
  requires_quote: boolean;
  is_atelier: boolean;
};

export function ProductDetailsTab({
  productId,
  onSaved,
}: {
  productId: string;
  onSaved: (newSlug: string) => void;
}) {
  const [tree, setTree] = useState<TopLevelWithSubs[]>([]);
  const [savedSlug, setSavedSlug] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isShowroomDisplay, setIsShowroomDisplay] = useState(false);
  const [requiresQuote, setRequiresQuote] = useState(false);
  const [isAtelier, setIsAtelier] = useState(false);
  const [status, setStatus] = useState("draft");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const [{ data }, categoryTree] = await Promise.all([
        supabase
          .from("products")
          .select(
            "name, slug, description, short_description, category_id, is_showroom_display, status, requires_quote, is_atelier",
          )
          .eq("id", productId)
          .returns<ProductDetails[]>()
          .maybeSingle(),
        fetchCategoryTree(supabase),
      ]);
      setTree(categoryTree);
      if (data) {
        setSavedSlug(data.slug);
        setName(data.name);
        setSlug(data.slug);
        setDescription(data.description ?? "");
        setShortDescription(data.short_description ?? "");
        setCategoryId(data.category_id);
        setIsShowroomDisplay(data.is_showroom_display);
        setRequiresQuote(data.requires_quote);
        setIsAtelier(data.is_atelier);
        setStatus(data.status);
      }
      setLoading(false);
    }
    load();
  }, [productId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !slug.trim() || !categoryId) {
      setError("Name, slug, and category are all required.");
      return;
    }
    setBusy(true);
    setError(null);
    setSavedMessage(null);
    const supabase = createClient();

    // A product must never be publishable with zero variants, or with
    // anything other than exactly one default — check before allowing the
    // switch to "published" rather than letting the DB reject it after the
    // fact (the Variants tab enforces the same rule on its own save).
    if (status === "published") {
      const { data: variants } = await supabase
        .from("product_variants")
        .select("is_default")
        .eq("product_id", productId);
      if (!variants || variants.length === 0) {
        setBusy(false);
        setError(
          "Add at least one variant on the Variants tab before publishing.",
        );
        return;
      }
      const defaults = variants.filter((v) => v.is_default).length;
      if (defaults !== 1) {
        setBusy(false);
        setError(
          "Exactly one variant must be marked default before publishing — check the Variants tab.",
        );
        return;
      }
    }

    const { error: updErr } = await supabase
      .from("products")
      .update({
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim() || null,
        short_description: shortDescription.trim() || null,
        category_id: categoryId,
        is_showroom_display: isShowroomDisplay,
        requires_quote: requiresQuote,
        is_atelier: isAtelier,
        status,
      })
      .eq("id", productId);

    setBusy(false);
    if (updErr) {
      setError(updErr.message);
      return;
    }

    // The product's own PDP is enough on its own — but the homepage's New
    // Arrivals and the top-level category landing page's Featured pieces
    // both still read via the cached ISR client (getCategoryPageData /
    // new-arrivals-section.tsx are intentionally NOT on the uncached
    // client the filter-driven listing pages use), so a change here
    // (price, requires_quote, name, ...) wouldn't show up there for up to
    // the 1-hour ISR window without revalidating them explicitly too —
    // confirmed live: a requires_quote flag wasn't reflected on either
    // until this was added.
    const pathsToRevalidate = [`/products/${slug.trim()}`, "/"];
    if (savedSlug && savedSlug !== slug.trim()) {
      pathsToRevalidate.push(`/products/${savedSlug}`);
    }
    const topLevelSlug = findTopLevelSlugForCategory(tree, categoryId);
    if (topLevelSlug) pathsToRevalidate.push(`/${topLevelSlug}`);
    await revalidateAdminPaths(pathsToRevalidate);

    setSavedSlug(slug.trim());
    setSavedMessage("Saved.");
    onSaved(slug.trim());
  }

  if (loading) return <p className="text-sm text-[#8a8073]">Loading…</p>;

  return (
    <form onSubmit={handleSubmit} className="flex max-w-[640px] flex-col gap-4">
      <div>
        <label
          htmlFor="product-name"
          className="mb-1 block text-[11px] uppercase tracking-[0.08em] text-[#6b6155]"
        >
          Name
        </label>
        <input
          id="product-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full rounded-[2px] border border-[#cfc6b6] px-3 py-2 text-sm text-ink outline-none focus:border-forest"
        />
      </div>
      <div>
        <label
          htmlFor="product-slug"
          className="mb-1 block text-[11px] uppercase tracking-[0.08em] text-[#6b6155]"
        >
          Slug
        </label>
        <input
          id="product-slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          required
          className="w-full rounded-[2px] border border-[#cfc6b6] px-3 py-2 font-mono text-sm text-ink outline-none focus:border-forest"
        />
      </div>
      <div>
        <label
          htmlFor="product-short-description"
          className="mb-1 block text-[11px] uppercase tracking-[0.08em] text-[#6b6155]"
        >
          Short description
        </label>
        <input
          id="product-short-description"
          value={shortDescription}
          onChange={(e) => setShortDescription(e.target.value)}
          className="w-full rounded-[2px] border border-[#cfc6b6] px-3 py-2 text-sm text-ink outline-none focus:border-forest"
        />
      </div>
      <div>
        <label
          htmlFor="product-description"
          className="mb-1 block text-[11px] uppercase tracking-[0.08em] text-[#6b6155]"
        >
          Description
        </label>
        <textarea
          id="product-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          className="w-full rounded-[2px] border border-[#cfc6b6] px-3 py-2 text-sm text-ink outline-none focus:border-forest"
        />
      </div>
      <CategoryPicker tree={tree} value={categoryId} onChange={setCategoryId} />
      <label className="flex items-center gap-2 text-sm text-ink">
        <input
          type="checkbox"
          checked={isShowroomDisplay}
          onChange={(e) => setIsShowroomDisplay(e.target.checked)}
        />
        On display in the Abuja showroom
      </label>
      <label className="flex items-center gap-2 text-sm text-ink">
        <input
          type="checkbox"
          checked={requiresQuote}
          onChange={(e) => setRequiresQuote(e.target.checked)}
        />
        Requires a quote (hides price)
      </label>
      <label className="flex items-center gap-2 text-sm text-ink">
        <input
          type="checkbox"
          checked={isAtelier}
          onChange={(e) => setIsAtelier(e.target.checked)}
        />
        Feature in The TFH Atelier
      </label>
      <div>
        <label
          htmlFor="product-status"
          className="mb-1 block text-[11px] uppercase tracking-[0.08em] text-[#6b6155]"
        >
          Status
        </label>
        <select
          id="product-status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full max-w-[200px] rounded-[2px] border border-[#cfc6b6] px-3 py-2 text-sm text-ink outline-none focus:border-forest"
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </div>
      {error && <p className="text-[13px] text-[#b3261e]">{error}</p>}
      {savedMessage && <p className="text-[13px] text-forest">{savedMessage}</p>}
      <button
        type="submit"
        disabled={busy}
        className="mt-1 self-start rounded-[2px] bg-forest px-5 py-2.5 text-sm font-medium text-cream hover:bg-deep-forest disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? "Saving…" : "Save details"}
      </button>
    </form>
  );
}
