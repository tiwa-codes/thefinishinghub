"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/slugify";

type StyleOption = { id: string; name: string };

const LABEL = "mb-1 block text-[11px] uppercase tracking-[0.08em] text-[#6b6155]";
const INPUT =
  "w-full rounded-[2px] border border-[#cfc6b6] px-3 py-2 text-sm text-ink outline-none focus:border-forest";

export default function NewLookPage() {
  const router = useRouter();
  const [styles, setStyles] = useState<StyleOption[]>([]);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [styleId, setStyleId] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [displayOrder, setDisplayOrder] = useState("0");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("styles")
        .select("id, name")
        .order("display_order")
        .returns<StyleOption[]>();
      setStyles(data ?? []);
    }
    load();
  }, []);

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !slug.trim() || !imageUrl.trim()) {
      setError("Title, slug, and image URL are all required.");
      return;
    }
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { data, error: insErr } = await supabase
      .from("looks")
      .insert({
        title: title.trim(),
        slug: slug.trim(),
        description: description.trim() || null,
        image_url: imageUrl.trim(),
        style_id: styleId || null,
        is_featured: isFeatured,
        display_order: Number(displayOrder) || 0,
      })
      .select("id")
      .single();
    setBusy(false);
    if (insErr || !data) {
      setError(insErr?.message ?? "Could not create look.");
      return;
    }
    router.push(`/admin/looks/${data.id}`);
  }

  return (
    <div className="max-w-[640px]">
      <div className="mb-6 font-serif text-2xl text-ink">New look</div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="look-title" className={LABEL}>
            Title
          </label>
          <input
            id="look-title"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            required
            className={INPUT}
          />
        </div>
        <div>
          <label htmlFor="look-slug" className={LABEL}>
            Slug
          </label>
          <input
            id="look-slug"
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
            required
            className={`${INPUT} font-mono`}
          />
        </div>
        <div>
          <label htmlFor="look-description" className={LABEL}>
            Description
          </label>
          <textarea
            id="look-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className={INPUT}
          />
        </div>
        <div>
          <label htmlFor="look-image" className={LABEL}>
            Image URL
          </label>
          <input
            id="look-image"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            required
            className={INPUT}
          />
        </div>
        <div>
          <label htmlFor="look-style" className={LABEL}>
            Style
          </label>
          <select
            id="look-style"
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
          <label htmlFor="look-order" className={LABEL}>
            Display order
          </label>
          <input
            id="look-order"
            type="number"
            value={displayOrder}
            onChange={(e) => setDisplayOrder(e.target.value)}
            className={`${INPUT} max-w-[120px]`}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={isFeatured}
            onChange={(e) => setIsFeatured(e.target.checked)}
          />
          Featured
        </label>
        {error && <p className="text-[13px] text-[#b3261e]">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="mt-1 self-start rounded-[2px] bg-forest px-5 py-2.5 text-sm font-medium text-cream hover:bg-deep-forest disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? "Creating…" : "Create look"}
        </button>
      </form>
    </div>
  );
}
