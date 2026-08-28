import { describe, expect, it } from "vitest";
import { slugify } from "./slugify";

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Outdoor Living")).toBe("outdoor-living");
  });

  it("collapses non-alphanumeric runs into a single hyphen", () => {
    expect(slugify("Bath & Shower  Fixtures!!")).toBe("bath-shower-fixtures");
  });

  it("trims leading and trailing hyphens", () => {
    expect(slugify("  -Bespoke- ")).toBe("bespoke");
  });
});
