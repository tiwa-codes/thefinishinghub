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

type Dimensions = { width_cm?: number; depth_cm?: number; height_cm?: number };

type StyleOption = { id: string; name: string };

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
  is_bestseller: boolean;
  collection: string | null;
  features: string[] | null;
  care_instructions: string | null;
  materials: string | null;
  dimensions: Dimensions | null;
  weight_kg: number | null;
  lead_time_days: number | null;
  video_url: string | null;
  style_id: string | null;
  tier: string | null;
  origin: string | null;
  manufacturer: string | null;
  warranty_years: number | null;
};

const LABEL = "mb-1 block text-[11px] uppercase tracking-[0.08em] text-[#6b6155]";
const INPUT =
  "w-full rounded-[2px] border border-[#cfc6b6] px-3 py-2 text-sm text-ink outline-none focus:border-forest";

export function ProductDetailsTab({
  productId,
  onSaved,
}: {
  productId: string;
  onSaved: (newSlug: string) => void;
}) {
  const [tree, setTree] = useState<TopLevelWithSubs[]>([]);
  const [styles, setStyles] = useState<StyleOption[]>([]);
  const [savedSlug, setSavedSlug] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isShowroomDisplay, setIsShowroomDisplay] = useState(false);
  const [requiresQuote, setRequiresQuote] = useState(false);
  const [isAtelier, setIsAtelier] = useState(false);
  const [isBestseller, setIsBestseller] = useState(false);
  const [status, setStatus] = useState("draft");
  const [collection, setCollection] = useState("");
  const [features, setFeatures] = useState<string[]>([]);
  const [newFeature, setNewFeature] = useState("");
  const [careInstructions, setCareInstructions] = useState("");
  const [materials, setMaterials] = useState("");
  const [widthCm, setWidthCm] = useState("");
  const [depthCm, setDepthCm] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [leadTimeDays, setLeadTimeDays] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [styleId, setStyleId] = useState("");
  const [tier, setTier] = useState("");
  const [origin, setOrigin] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [warrantyYears, setWarrantyYears] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const [{ data }, categoryTree, { data: styleRows }] = await Promise.all([
        supabase
          .from("products")
          .select(
            "name, slug, description, short_description, category_id, is_showroom_display, status, requires_quote, is_atelier, is_bestseller, collection, features, care_instructions, materials, dimensions, weight_kg, lead_time_days, video_url, style_id, tier, origin, manufacturer, warranty_years",
          )
          .eq("id", productId)
          .returns<ProductDetails[]>()
          .maybeSingle(),
        fetchCategoryTree(supabase),
        supabase.from("styles").select("id, name").order("display_order").returns<StyleOption[]>(),
      ]);
      setTree(categoryTree);
      setStyles(styleRows ?? []);
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
        setIsBestseller(data.is_bestseller);
        setStatus(data.status);
        setCollection(data.collection ?? "");
        setFeatures(Array.isArray(data.features) ? (data.features as string[]) : []);
        setCareInstructions(data.care_instructions ?? "");
        setMaterials(data.materials ?? "");
        const dims = data.dimensions ?? {};
        setWidthCm(dims.width_cm != null ? String(dims.width_cm) : "");
        setDepthCm(dims.depth_cm != null ? String(dims.depth_cm) : "");
        setHeightCm(dims.height_cm != null ? String(dims.height_cm) : "");
        setWeightKg(data.weight_kg != null ? String(data.weight_kg) : "");
        setLeadTimeDays(data.lead_time_days != null ? String(data.lead_time_days) : "");
        setVideoUrl(data.video_url ?? "");
        setStyleId(data.style_id ?? "");
        setTier(data.tier ?? "");
        setOrigin(data.origin ?? "");
        setManufacturer(data.manufacturer ?? "");
        setWarrantyYears(data.warranty_years != null ? String(data.warranty_years) : "");
      }
      setLoading(false);
    }
    load();
  }, [productId]);

  function addFeature() {
    const value = newFeature.trim();
    if (!value) return;
    setFeatures((prev) => [...prev, value]);
    setNewFeature("");
  }

  function removeFeature(index: number) {
    setFeatures((prev) => prev.filter((_, i) => i !== index));
  }

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

    const dimensions: Dimensions | null =
      widthCm.trim() || depthCm.trim() || heightCm.trim()
        ? {
            ...(widthCm.trim() ? { width_cm: Number(widthCm) } : {}),
            ...(depthCm.trim() ? { depth_cm: Number(depthCm) } : {}),
            ...(heightCm.trim() ? { height_cm: Number(heightCm) } : {}),
          }
        : null;

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
        is_bestseller: isBestseller,
        status,
        collection: collection.trim() || null,
        features: features.length > 0 ? features : null,
        care_instructions: careInstructions.trim() || null,
        materials: materials.trim() || null,
        dimensions,
        weight_kg: weightKg.trim() ? Number(weightKg) : null,
        lead_time_days: leadTimeDays.trim() ? Number(leadTimeDays) : null,
        video_url: videoUrl.trim() || null,
        style_id: styleId || null,
        tier: tier.trim() || null,
        origin: origin.trim() || null,
        manufacturer: manufacturer.trim() || null,
        warranty_years: warrantyYears.trim() ? Number(warrantyYears) : null,
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-8 lg:flex-row lg:items-start">
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <div>
          <label htmlFor="product-collection" className={LABEL}>
            Collection label
          </label>
          <input
            id="product-collection"
            value={collection}
            onChange={(e) => setCollection(e.target.value)}
            className={INPUT}
          />
        </div>
        <div>
          <label htmlFor="product-name" className={LABEL}>
            Name
          </label>
          <input
            id="product-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className={INPUT}
          />
        </div>
        <div>
          <label htmlFor="product-slug" className={LABEL}>
            Slug
          </label>
          <input
            id="product-slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
            className={`${INPUT} font-mono`}
          />
        </div>
        <div>
          <label htmlFor="product-short-description" className={LABEL}>
            Short description
          </label>
          <input
            id="product-short-description"
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            className={INPUT}
          />
        </div>
        <div>
          <label htmlFor="product-description" className={LABEL}>
            Description
          </label>
          <textarea
            id="product-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className={INPUT}
          />
        </div>
        <div>
          <span className={LABEL}>Features</span>
          <div className="flex flex-col gap-1.5">
            {features.map((feature, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="flex-1 rounded-[2px] border border-[#e4ddd0] bg-white px-3 py-1.5 text-sm text-ink">
                  {feature}
                </span>
                <button
                  type="button"
                  onClick={() => removeFeature(i)}
                  className="text-xs text-[#8a8073] hover:text-[#b3261e]"
                >
                  Remove
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <input
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addFeature();
                  }
                }}
                placeholder="Add a feature…"
                className={INPUT}
              />
              <button
                type="button"
                onClick={addFeature}
                className="shrink-0 rounded-[2px] border border-[#cfc6b6] px-3 py-2 text-sm text-ink hover:border-forest"
              >
                Add
              </button>
            </div>
          </div>
        </div>
        <div>
          <label htmlFor="product-care" className={LABEL}>
            Care instructions
          </label>
          <textarea
            id="product-care"
            value={careInstructions}
            onChange={(e) => setCareInstructions(e.target.value)}
            rows={3}
            className={INPUT}
          />
        </div>
        <div>
          <label htmlFor="product-materials" className={LABEL}>
            Materials
          </label>
          <textarea
            id="product-materials"
            value={materials}
            onChange={(e) => setMaterials(e.target.value)}
            rows={3}
            className={INPUT}
          />
        </div>
        <div>
          <span className={LABEL}>Dimensions (cm)</span>
          <div className="flex gap-2">
            <input
              type="number"
              value={widthCm}
              onChange={(e) => setWidthCm(e.target.value)}
              placeholder="W"
              className={INPUT}
            />
            <input
              type="number"
              value={depthCm}
              onChange={(e) => setDepthCm(e.target.value)}
              placeholder="D"
              className={INPUT}
            />
            <input
              type="number"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              placeholder="H"
              className={INPUT}
            />
          </div>
        </div>
        <div>
          <label htmlFor="product-weight" className={LABEL}>
            Weight (kg)
          </label>
          <input
            id="product-weight"
            type="number"
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            className={INPUT}
          />
        </div>
        <div>
          <label htmlFor="product-lead-time" className={LABEL}>
            Lead time (days)
          </label>
          <input
            id="product-lead-time"
            type="number"
            value={leadTimeDays}
            onChange={(e) => setLeadTimeDays(e.target.value)}
            className={INPUT}
          />
        </div>
        <div>
          <label htmlFor="product-video" className={LABEL}>
            Video URL
          </label>
          <input
            id="product-video"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            className={INPUT}
          />
        </div>
      </div>

      <div className="flex w-full flex-col gap-4 lg:w-[280px] lg:shrink-0">
        <div>
          <span className={LABEL}>Status</span>
          <div className="flex gap-4 rounded-[2px] border border-[#cfc6b6] bg-white px-3 py-2">
            <label className="flex items-center gap-1.5 text-sm text-ink">
              <input
                type="radio"
                name="status"
                checked={status === "published"}
                onChange={() => setStatus("published")}
              />
              Published
            </label>
            <label className="flex items-center gap-1.5 text-sm text-ink">
              <input
                type="radio"
                name="status"
                checked={status === "draft"}
                onChange={() => setStatus("draft")}
              />
              Draft
            </label>
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={isBestseller}
            onChange={(e) => setIsBestseller(e.target.checked)}
          />
          Bestseller
        </label>
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
        <CategoryPicker tree={tree} value={categoryId} onChange={setCategoryId} />
        <div>
          <label htmlFor="product-style" className={LABEL}>
            Style
          </label>
          <select
            id="product-style"
            value={styleId}
            onChange={(e) => setStyleId(e.target.value)}
            className={INPUT}
          >
            <option value="">None</option>
            {styles.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="product-tier" className={LABEL}>
            Tier
          </label>
          <input
            id="product-tier"
            value={tier}
            onChange={(e) => setTier(e.target.value)}
            className={INPUT}
          />
        </div>
        <div>
          <label htmlFor="product-origin" className={LABEL}>
            Origin
          </label>
          <input
            id="product-origin"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            placeholder="e.g. Italy"
            className={INPUT}
          />
        </div>
        <div>
          <label htmlFor="product-manufacturer" className={LABEL}>
            Manufacturer
          </label>
          <input
            id="product-manufacturer"
            value={manufacturer}
            onChange={(e) => setManufacturer(e.target.value)}
            className={INPUT}
          />
        </div>
        <div>
          <label htmlFor="product-warranty" className={LABEL}>
            Warranty (years)
          </label>
          <input
            id="product-warranty"
            type="number"
            value={warrantyYears}
            onChange={(e) => setWarrantyYears(e.target.value)}
            className={INPUT}
          />
        </div>

        {error && <p className="text-[13px] text-[#b3261e]">{error}</p>}
        {savedMessage && <p className="text-[13px] text-forest">{savedMessage}</p>}
        <button
          type="submit"
          disabled={busy}
          className="self-start rounded-[2px] bg-forest px-5 py-2.5 text-sm font-medium text-cream hover:bg-deep-forest disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? "Saving…" : "Save details"}
        </button>
      </div>
    </form>
  );
}
