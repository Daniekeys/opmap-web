// Plain words for a campaign's progress (design/screens/Progress.dc.html):
// each step's title and what it is doing, what a failure means, why the
// search is paused, and what it has cost.
import type { CampaignProgressResponse, PauseLimit, ProgressStep, ProgressStepKey, ProgressStepState } from "./api-types/leads";
import { pausedUntil } from "./leads";

type Progress = CampaignProgressResponse;

export const STEP_TITLES: Record<ProgressStepKey, string> = {
  map: "Map out the places",
  search: "Search Google Maps",
  dedupe: "Remove duplicates",
  fit: "Check who fits",
  contacts: "Find contact details",
};

export const STATE_WORDS: Record<ProgressStepState, string> = {
  done: "Done",
  running: "Running",
  waiting: "Waiting",
  failed: "Failed",
  skipped: "Not needed",
};

const plural = (n: number, one: string, many: string) => `${n.toLocaleString("en-GB")} ${n === 1 ? one : many}`;

// What a step did, or is doing now, in one sentence.
export function stepDetail(step: ProgressStep, p: Progress, leadCount: number): string {
  const { state } = step;
  switch (step.key) {
    case "map":
      return p.tiles > 0 ? `${plural(p.areas, "place", "places")} cut into ${plural(p.tiles, "map tile", "map tiles")}.` : "Finds each place's boundary and cuts it into map tiles.";
    case "search":
      if (state === "running") return p.query ? `Searching Google Maps: ${p.query}, ${plural(p.listings, "listing", "listings")} so far.` : `Searching Google Maps, ${plural(p.listings, "listing", "listings")} so far.`;
      if (p.listings > 0) return `${plural(p.listings, "listing", "listings")} from ${plural(p.cost.searches.campaign, "Google search", "Google searches")}.`;
      return "Searches every map tile for each search term.";
    case "dedupe":
      return "One record per business, even when it is listed twice.";
    case "fit":
      return state === "waiting" ? "Businesses that don't fit drop out before any money is spent on them." : `${plural(leadCount, "good fit", "good fits")} so far. The rest dropped out before any money was spent on them.`;
    case "contacts":
      return state === "skipped" ? "No new leads to look up." : "WhatsApp, phone and email from their own pages, each labelled.";
  }
}

// What went wrong and what happens next, never a raw error.
export function problemText(problem: NonNullable<ProgressStep["problem"]>): { reason: string; next: string } {
  const reason = problem.message ?? "Something went wrong on our side.";
  if (problem.next === "skipped") return { reason: "One part of this step failed.", next: "It was skipped, and the search carries on without it." };
  if (problem.next === "retrying") return { reason, next: `Trying again shortly (attempt ${problem.attempt} of ${problem.attempts}).` };
  return { reason, next: "The search stopped here. What it found is kept, and an owner can start it again." };
}

const PAUSE_TITLES: Record<PauseLimit, string> = {
  daily_cap: "Paused: today's Google searches are used up",
  monthly_cap: "Paused: this month's Google searches are used up",
  campaign_daily: "Paused: this campaign's searches for today are done",
  offline: "Waiting for a worker that can call Google",
  lifted: "Paused: the limit has lifted",
  other: "Paused",
};

// The cap-reached state: which limit, when it resets, and that nothing was
// charged past it.
export function pauseText(pause: NonNullable<Progress["pause"]>, p: Progress, dailyCalls: number | null, now = new Date()) {
  const { searches } = p.cost;
  const resumes = pause.resumeAt ? `${pause.autoResume ? "Searching starts again" : "The limit resets"} ${pausedUntil(pause.resumeAt, now)} (Lagos time).` : "";
  const byHand = pause.autoResume ? "" : " In development the search doesn't restart on its own: an owner resumes it here once the limit has lifted.";
  const notCharged = "Google is never called past a limit, so nothing was charged past it.";
  // A search pauses once fewer are left than the next map tile needs.
  const left = (cap: number, used: number, period: string) =>
    cap - used <= 0 ? `and ${period}'s are all used.` : `and only ${cap - used} ${cap - used === 1 ? "is" : "are"} left ${period === "today" ? "today" : "this month"}, fewer than the next map tile needs.`;
  const body = (() => {
    switch (pause.limit) {
      case "daily_cap":
        return `All campaigns together may make ${searches.dailyCap} Google searches a day, ${left(searches.dailyCap, searches.today, "today")} ${resumes}${byHand} ${notCharged}`;
      case "monthly_cap":
        return `All campaigns together may make ${searches.monthlyCap.toLocaleString("en-GB")} Google searches a month, ${left(searches.monthlyCap, searches.month, "this month")} ${resumes}${byHand} ${notCharged}`;
      case "campaign_daily":
        return `This campaign is set to ${dailyCalls ?? "a few"} Google searches a day. ${resumes}${byHand} ${notCharged}`;
      case "offline":
        return `This worker can't call Google, so the search is handed back to one that can. ${resumes} Nothing was charged.`;
      case "lifted":
        return pause.autoResume ? "The limit has lifted. The search picks up again in a moment." : "The limit has lifted. An owner can resume the search now.";
      case "other":
        return `${pause.reason ?? "The search is paused."} ${resumes}`;
    }
  })();
  return { title: PAUSE_TITLES[pause.limit], body: body.replace(/\s+/g, " ").trim() };
}

// "$0.41", or "under $0.01" for a sliver.
export const usd = (n: number) => (n === 0 ? "$0.00" : n < 0.01 ? "under $0.01" : `$${n.toFixed(2)}`);

// The headline sentence: how far it has got, and that the page can be closed.
export function progressSentence(p: Progress): string {
  const searched = plural(p.cost.searches.campaign, "Google search", "Google searches");
  if (p.status === "running") return `${searched} and ${plural(p.listings, "listing", "listings")} so far. You can close this page: the search carries on without it.`;
  if (p.status === "paused") return `${searched} and ${plural(p.listings, "listing", "listings")} so far. The leads found are in the list.`;
  if (p.status === "done") return `The search covered every place in this campaign: ${searched}, ${plural(p.listings, "listing", "listings")}.`;
  return `${searched} and ${plural(p.listings, "listing", "listings")} before it ended.`;
}
