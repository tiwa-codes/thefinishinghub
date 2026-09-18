// Wishlist has no backend yet — just a plain array of product ids in
// localStorage, shared between the nav's heart icon (does it have any
// items at all?) and the /wishlist page itself (which items?). Wrapped in
// try/catch throughout: localStorage can throw in private-browsing/blocked
// contexts, and a broken wishlist should never crash the page around it.
export const WISHLIST_STORAGE_KEY = "tfh_wishlist";

export function getWishlistIds(): string[] {
  try {
    const raw = window.localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function setWishlistIds(ids: string[]): void {
  try {
    window.localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Best-effort — a failed write just means the wishlist doesn't
    // persist this time, not something to surface to the visitor.
  }
}

export function removeFromWishlist(productId: string): string[] {
  const next = getWishlistIds().filter((id) => id !== productId);
  setWishlistIds(next);
  return next;
}
