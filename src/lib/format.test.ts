import { describe, expect, it } from "vitest";
import { formatNaira, koboToNairaInput, nairaInputToKobo } from "./format";

describe("formatNaira", () => {
  it("formats kobo as a comma-grouped Naira string", () => {
    expect(formatNaira(125000)).toBe("₦1,250");
  });
});

describe("koboToNairaInput", () => {
  it("converts kobo to a 2-decimal Naira string for form inputs", () => {
    expect(koboToNairaInput(125000)).toBe("1250.00");
    expect(koboToNairaInput(50)).toBe("0.50");
  });
});

describe("nairaInputToKobo", () => {
  it("converts a valid Naira input string to kobo", () => {
    expect(nairaInputToKobo("1250")).toBe(125000);
    expect(nairaInputToKobo("1250.5")).toBe(125050);
    expect(nairaInputToKobo("  99.99  ")).toBe(9999);
  });

  it("rejects empty, non-numeric, zero, and negative input", () => {
    expect(nairaInputToKobo("")).toBeNull();
    expect(nairaInputToKobo("   ")).toBeNull();
    expect(nairaInputToKobo("abc")).toBeNull();
    expect(nairaInputToKobo("0")).toBeNull();
    expect(nairaInputToKobo("-5")).toBeNull();
  });
});
