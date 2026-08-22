import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ShopByCategory } from "./shop-by-category";

describe("ShopByCategory", () => {
  it("links every tile to its real category page, not a dead '#'", () => {
    render(<ShopByCategory />);

    expect(screen.getByRole("link", { name: /Furniture & Furnishings/ })).toHaveAttribute(
      "href",
      "/furniture",
    );
    expect(screen.getByRole("link", { name: /Tiles & Wall Finishes/ })).toHaveAttribute(
      "href",
      "/tiles-wall-finishes",
    );
    expect(screen.getByRole("link", { name: /Lighting & Automation/ })).toHaveAttribute(
      "href",
      "/lighting",
    );
    expect(screen.getByRole("link", { name: /Sanitaryware & Bath/ })).toHaveAttribute(
      "href",
      "/sanitaryware-bath",
    );
    expect(screen.getByRole("link", { name: /Doors, Windows & Joinery/ })).toHaveAttribute(
      "href",
      "/doors-windows-joinery",
    );
  });
});
