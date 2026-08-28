"use client";

import { useEffect, useState } from "react";
import type { TopLevelWithSubs } from "@/lib/admin/category-tree";

// Enforces the "saved category_id must be the subcategory, never a
// top-level id" rule structurally: onChange only ever fires with a
// top-level id when that top-level currently has zero subcategories
// (true today only for Lighting, Tiles & Wall Finishes, and Doors,
// Windows & Joinery — matches real seeded data). The moment subcategories
// exist under a top-level, picking one becomes mandatory before onChange
// fires at all.
export function CategoryPicker({
  tree,
  value,
  onChange,
}: {
  tree: TopLevelWithSubs[];
  value: string;
  onChange: (categoryId: string) => void;
}) {
  const initialTop = tree.find(
    (t) => t.id === value || t.subcategories.some((s) => s.id === value),
  );
  const [topId, setTopId] = useState(initialTop?.id ?? "");
  const [subId, setSubId] = useState(
    initialTop?.subcategories.some((s) => s.id === value) ? value : "",
  );

  useEffect(() => {
    const top = tree.find(
      (t) => t.id === value || t.subcategories.some((s) => s.id === value),
    );
    if (!top) return;
    setTopId(top.id);
    setSubId(top.subcategories.some((s) => s.id === value) ? value : "");
  }, [value, tree]);

  const selectedTop = tree.find((t) => t.id === topId);
  const hasSubcategories = (selectedTop?.subcategories.length ?? 0) > 0;

  function handleTopChange(nextTopId: string) {
    setTopId(nextTopId);
    setSubId("");
    const next = tree.find((t) => t.id === nextTopId);
    if (next && next.subcategories.length === 0) {
      onChange(nextTopId);
    }
  }

  function handleSubChange(nextSubId: string) {
    setSubId(nextSubId);
    if (nextSubId) onChange(nextSubId);
  }

  return (
    <div className="flex gap-3">
      <div className="flex-1">
        <label
          htmlFor="category-picker-top"
          className="mb-1 block text-[11px] uppercase tracking-[0.08em] text-[#6b6155]"
        >
          Category
        </label>
        <select
          id="category-picker-top"
          value={topId}
          onChange={(e) => handleTopChange(e.target.value)}
          className="w-full rounded-[2px] border border-[#cfc6b6] px-3 py-2 text-sm text-ink outline-none focus:border-forest"
        >
          <option value="" disabled>
            Select a category…
          </option>
          {tree.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>
      {hasSubcategories && (
        <div className="flex-1">
          <label
            htmlFor="category-picker-sub"
            className="mb-1 block text-[11px] uppercase tracking-[0.08em] text-[#6b6155]"
          >
            Subcategory
          </label>
          <select
            id="category-picker-sub"
            value={subId}
            onChange={(e) => handleSubChange(e.target.value)}
            className="w-full rounded-[2px] border border-[#cfc6b6] px-3 py-2 text-sm text-ink outline-none focus:border-forest"
          >
            <option value="" disabled>
              Select a subcategory…
            </option>
            {selectedTop?.subcategories.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
