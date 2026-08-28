"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/slugify";
import {
  fetchCategoryTree,
  type TopLevelWithSubs,
  type CategoryRow,
} from "@/lib/admin/category-tree";

export default function AdminCategoriesPage() {
  const [tree, setTree] = useState<TopLevelWithSubs[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const supabase = createClient();
    setTree(await fetchCategoryTree(supabase));
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  if (loading) {
    return <p className="text-sm text-[#8a8073]">Loading categories…</p>;
  }

  return (
    <div className="max-w-[880px]">
      <div className="mb-2 font-serif text-2xl text-ink">Categories</div>
      <p className="mb-8 text-sm text-[#6b6155]">
        The 5 top-level categories are locked site structure — add, rename,
        reorder, and delete subcategories under each.
      </p>
      <div className="flex flex-col gap-8">
        {tree.map((top) => (
          <TopLevelSection key={top.id} top={top} onChanged={reload} />
        ))}
      </div>
    </div>
  );
}

function TopLevelSection({
  top,
  onChanged,
}: {
  top: TopLevelWithSubs;
  onChanged: () => void;
}) {
  return (
    <section className="rounded-[2px] border border-[#ddd5c4] bg-white">
      <div className="border-b border-[#ddd5c4] px-5 py-4">
        <p className="font-serif text-lg text-ink">{top.name}</p>
        <p className="font-mono text-[11px] text-[#8a8073]">/{top.slug}</p>
      </div>
      <div className="flex flex-col divide-y divide-[#eee7d8]">
        {top.subcategories.map((sub, i) => (
          <SubcategoryRowItem
            key={sub.id}
            sub={sub}
            isFirst={i === 0}
            isLast={i === top.subcategories.length - 1}
            siblingAbove={top.subcategories[i - 1]}
            siblingBelow={top.subcategories[i + 1]}
            onChanged={onChanged}
          />
        ))}
        {top.subcategories.length === 0 && (
          <p className="px-5 py-4 text-sm text-[#8a8073]">
            No subcategories yet.
          </p>
        )}
      </div>
      <div className="border-t border-[#ddd5c4] px-5 py-4">
        <AddSubcategoryForm parent={top} onAdded={onChanged} />
      </div>
    </section>
  );
}

function SubcategoryRowItem({
  sub,
  isFirst,
  isLast,
  siblingAbove,
  siblingBelow,
  onChanged,
}: {
  sub: CategoryRow;
  isFirst: boolean;
  isLast: boolean;
  siblingAbove?: CategoryRow;
  siblingBelow?: CategoryRow;
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(sub.name);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blockingProducts, setBlockingProducts] = useState<string[] | null>(
    null,
  );

  async function handleRename() {
    if (!name.trim() || name === sub.name) {
      setEditing(false);
      setName(sub.name);
      return;
    }
    setBusy(true);
    const supabase = createClient();
    const { error: updErr } = await supabase
      .from("categories")
      .update({ name: name.trim() })
      .eq("id", sub.id);
    setBusy(false);
    if (updErr) {
      setError(updErr.message);
      return;
    }
    setEditing(false);
    onChanged();
  }

  async function handleSwap(other?: CategoryRow) {
    if (!other) return;
    setBusy(true);
    const supabase = createClient();
    await Promise.all([
      supabase
        .from("categories")
        .update({ display_order: other.display_order })
        .eq("id", sub.id),
      supabase
        .from("categories")
        .update({ display_order: sub.display_order })
        .eq("id", other.id),
    ]);
    setBusy(false);
    onChanged();
  }

  async function handleDelete() {
    setBusy(true);
    setError(null);
    setBlockingProducts(null);
    const supabase = createClient();

    const { data: blocking } = await supabase
      .from("products")
      .select("name")
      .eq("category_id", sub.id);

    if (blocking && blocking.length > 0) {
      setBlockingProducts(blocking.map((p) => p.name));
      setBusy(false);
      return;
    }

    if (!window.confirm(`Delete "${sub.name}"? This cannot be undone.`)) {
      setBusy(false);
      return;
    }

    const { error: delErr } = await supabase
      .from("categories")
      .delete()
      .eq("id", sub.id);
    setBusy(false);
    if (delErr) {
      setError(delErr.message);
      return;
    }
    onChanged();
  }

  return (
    <div className="px-5 py-3.5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex flex-col">
            <button
              type="button"
              disabled={isFirst || busy}
              onClick={() => handleSwap(siblingAbove)}
              aria-label={`Move ${sub.name} up`}
              className="text-xs text-[#8a8073] hover:text-ink disabled:opacity-30"
            >
              ▲
            </button>
            <button
              type="button"
              disabled={isLast || busy}
              onClick={() => handleSwap(siblingBelow)}
              aria-label={`Move ${sub.name} down`}
              className="text-xs text-[#8a8073] hover:text-ink disabled:opacity-30"
            >
              ▼
            </button>
          </div>
          {editing ? (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              className="rounded-[2px] border border-[#cfc6b6] px-2 py-1 text-sm text-ink outline-none focus:border-forest"
            />
          ) : (
            <div>
              <p className="text-sm text-ink">{sub.name}</p>
              <p className="font-mono text-[11px] text-[#8a8073]">
                /{sub.slug}
              </p>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={handleRename}
                className="text-xs font-medium text-forest hover:underline"
              >
                Save
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setEditing(false);
                  setName(sub.name);
                }}
                className="text-xs text-[#8a8073] hover:underline"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={() => setEditing(true)}
              className="text-xs font-medium text-forest hover:underline"
            >
              Rename
            </button>
          )}
          <button
            type="button"
            disabled={busy}
            onClick={handleDelete}
            className="text-xs font-medium text-[#b3261e] hover:underline"
          >
            Delete
          </button>
        </div>
      </div>
      {blockingProducts && (
        <p className="mt-2 text-[13px] text-[#b3261e]">
          Can&apos;t delete — {blockingProducts.length} product
          {blockingProducts.length === 1 ? "" : "s"} still use this
          subcategory: {blockingProducts.join(", ")}.
        </p>
      )}
      {error && <p className="mt-2 text-[13px] text-[#b3261e]">{error}</p>}
    </div>
  );
}

function AddSubcategoryForm({
  parent,
  onAdded,
}: {
  parent: TopLevelWithSubs;
  onAdded: () => void;
}) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleNameChange(value: string) {
    setName(value);
    if (!slugTouched) {
      setSlug(value.trim() ? `${parent.slug}-${slugify(value)}` : "");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const nextOrder =
      parent.subcategories.length > 0
        ? Math.max(...parent.subcategories.map((s) => s.display_order)) + 1
        : 1;
    const { error: insErr } = await supabase.from("categories").insert({
      name: name.trim(),
      slug: slug.trim(),
      parent_id: parent.id,
      display_order: nextOrder,
    });
    setBusy(false);
    if (insErr) {
      setError(insErr.message);
      return;
    }
    setName("");
    setSlug("");
    setSlugTouched(false);
    onAdded();
  }

  const nameFieldId = `new-subcategory-name-${parent.id}`;
  const slugFieldId = `new-subcategory-slug-${parent.id}`;

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <div className="flex-1">
        <label
          htmlFor={nameFieldId}
          className="mb-1 block text-[11px] uppercase tracking-[0.08em] text-[#6b6155]"
        >
          New subcategory
        </label>
        <input
          id={nameFieldId}
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="e.g. Outdoor"
          className="w-full rounded-[2px] border border-[#cfc6b6] px-3 py-2 text-sm text-ink outline-none focus:border-forest"
        />
      </div>
      <div className="flex-1">
        <label
          htmlFor={slugFieldId}
          className="mb-1 block text-[11px] uppercase tracking-[0.08em] text-[#6b6155]"
        >
          Slug
        </label>
        <input
          id={slugFieldId}
          value={slug}
          onChange={(e) => {
            setSlug(e.target.value);
            setSlugTouched(true);
          }}
          className="w-full rounded-[2px] border border-[#cfc6b6] px-3 py-2 font-mono text-sm text-ink outline-none focus:border-forest"
        />
      </div>
      <button
        type="submit"
        disabled={busy || !name.trim() || !slug.trim()}
        className="rounded-[2px] bg-forest px-4 py-2 text-sm font-medium text-cream hover:bg-deep-forest disabled:cursor-not-allowed disabled:opacity-60"
      >
        Add
      </button>
      {error && (
        <p className="ml-2 text-[13px] text-[#b3261e]">{error}</p>
      )}
    </form>
  );
}
