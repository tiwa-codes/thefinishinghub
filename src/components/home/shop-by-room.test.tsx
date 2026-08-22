import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ShopByRoom } from "./shop-by-room";

describe("ShopByRoom", () => {
  it("links each room with a built listing page to its real page", () => {
    render(<ShopByRoom />);
    expect(screen.getByRole("link", { name: /^Living Room/ })).toHaveAttribute(
      "href",
      "/furniture/living",
    );
    expect(screen.getByRole("link", { name: /^Dining/ })).toHaveAttribute(
      "href",
      "/furniture/dining",
    );
    expect(screen.getByRole("link", { name: /^Bedroom/ })).toHaveAttribute(
      "href",
      "/furniture/bedroom",
    );
  });

  it("leaves a room without a built listing page as '#', instead of a misleading destination", () => {
    render(<ShopByRoom />);
    expect(screen.getByRole("link", { name: /^Workspace/ })).toHaveAttribute("href", "#");
  });
});
