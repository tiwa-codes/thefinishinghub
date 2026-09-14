"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/slugify";

type CollectionFormValues = {
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  displayOrder: string;
};

const LABEL = "mb-1 block text-[11px] uppercase tracking-[0.08em] text-[#6b6155]";
const INPUT =
  "w-full rounded-[2px] border border-[#cfc6b6] px-3 py-2 text-sm text-ink outline-none focus:border-forest";

export function CollectionForm({
  collectionId,
  initial,
}: {
  collectionId?: string;
  initial?: CollectionFormValues;
}) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(initial));
  const [description, setDescription] = useState(initial?.description ?? "");
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "");
  const [displayOrder, setDisplayOrder] = useState(initial?.displayOrder ?? "0");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  function handleNameChange(value: string) {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !slug.trim() || !imageUrl.trim()) {
      setError("Name, slug, and image URL are all required.");
      return;
    }
    setBusy(true);
    setError(null);
    setSavedMessage(null);
    const supabase = createClient();
    const payload = {
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim() || null,
      image_url: imageUrl.trim(),
      display_order: Number(displayOrder) || 0,
    };

    if (collectionId) {
      const { error: updErr } = await supabase
        .from("collections")
        .update(payload)
        .eq("id", collectionId);
      setBusy(false);
      if (updErr) {
        setError(updErr.message);
        return;
      }
      setSavedMessage("Saved.");
      return;
    }

    const { data, error: insErr } = await supabase
      .from("collections")
      .insert(payload)
      .select("id")
      .single();
    setBusy(false);
    if (insErr || !data) {
      setError(insErr?.message ?? "Could not create collection.");
      return;
    }
    router.push(`/admin/collections/${data.id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-[640px] flex-col gap-4">
      <div>
        <label htmlFor="collection-name" className={LABEL}>
          Name
        </label>
        <input
          id="collection-name"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          required
          className={INPUT}
        />
      </div>
      <div>
        <label htmlFor="collection-slug" className={LABEL}>
          Slug
        </label>
        <input
          id="collection-slug"
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
        <label htmlFor="collection-description" className={LABEL}>
          Description
        </label>
        <textarea
          id="collection-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className={INPUT}
        />
      </div>
      <div>
        <label htmlFor="collection-image" className={LABEL}>
          Image URL
        </label>
        <input
          id="collection-image"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          required
          className={INPUT}
        />
      </div>
      <div>
        <label htmlFor="collection-order" className={LABEL}>
          Display order
        </label>
        <input
          id="collection-order"
          type="number"
          value={displayOrder}
          onChange={(e) => setDisplayOrder(e.target.value)}
          className={`${INPUT} max-w-[120px]`}
        />
      </div>
      {error && <p className="text-[13px] text-[#b3261e]">{error}</p>}
      {savedMessage && <p className="text-[13px] text-forest">{savedMessage}</p>}
      <button
        type="submit"
        disabled={busy}
        className="mt-1 self-start rounded-[2px] bg-forest px-5 py-2.5 text-sm font-medium text-cream hover:bg-deep-forest disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? "Saving…" : collectionId ? "Save collection" : "Create collection"}
      </button>
    </form>
  );
}
