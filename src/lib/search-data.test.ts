import { describe, expect, it } from "vitest";
import { escapeIlike } from "./search-data";

describe("escapeIlike", () => {
  it("leaves ordinary text untouched", () => {
    expect(escapeIlike("brass pendant")).toBe("brass pendant");
  });

  it("escapes ILIKE wildcard characters so they match literally", () => {
    expect(escapeIlike("50% off")).toBe("50\\% off");
    expect(escapeIlike("under_score")).toBe("under\\_score");
  });

  it("escapes a literal backslash first, so it isn't mistaken for part of a later escape", () => {
    expect(escapeIlike("a\\b")).toBe("a\\\\b");
  });
});
