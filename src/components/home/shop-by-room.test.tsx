import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ShopByRoom } from "./shop-by-room";

describe("ShopByRoom", () => {
  it("links each room to its real listing page", () => {
    render(<ShopByRoom />);
    expect(screen.getByRole("link", { name: /^Living Room/ })).toHaveAttribute(
      "href",
      "/furniture/living",
    );
    expect(screen.getByRole("link", { name: /^Dining/ })).toHaveAttribute(
      "href",
      "/furniture/dining",
    );
    expect(screen.getByRole("link", { name: /^Workspace/ })).toHaveAttribute(
      "href",
      "/furniture/workspace",
    );
    expect(screen.getByRole("link", { name: /^Bedroom/ })).toHaveAttribute(
      "href",
      "/furniture/bedroom",
    );
  });
});
