import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { LooksRow, type LookCard } from "./looks-row";

const LOOKS: LookCard[] = [
  {
    id: "look-1",
    slug: "the-grand-salon",
    title: "The Grand Salon",
    description: "A living room that commands the room.",
    imageUrl: "https://images.unsplash.com/photo-1600210491892-03d54c0aaf87",
    styleName: "Villa",
    productNames: ["Positano Sofa", "Positano Accent Chair"],
  },
  {
    id: "look-2",
    slug: "where-focus-lives",
    title: "Where Focus Lives",
    description: "A workspace that earns its place in the home.",
    imageUrl: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7",
    styleName: null,
    productNames: [],
  },
];

describe("LooksRow", () => {
  it("renders when looks exist", () => {
    render(<LooksRow looks={LOOKS} />);
    expect(screen.getByText("The Grand Salon")).toBeInTheDocument();
    expect(screen.getByText(/trending/)).toBeInTheDocument();
  });

  it("shows a look card's style tag, title, description and shop link", () => {
    render(<LooksRow looks={LOOKS} />);
    expect(screen.getByText("Villa")).toBeInTheDocument();
    expect(screen.getByText("A living room that commands the room.")).toBeInTheDocument();
    expect(screen.getAllByText("Shop this look →").length).toBe(LOOKS.length);
    expect(screen.getByRole("link", { name: /The Grand Salon/ })).toHaveAttribute(
      "href",
      "/looks/the-grand-salon",
    );
  });

  it("shows up to 3 product names as a comma-separated line", () => {
    render(<LooksRow looks={LOOKS} />);
    expect(screen.getByText("Positano Sofa, Positano Accent Chair")).toBeInTheDocument();
  });

  it("omits the style tag and product-names line when they're not set", () => {
    render(<LooksRow looks={[LOOKS[1]]} />);
    expect(screen.queryByText("Villa")).toBeNull();
    expect(screen.getByText("Where Focus Lives")).toBeInTheDocument();
  });

  it("has left/right scroll arrow buttons", () => {
    render(<LooksRow looks={LOOKS} />);
    expect(screen.getByRole("button", { name: "Scroll looks left" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Scroll looks right" })).toBeInTheDocument();
  });
});
