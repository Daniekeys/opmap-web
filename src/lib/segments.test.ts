import { describe, expect, it } from "vitest";
import { parseSearchTerms, ratingOptions, signalsInWords } from "./segments";

describe("ratingOptions", () => {
  it("adds a suggested rating that isn't in the list, so the select can show it", () => {
    expect(ratingOptions(null)).toEqual([3, 3.5, 4, 4.5]);
    expect(ratingOptions(4)).toEqual([3, 3.5, 4, 4.5]);
    expect(ratingOptions(4.2)).toEqual([3, 3.5, 4, 4.2, 4.5]);
    expect(ratingOptions(2)).toEqual([2, 3, 3.5, 4, 4.5]);
  });
});

describe("signalsInWords", () => {
  it("says each signal plainly and skips the ones that say nothing", () => {
    expect(
      signalsInWords({ minReviews: 10, minRating: 4, website: "has", socials: "any", categories: ["car_wash", "laundry"] }),
    ).toEqual(["10+ reviews", "rated 4.0+", "has a website", "on Google as car wash, laundry"]);
    expect(signalsInWords({ minReviews: null, minRating: null, website: "lacks", socials: "lacks", categories: [] })).toEqual([
      "no website yet",
      "no social media yet",
    ]);
  });
});

describe("parseSearchTerms", () => {
  it("splits on commas, cleans, dedupes and keeps three", () => {
    expect(parseSearchTerms(" Car  Wash, auto spa,car wash, x, hotel, school")).toEqual(["car wash", "auto spa", "hotel"]);
    expect(parseSearchTerms("")).toEqual([]);
  });
});
