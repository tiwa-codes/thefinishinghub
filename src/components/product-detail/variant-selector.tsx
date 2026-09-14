"use client";

export type ProductVariant = {
  id: string;
  finish: string | null;
  color: string | null;
  size: string | null;
  priceKobo: number | null;
  isDefault: boolean;
  inStock: boolean;
  requiresQuote: boolean;
};

const ATTRIBUTES = [
  { key: "finish", label: "Finish" },
  { key: "color", label: "Colour" },
  { key: "size", label: "Size" },
] as const;

// One pill row per attribute that actually varies across this product's
// variants — a product with a single finish for every variant doesn't get
// a "Finish" row at all, matching the spec ("for each attribute that has
// more than one distinct value").
export function VariantSelector({
  variants,
  selectedId,
  onSelect,
}: {
  variants: ProductVariant[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  if (variants.length <= 1) return null;

  const rows = ATTRIBUTES.map((attr) => {
    const values = Array.from(
      new Set(variants.map((v) => v[attr.key]).filter((v): v is string => Boolean(v))),
    );
    return { ...attr, values };
  }).filter((row) => row.values.length > 1);

  if (rows.length === 0) return null;

  const selected = variants.find((v) => v.id === selectedId);

  function selectByAttribute(key: (typeof ATTRIBUTES)[number]["key"], value: string) {
    // Find a variant matching this value for the changed attribute while
    // keeping the other already-selected attribute values where possible.
    const match =
      variants.find(
        (v) =>
          v[key] === value &&
          ATTRIBUTES.every((a) => a.key === key || !selected?.[a.key] || v[a.key] === selected[a.key]),
      ) ?? variants.find((v) => v[key] === value);
    if (match) onSelect(match.id);
  }

  return (
    <div className="mb-[26px] flex flex-col gap-5">
      {rows.map((row) => (
        <div key={row.key}>
          <div className="mb-2.5 text-xs uppercase tracking-[0.1em] text-[#6b6155]">
            {row.label}
          </div>
          <div className="flex flex-wrap gap-2">
            {row.values.map((value) => {
              const isSelected = selected?.[row.key] === value;
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => selectByAttribute(row.key, value)}
                  className={`cursor-pointer rounded-[2px] border px-4 py-2 text-sm transition-colors duration-200 ${
                    isSelected
                      ? "border-gold text-gold"
                      : "border-[#cbc2b0] text-[#4a4339] hover:border-[#9a8a5c]"
                  }`}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
