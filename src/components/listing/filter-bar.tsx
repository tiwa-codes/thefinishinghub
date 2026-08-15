// Decorative — matches the source design exactly, which has no filter/sort
// logic wired up either (no onClick handlers on any of these). Real
// filtering needs real product attribute data (material, room, style)
// that doesn't exist in the schema yet.
const FILTER_LABELS = ["In Stock", "Price", "Material", "Room", "Style"];

export function FilterBar({ countLabel }: { countLabel: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-5 border-y border-[#ddd5c4] py-3.5">
      <div className="flex flex-wrap items-center gap-2.5">
        {FILTER_LABELS.map((label) => (
          <button
            key={label}
            type="button"
            className="inline-flex items-center gap-2 rounded-[2px] border border-[#cbc2b0] bg-transparent px-4 py-2.5 font-sans text-[13px] font-medium text-[#3a352d] hover:border-forest"
          >
            <span>{label}</span>
            <span className="text-[8px] opacity-60">&#9660;</span>
          </button>
        ))}
      </div>
      <div className="flex items-center gap-4">
        <span className="text-[13px] text-[#8a8073]">{countLabel}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-[0.08em] text-[#8a8073]">
            Sort
          </span>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-[2px] border border-[#cbc2b0] bg-transparent px-4 py-2.5 font-sans text-[13px] font-medium text-[#3a352d] hover:border-forest"
          >
            <span>Featured</span>
            <span className="text-[8px] opacity-60">&#9660;</span>
          </button>
        </div>
      </div>
    </div>
  );
}
