import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ShopByRoom } from "./shop-by-room";

describe("ShopByRoom", () => {
  it("links Living Room to its real listing page", () => {
    render(<ShopByRoom />);
    expect(screen.getByRole("link", { name: /^Living Room/ })).toHaveAttribute(
      "href",
      "/furniture/living",
    );
  });

  it("leaves rooms without a built listing page as '#', instead of a misleading destination", () => {
    render(<ShopByRoom />);
    expect(screen.getByRole("link", { name: /^Dining/ })).toHaveAttribute("href", "#");
    expect(screen.getByRole("link", { name: /^Workspace/ })).toHaveAttribute("href", "#");
    expect(screen.getByRole("link", { name: /^Bedroom/ })).toHaveAttribute("href", "#");
  });
});
