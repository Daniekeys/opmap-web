import { describe, expect, it } from "vitest";
import { parseSearchTerms, rankedUpWhen, rankLabel, ratingOptions, reachWords, segmentsIntro, signalsInWords } from "./segments";

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

describe("segment cards", () => {
  const none = { minReviews: null, minRating: null, website: "any" as const, socials: "any" as const, categories: [] };

  it("names the best match and numbers the rest", () => {
    expect(rankLabel(1)).toBe("1. Best match");
    expect(rankLabel(4)).toBe("4.");
  });

  it("has two reach pills, no partly", () => {
    expect(reachWords("places")).toEqual({ text: "Easy to find on Maps", tone: "positive" });
    expect(reachWords("not_yet")).toEqual({ text: "Not on Maps yet", tone: "neutral" });
  });

  it("says what ranks a business up, or that nothing in particular does", () => {
    expect(rankedUpWhen({ ...none, minReviews: 100, website: "lacks" })).toBe("Ranked up when: 100+ reviews, no website yet");
    expect(rankedUpWhen(none)).toBe("No particular signals");
  });

  it("says what the ranking weighs and from which version", () => {
    expect(segmentsIntro(2)).toBe(
      "Ranked from your Brand DNA, version 2: how much the problem hurts, whether they can pay, and how visible they already are online.",
    );
    expect(segmentsIntro(null)).toMatch(/^Ranked from your Brand DNA: /);
  });
});
