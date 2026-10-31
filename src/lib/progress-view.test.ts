import { describe, expect, it } from "vitest";
import type { CampaignProgressResponse } from "./api-types/leads";
import { GOOGLE_OFF, pauseText, problemText, progressSentence, stepDetail, usd } from "./progress-view";

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
    const pause = { limit: "daily_cap" as const, resumeAt: "2026-10-31T07:00:00Z", lifted: false, canResume: false, reason: null, autoResume: true };
    const text = pauseText(pause, progress({ status: "paused", cost: { claudeUsd: 0, searches: { campaign: 20, budget: null, today: 20, dailyCap: 20, month: 46, monthlyCap: 650 } } }), null, now);
    expect(text.title).toBe("Paused: today's Google searches are used up");
    expect(text.body).toBe(
      "All campaigns together may make 20 Google searches a day, and today's are all used. Searching starts again tomorrow, 08:00 (Lagos time). Google is never called past a limit, so nothing was charged past it.",
    );
    expect(pauseText({ ...pause, autoResume: false }, progress(), null, now).body).toContain("an owner resumes it here once the limit has lifted");
    // 18 of 20 used: paused because the next map tile needs more than 2.
    expect(pauseText(pause, progress({ status: "paused" }), null, now).body).toContain("and only 2 are left today, fewer than the next map tile needs.");
  });

  it("never claims fewer are left than the live count shows", () => {
    const now = new Date("2026-10-30T12:00:00Z");
    const pause = { limit: "daily_cap" as const, resumeAt: "2026-10-31T07:00:00Z", lifted: false, canResume: false, reason: null, autoResume: false };
    const fresh = progress({ status: "paused", cost: { claudeUsd: 0, searches: { campaign: 10, budget: null, today: 0, dailyCap: 40, month: 110, monthlyCap: 300 } } });
    expect(pauseText(pause, fresh, null, now).body).toMatch(/^All campaigns together may make 40 Google searches a day\. The limit resets tomorrow, 08:00 \(Lagos time\)\./);
  });

  it("calls Google being off a setup problem: no time, no limit, nothing charged", () => {
    const off = { limit: "google_off" as const, resumeAt: null, lifted: false, canResume: false, reason: GOOGLE_OFF, autoResume: false };
    const text = pauseText(off, progress({ status: "paused" }), null);
    expect(text).toEqual({ title: "Paused: Google search is off", body: "Google search is turned off on this server. An owner needs to turn it on. Nothing was charged." });
    expect(text.body).not.toMatch(/limit|until|\d{2}:\d{2}/);
    expect(pauseText({ ...off, limit: "google_back", canResume: true }, progress({ status: "paused" }), null).body).toBe(
      "Google search is on again on this server. An owner can resume the search now. Nothing was charged.",
    );
  });

  it("says a cap has lifted only once its own reset has passed, and shows that time", () => {
    const now = new Date("2026-10-31T08:00:00Z");
    const lifted = { limit: "daily_cap" as const, resumeAt: "2026-10-31T07:00:00Z", lifted: true, canResume: true, reason: null, autoResume: false };
    expect(pauseText(lifted, progress({ status: "paused" }), null, now)).toEqual({
      title: "Paused: the limit has lifted",
      body: "The limit reset at later today, 08:00 (Lagos time). An owner can resume the search now.",
    });
  });

  it("shows Claude credit in dollars, with a sliver as under a cent", () => {
    expect(usd(0.4123)).toBe("$0.41");
    expect(usd(0.0021)).toBe("under $0.01");
    expect(usd(0)).toBe("$0.00");
  });
});
