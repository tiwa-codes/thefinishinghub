const STRIPE = {
  light: "rgba(22,19,16,0.05)",
  dark: "rgba(244,239,228,0.06)",
} as const;

export function PlaceholderBlock({
  label,
  tone = "light",
  className = "",
}: {
  label: string;
  tone?: keyof typeof STRIPE;
  className?: string;
}) {
  return (
    <div
      className={`flex h-full w-full items-center justify-center ${className}`}
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
