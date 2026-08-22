import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { RoomEditorial } from "./room-editorial";

describe("RoomEditorial", () => {
  it("points 'See the approach' at the real design-services section", () => {
    render(<RoomEditorial />);
    expect(screen.getByRole("link", { name: "See the approach" })).toHaveAttribute(
      "href",
      "/#design-services",
    );
  });
});
