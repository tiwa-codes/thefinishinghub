"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LookProductsEditor } from "@/components/admin/look-products-editor";

type StyleOption = { id: string; name: string };

type LookDetails = {
  title: string;
  slug: string;
  description: string | null;
  image_url: string;
  style_id: string | null;
  is_featured: boolean;
  display_order: number;
};

const LABEL = "mb-1 block text-[11px] uppercase tracking-[0.08em] text-[#6b6155]";
const INPUT =
  "w-full rounded-[2px] border border-[#cfc6b6] px-3 py-2 text-sm text-ink outline-none focus:border-forest";

export default function EditLookPage() {
  const params = useParams<{ id: string }>();
  const lookId = params.id;
  const [styles, setStyles] = useState<StyleOption[]>([]);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [styleId, setStyleId] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [displayOrder, setDisplayOrder] = useState("0");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const [{ data }, { data: styleRows }] = await Promise.all([
        supabase
          .from("looks")
          .select("title, slug, description, image_url, style_id, is_featured, display_order")
          .eq("id", lookId)
          .returns<LookDetails[]>()
          .maybeSingle(),
        supabase.from("styles").select("id, name").order("display_order").returns<StyleOption[]>(),
      ]);
      setStyles(styleRows ?? []);
      if (!data) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setTitle(data.title);
      setSlug(data.slug);
      setDescription(data.description ?? "");
      setImageUrl(data.image_url);
      setStyleId(data.style_id ?? "");
      setIsFeatured(data.is_featured);
      setDisplayOrder(String(data.display_order));
      setLoading(false);
    }
    load();
  }, [lookId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !slug.trim() || !imageUrl.trim()) {
      setError("Title, slug, and image URL are all required.");
      return;
    }
    setBusy(true);
    setError(null);
    setSavedMessage(null);
    const supabase = createClient();
    const { error: updErr } = await supabase
      .from("looks")
      .update({
        title: title.trim(),
        slug: slug.trim(),
        description: description.trim() || null,
        image_url: imageUrl.trim(),
        style_id: styleId || null,
        is_featured: isFeatured,
        display_order: Number(displayOrder) || 0,
      })
      .eq("id", lookId);
    setBusy(false);
    if (updErr) {
      setError(updErr.message);
      return;
    }
    setSavedMessage("Saved.");
  }

  if (notFound) return <p className="text-sm text-[#b3261e]">Look not found.</p>;
  if (loading) return <p className="text-sm text-[#8a8073]">Loading…</p>;

  return (
    <div className="max-w-[720px]">
      <div className="mb-6 font-serif text-2xl text-ink">{title}</div>
      <form onSubmit={handleSubmit} className="mb-10 flex flex-col gap-4">
        <div>
          <label htmlFor="look-title" className={LABEL}>
            Title
          </label>
          <input
            id="look-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
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
            onChange={(e) => setSlug(e.target.value)}
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
        {savedMessage && <p className="text-[13px] text-forest">{savedMessage}</p>}
        <button
          type="submit"
          disabled={busy}
          className="mt-1 self-start rounded-[2px] bg-forest px-5 py-2.5 text-sm font-medium text-cream hover:bg-deep-forest disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? "Saving…" : "Save look"}
        </button>
      </form>

      <div className="mb-3 font-serif text-lg text-ink">Products in this look</div>
      <LookProductsEditor lookId={lookId} />
    </div>
  );
}
