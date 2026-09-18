import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CartProvider } from "@/lib/cart-context";
import { TradeAccountProvider } from "@/lib/trade-account-context";
import { WishlistView } from "./wishlist-view";
import { WISHLIST_STORAGE_KEY } from "@/lib/wishlist";

const PRODUCT_ROW = {
  id: "product-1",
  slug: "carrara-porcelain-60x120",
  name: "Carrara Porcelain, 60×120",
  short_description: "Polished porcelain slab",
  created_at: new Date().toISOString(),
  collection: null,
  is_bestseller: false,
  categories: { name: "Tiles & Wall Finishes" },
  public_product_variants: [{ id: "v1", price_kobo: 1850000, is_default: true, requires_quote: false }],
  product_images: [],
};

let queryResult: { data: unknown[]; error: null } = { data: [], error: null };

function makeBuilder() {
  const builder: Record<string, unknown> = {
    select: () => builder,
    in: () => builder,
    eq: () => builder,
    returns: () => builder,
    then: (resolve: (result: typeof queryResult) => void) => resolve(queryResult),
  };
  return builder;
}

vi.mock("@/lib/supabase/public", () => ({
  createPublicClient: () => ({ from: () => makeBuilder() }),
}));

function renderView() {
  return render(
    <CartProvider>
      <TradeAccountProvider>
        <WishlistView />
      </TradeAccountProvider>
    </CartProvider>,
  );
}

beforeEach(() => {
  window.localStorage.clear();
  queryResult = { data: [], error: null };
});

describe("WishlistView", () => {
  it("shows the empty state and a link to browse collections when localStorage has no wishlist items", async () => {
    renderView();
    expect(await screen.findByText("Your wishlist is empty.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Browse our collections" })).toHaveAttribute(
      "href",
      "/furniture",
    );
  });

  it("shows the breadcrumb Home / Wishlist", async () => {
    renderView();
    await screen.findByText("Your wishlist is empty.");
    expect(screen.getByRole("heading", { name: "Your Wishlist" })).toBeInTheDocument();
    expect(screen.getByText("Wishlist")).toBeInTheDocument();
  });

  it("fetches and renders products whose ids are stored in localStorage", async () => {
    window.localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(["product-1"]));
    queryResult = { data: [PRODUCT_ROW], error: null };
    renderView();
    expect(await screen.findByText("Carrara Porcelain, 60×120")).toBeInTheDocument();
  });

  it("removes a product from the wishlist and the grid when its remove button is clicked", async () => {
    window.localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(["product-1"]));
    queryResult = { data: [PRODUCT_ROW], error: null };
    renderView();
    await screen.findByText("Carrara Porcelain, 60×120");

    fireEvent.click(
      screen.getByRole("button", { name: "Remove Carrara Porcelain, 60×120 from wishlist" }),
    );

    await waitFor(() => expect(screen.queryByText("Carrara Porcelain, 60×120")).toBeNull());
    expect(JSON.parse(window.localStorage.getItem(WISHLIST_STORAGE_KEY) ?? "[]")).toEqual([]);
  });
});
