"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  LISTING_SORTS,
  type ListingFilterOptions,
  type ListingFilterState,
  type ListingSort,
} from "@/lib/listing-filters";

function buildQueryString(
  preserveParams: Record<string, string>,
  filters: ListingFilterState,
): string {
  const params = new URLSearchParams(preserveParams);
  if (filters.inStock) params.set("inStock", "1");
  else params.delete("inStock");

  if (filters.priceMinNaira !== null) params.set("priceMin", String(filters.priceMinNaira));
  else params.delete("priceMin");

  if (filters.priceMaxNaira !== null) params.set("priceMax", String(filters.priceMaxNaira));
  else params.delete("priceMax");

  if (filters.finish.length > 0) params.set("finish", filters.finish.join(","));
  else params.delete("finish");

  if (filters.color.length > 0) params.set("color", filters.color.join(","));
  else params.delete("color");

  if (filters.size.length > 0) params.set("size", filters.size.join(","));
  else params.delete("size");

  if (filters.sort !== "featured") params.set("sort", filters.sort);
  else params.delete("sort");

  return params.toString();
}

export function FilterBar({
  countLabel,
  filterOptions,
  activeFilters,
  preserveParams = {},
}: {
  countLabel: string;
  filterOptions: ListingFilterOptions;
  activeFilters: ListingFilterState;
  // Query params this bar doesn't own but must not clobber — e.g. /search's
  // ?q= — passed straight through into every URL it builds.
  preserveParams?: Record<string, string>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [openMenu, setOpenMenu] = useState<null | "finish" | "color" | "size" | "price">(null);
  const [priceMinInput, setPriceMinInput] = useState(
    activeFilters.priceMinNaira !== null ? String(activeFilters.priceMinNaira) : "",
  );
  const [priceMaxInput, setPriceMaxInput] = useState(
    activeFilters.priceMaxNaira !== null ? String(activeFilters.priceMaxNaira) : "",
  );
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function navigate(patch: Partial<ListingFilterState>) {
    const next: ListingFilterState = { ...activeFilters, ...patch };
    const qs = buildQueryString(preserveParams, next);
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  function toggleMultiValue(dimension: "finish" | "color" | "size", value: string) {
    const current = activeFilters[dimension];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    navigate({ [dimension]: next } as Partial<ListingFilterState>);
  }

  function applyPrice() {
    const min = priceMinInput.trim() ? Number(priceMinInput) : null;
    const max = priceMaxInput.trim() ? Number(priceMaxInput) : null;
    navigate({
      priceMinNaira: min !== null && Number.isFinite(min) && min >= 0 ? min : null,
      priceMaxNaira: max !== null && Number.isFinite(max) && max >= 0 ? max : null,
    });
    setOpenMenu(null);
  }

  const priceActive = activeFilters.priceMinNaira !== null || activeFilters.priceMaxNaira !== null;

  return (
    <div
      ref={containerRef}
      className="flex flex-wrap items-center justify-between gap-5 border-y border-[#ddd5c4] py-3.5"
    >
      <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          aria-pressed={activeFilters.inStock}
          onClick={() => navigate({ inStock: !activeFilters.inStock })}
          className={`inline-flex items-center gap-2 rounded-[2px] border px-4 py-2.5 font-sans text-[13px] font-medium ${
            activeFilters.inStock
              ? "border-forest bg-forest text-cream"
              : "border-[#cbc2b0] bg-transparent text-[#3a352d] hover:border-forest"
          }`}
        >
          In Stock
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenMenu(openMenu === "price" ? null : "price")}
            className={`inline-flex items-center gap-2 rounded-[2px] border px-4 py-2.5 font-sans text-[13px] font-medium ${
              priceActive
                ? "border-forest text-forest"
                : "border-[#cbc2b0] bg-transparent text-[#3a352d] hover:border-forest"
            }`}
          >
            <span>Price</span>
            <span className="text-[8px] opacity-60">&#9660;</span>
          </button>
          {openMenu === "price" && (
            <div className="absolute left-0 top-full z-10 mt-1.5 w-60 rounded-[2px] border border-[#ddd5c4] bg-white p-4 shadow-md">
              <div className="mb-3 flex items-center gap-2">
                <label className="sr-only" htmlFor="price-min">
                  Minimum price in Naira
                </label>
                <input
                  id="price-min"
                  type="number"
                  min="0"
                  placeholder="Min ₦"
                  value={priceMinInput}
                  onChange={(e) => setPriceMinInput(e.target.value)}
                  className="w-full rounded-[2px] border border-[#cbc2b0] px-2 py-1.5 text-sm outline-none focus:border-forest"
                />
                <span className="text-[#8a8073]">–</span>
                <label className="sr-only" htmlFor="price-max">
                  Maximum price in Naira
                </label>
                <input
                  id="price-max"
                  type="number"
                  min="0"
                  placeholder="Max ₦"
                  value={priceMaxInput}
                  onChange={(e) => setPriceMaxInput(e.target.value)}
                  className="w-full rounded-[2px] border border-[#cbc2b0] px-2 py-1.5 text-sm outline-none focus:border-forest"
                />
              </div>
              <button
                type="button"
                onClick={applyPrice}
                className="w-full rounded-[2px] bg-forest px-3 py-2 text-xs font-medium text-cream hover:bg-deep-forest"
              >
                Apply
              </button>
            </div>
          )}
        </div>

        {filterOptions.finishes.length > 0 && (
          <MultiSelectDropdown
            label="Finish"
            options={filterOptions.finishes}
            selected={activeFilters.finish}
            open={openMenu === "finish"}
            onToggleOpen={() => setOpenMenu(openMenu === "finish" ? null : "finish")}
            onToggleValue={(v) => toggleMultiValue("finish", v)}
          />
        )}
        {filterOptions.colors.length > 0 && (
          <MultiSelectDropdown
            label="Color"
            options={filterOptions.colors}
            selected={activeFilters.color}
            open={openMenu === "color"}
            onToggleOpen={() => setOpenMenu(openMenu === "color" ? null : "color")}
            onToggleValue={(v) => toggleMultiValue("color", v)}
          />
        )}
        {filterOptions.sizes.length > 0 && (
          <MultiSelectDropdown
            label="Size"
            options={filterOptions.sizes}
            selected={activeFilters.size}
            open={openMenu === "size"}
            onToggleOpen={() => setOpenMenu(openMenu === "size" ? null : "size")}
            onToggleValue={(v) => toggleMultiValue("size", v)}
          />
        )}
      </div>

      <div className="flex items-center gap-4">
        <span className="text-[13px] text-[#8a8073]">{countLabel}</span>
        <div className="flex items-center gap-2">
          <label htmlFor="listing-sort" className="text-xs uppercase tracking-[0.08em] text-[#8a8073]">
            Sort
          </label>
          <select
            id="listing-sort"
            value={activeFilters.sort}
            onChange={(e) => navigate({ sort: e.target.value as ListingSort })}
            className="rounded-[2px] border border-[#cbc2b0] bg-transparent px-3 py-2.5 font-sans text-[13px] font-medium text-[#3a352d] outline-none hover:border-forest"
          >
            {LISTING_SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

function MultiSelectDropdown({
  label,
  options,
  selected,
  open,
  onToggleOpen,
  onToggleValue,
}: {
  label: string;
  options: string[];
  selected: string[];
  open: boolean;
  onToggleOpen: () => void;
  onToggleValue: (value: string) => void;
}) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggleOpen}
        className={`inline-flex items-center gap-2 rounded-[2px] border px-4 py-2.5 font-sans text-[13px] font-medium ${
          selected.length > 0
            ? "border-forest text-forest"
            : "border-[#cbc2b0] bg-transparent text-[#3a352d] hover:border-forest"
        }`}
      >
        <span>
          {label}
          {selected.length > 0 && ` (${selected.length})`}
        </span>
        <span className="text-[8px] opacity-60">&#9660;</span>
      </button>
      {open && (
        <div className="absolute left-0 top-full z-10 mt-1.5 max-h-64 w-48 overflow-y-auto rounded-[2px] border border-[#ddd5c4] bg-white p-2 shadow-md">
          {options.map((opt) => (
            <label
              key={opt}
              className="flex cursor-pointer items-center gap-2 rounded-[2px] px-2 py-1.5 text-sm text-[#3a352d] hover:bg-cream"
            >
              <input
                type="checkbox"
                checked={selected.includes(opt)}
                onChange={() => onToggleValue(opt)}
              />
              {opt}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
