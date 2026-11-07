import { describe, expect, it } from "vitest";
import { moreToRight } from "./scroll-hint";

describe("the chip row's scroll hint", () => {
  it("shows while chips are hidden to the right, and not once scrolled to the end or when all fit", () => {
    expect(moreToRight({ scrollLeft: 0, clientWidth: 348, scrollWidth: 420 })).toBe(true);
    expect(moreToRight({ scrollLeft: 72, clientWidth: 348, scrollWidth: 420 })).toBe(false);
    // Sub-pixel rounding at the end still counts as the end.
    expect(moreToRight({ scrollLeft: 71.5, clientWidth: 348, scrollWidth: 420 })).toBe(false);
    expect(moreToRight({ scrollLeft: 0, clientWidth: 900, scrollWidth: 900 })).toBe(false);
  });
});
