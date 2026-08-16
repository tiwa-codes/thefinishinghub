"use client";

export type ProductVariantOption = {
  id: string;
  label: string;
  swatchColor: string | null;
};

// Only worth showing once there's an actual choice to make — every real
// product today has exactly one (unnamed) variant, so this renders
// nothing yet. Ready for when finish/color options get added for real.
export function VariantPicker({
  variants,
  selectedId,
  onSelect,
}: {
  variants: ProductVariantOption[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  if (variants.length <= 1) return null;

  const selected = variants.find((v) => v.id === selectedId);

  return (
    <div className="mb-[26px]">
      <div className="mb-3 text-xs uppercase tracking-[0.1em] text-[#6b6155]">
        Finish{selected ? ` — ${selected.label}` : ""}
      </div>
      <div className="flex gap-2.5">
        {variants.map((variant) => (
          <button
            key={variant.id}
            type="button"
            aria-label={variant.label}
            aria-pressed={variant.id === selectedId}
            onClick={() => onSelect(variant.id)}
            className="h-[34px] w-[34px] rounded-full border-2 p-0"
            style={{
              backgroundColor: variant.swatchColor ?? "#cbc2b0",
              borderColor: variant.id === selectedId ? "#0d3d28" : "#cbc2b0",
              boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.08)",
            }}
          />
        ))}
      </div>
    </div>
  );
}
