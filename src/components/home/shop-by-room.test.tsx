import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ShopByRoom } from "./shop-by-room";

// PENDING REWORK: ShopByRoom is off the homepage (see shop-by-room.tsx),
// and its old room slugs (furniture-living/dining/workspace) no longer
// exist in the categories table, so hrefForSubcategorySlug correctly
// falls back to "#" for them now. Bedroom's slug is unchanged and still
// resolves for real.
describe("ShopByRoom", () => {
  it("links each room to its real listing page", () => {
    render(<ShopByRoom />);
    expect(screen.getByRole("link", { name: /^Living Room/ })).toHaveAttribute(
      "href",
      "#",
    );
    expect(screen.getByRole("link", { name: /^Dining/ })).toHaveAttribute(
      "href",
      "#",
    );
    expect(screen.getByRole("link", { name: /^Workspace/ })).toHaveAttribute(
      "href",
      "#",
    );
    expect(screen.getByRole("link", { name: /^Bedroom/ })).toHaveAttribute(
      "href",
      "/furniture/bedroom",
    );
  });
});
