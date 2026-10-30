import { describe, expect, it } from "vitest";
import type { CampaignProgressResponse } from "./api-types/leads";
import { pauseText, problemText, progressSentence, stepDetail, usd } from "./progress-view";

const progress = (over: Partial<CampaignProgressResponse> = {}): CampaignProgressResponse => ({
  status: "running",
  steps: [],
  listings: 214,
  areas: 1,
  tiles: 46,
  query: "cake shop",
  cost: { claudeUsd: 0.41, searches: { campaign: 18, budget: null, today: 18, dailyCap: 20, month: 46, monthlyCap: 650 } },
  pause: null,
  ...over,
});

describe("progress words", () => {
  it("says what the running search is doing", () => {
    expect(stepDetail({ key: "search", state: "running", problem: null }, progress(), 0)).toBe("Searching Google Maps: cake shop, 214 listings so far.");
    expect(stepDetail({ key: "map", state: "done", problem: null }, progress(), 0)).toBe("1 place cut into 46 map tiles.");
    expect(progressSentence(progress())).toBe("18 Google searches and 214 listings so far. You can close this page: the search carries on without it.");
  });

  it("gives a failure's plain reason and what happens next, never the raw error", () => {
    expect(problemText({ message: null, next: "retrying", attempt: 1, attempts: 3 })).toEqual({
      reason: "Something went wrong on our side.",
      next: "Trying again shortly (attempt 1 of 3).",
    });
    expect(problemText({ message: "This campaign has nothing to search for.", next: "stopped", attempt: 1, attempts: 3 }).reason).toBe("This campaign has nothing to search for.");
    expect(problemText({ message: null, next: "skipped", attempt: 1, attempts: 3 }).next).toBe("It was skipped, and the search carries on without it.");
  });

  it("says which cap paused the search, when it resets, and that nothing was charged past it", () => {
    const now = new Date("2026-10-30T12:00:00Z");
    const pause = { limit: "daily_cap" as const, resumeAt: "2026-10-31T07:00:00Z", reason: null, autoResume: true };
    const text = pauseText(pause, progress({ status: "paused", cost: { claudeUsd: 0, searches: { campaign: 20, budget: null, today: 20, dailyCap: 20, month: 46, monthlyCap: 650 } } }), null, now);
    expect(text.title).toBe("Paused: today's Google searches are used up");
    expect(text.body).toBe(
      "All campaigns together may make 20 Google searches a day, and today's are all used. Searching starts again tomorrow, 08:00 (Lagos time). Google is never called past a limit, so nothing was charged past it.",
    );
    expect(pauseText({ ...pause, autoResume: false }, progress(), null, now).body).toContain("an owner resumes it here once the limit has lifted");
    // 18 of 20 used: paused because the next map tile needs more than 2.
    expect(pauseText(pause, progress({ status: "paused" }), null, now).body).toContain("and only 2 are left today, fewer than the next map tile needs.");
  });

  it("shows Claude credit in dollars, with a sliver as under a cent", () => {
    expect(usd(0.4123)).toBe("$0.41");
    expect(usd(0.0021)).toBe("under $0.01");
    expect(usd(0)).toBe("$0.00");
  });
});
