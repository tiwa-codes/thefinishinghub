"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/slugify";
import { fetchCategoryTree, type TopLevelWithSubs } from "@/lib/admin/category-tree";
import { CategoryPicker } from "@/components/admin/category-picker";

export default function NewProductPage() {
  const router = useRouter();
  const [tree, setTree] = useState<TopLevelWithSubs[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isShowroomDisplay, setIsShowroomDisplay] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      setTree(await fetchCategoryTree(supabase));
    }
    load();
  }, []);

  function handleNameChange(value: string) {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !slug.trim() || !categoryId) {
      setError("Name, slug, and category are all required.");
      return;
    }
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { data, error: insErr } = await supabase
      .from("products")
      .insert({
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim() || null,
        short_description: shortDescription.trim() || null,
        category_id: categoryId,
        is_showroom_display: isShowroomDisplay,
        // New products always start as drafts — they have no variants yet,
        // and a product must never be publishable with zero variants. The
        // Details tab on the edit page allows switching to published, with
        // its own variant check at that point.
        status: "draft",
      })
      .select("id")
      .single();
    setBusy(false);
    if (insErr || !data) {
      setError(insErr?.message ?? "Could not create product.");
      return;
    }
    router.push(`/admin/products/${data.id}`);
  }

  return (
    <div className="max-w-[640px]">
      <div className="mb-6 font-serif text-2xl text-ink">Add product</div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
            onChange={(e) => handleNameChange(e.target.value)}
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
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugTouched(true);
            }}
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
        {error && <p className="text-[13px] text-[#b3261e]">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="mt-1 self-start rounded-[2px] bg-forest px-5 py-2.5 text-sm font-medium text-cream hover:bg-deep-forest disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? "Creating…" : "Create product"}
        </button>
      </form>
    </div>
  );
}
