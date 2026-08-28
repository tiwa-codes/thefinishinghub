export function formatNaira(kobo: number): string {
  return `₦${(kobo / 100).toLocaleString("en-NG")}`;
}

// Admin variant-price entry works in Naira (matching how staff think about
// price), storage is always kobo (matching the DB column and formatNaira
// above) — these two convert between the input field and the stored value.
export function koboToNairaInput(kobo: number): string {
  return (kobo / 100).toFixed(2);
}

// Returns null for anything that isn't a valid, positive amount so callers
// can reject it at save time instead of silently coercing to 0.
export function nairaInputToKobo(input: string): number | null {
  const trimmed = input.trim();
  if (trimmed === "") return null;
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.round(value * 100);
}
