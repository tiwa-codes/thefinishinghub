import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { DesignServices } from "./design-services";

describe("DesignServices", () => {
  it("exposes a #design-services anchor other sections can link to", () => {
    const { container } = render(<DesignServices />);
    expect(container.querySelector("#design-services")).not.toBeNull();
  });

  it("points 'Start a project' at the real showroom booking section", () => {
    render(<DesignServices />);
    expect(screen.getByRole("link", { name: "Start a project" })).toHaveAttribute(
      "href",
      "/#showroom",
    );
  });
});
