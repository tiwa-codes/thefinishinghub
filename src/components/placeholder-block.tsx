const STRIPE = {
  light: "rgba(22,19,16,0.05)",
  dark: "rgba(244,239,228,0.06)",
} as const;

export function PlaceholderBlock({
  label,
  tone = "light",
  align = "center",
  className = "",
}: {
  label: string;
  tone?: keyof typeof STRIPE;
  // "top" keeps the label clear of foreground copy that's anchored to
  // the bottom of the same box (e.g. CategoryHero's title/description) —
  // at narrow viewports a long, wrapped title can grow tall enough to
  // collide with a dead-centered label otherwise.
  align?: "center" | "top";
  className?: string;
}) {
  return (
    <div
      className={`flex h-full w-full justify-center ${
        align === "top" ? "items-start pt-8" : "items-center"
      } ${className}`}
      style={{
        backgroundImage: `repeating-linear-gradient(45deg, ${STRIPE[tone]} 0 2px, transparent 2px 14px)`,
        backgroundColor: tone === "dark" ? "#0b3221" : "#e2dccf",
      }}
    >
      <span
        className={`font-mono text-[11px] tracking-wide ${
          tone === "dark" ? "text-cream/40" : "text-ink/40"
        }`}
      >
        {label}
      </span>
    </div>
  );
}
