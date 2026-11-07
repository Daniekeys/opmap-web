// Plain words for a campaign's progress (design/screens/Progress.dc.html):
// each step's title and what it is doing, what a failure means, why the
// search is paused, and what it has cost.
import type { CampaignProgressResponse, PauseLimit, ProgressStep, ProgressStepKey, ProgressStepState } from "./api-types/leads";
import { zoneName } from "./format";
import { pausedUntil } from "./leads";

// The banner while the server can't call Google (the API's GOOGLE_OFF, which
// Resume search answers with too).
export const GOOGLE_OFF = "Google search is turned off on this server. An owner needs to turn it on. Nothing was charged.";

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
  google_off: "Paused: Google search is off",
  google_back: "Paused: Google search was off",
  daily_cap: "Paused: today's Google searches are used up",
  monthly_cap: "Paused: this month's Google searches are used up",
  campaign_daily: "Paused: this campaign's searches for today are done",
  google_quota: "Paused: Google's quota for today is used up",
  other: "Paused",
};

// Why the search is paused, from the API's pause state (the one Resume search
// acts on): Google off is a setup problem with no time; a cap says which, when
// it resets, and that nothing was charged past it.
export function pauseText(pause: NonNullable<Progress["pause"]>, p: Progress, dailyCalls: number | null, timeZone: string, now = new Date()) {
  if (pause.limit === "google_off") return { title: PAUSE_TITLES.google_off, body: GOOGLE_OFF };
  if (pause.limit === "google_back") {
    return { title: PAUSE_TITLES.google_back, body: "Google search is on again on this server. An owner can resume the search now. Nothing was charged." };
  }
  if (pause.lifted) {
    const at = pause.resumeAt ? ` at ${pausedUntil(pause.resumeAt, timeZone, now)} (${zoneName(timeZone)})` : "";
    const next = pause.autoResume ? "The search picks up again in a moment." : "An owner can resume the search now.";
    return { title: "Paused: the limit has lifted", body: `The limit reset${at}. ${next}` };
  }
  const { searches } = p.cost;
  const resumes = pause.resumeAt ? `${pause.autoResume ? "Searching starts again" : "The limit resets"} ${pausedUntil(pause.resumeAt, timeZone, now)} (${zoneName(timeZone)}).` : "";
  const byHand = pause.autoResume ? "" : " The search doesn't restart on its own: an owner resumes it here once the limit has lifted.";
  const notCharged = "Google is never called past a limit, so nothing was charged past it.";
  // A search pauses once fewer are left than the next map tile needs (up to
  // 3). The count is today's live one, so say how many are left only while it
  // still shows that: the cap is the one the search stored.
  const left = (cap: number, used: number, period: string) => {
    const n = cap - used;
    if (n <= 0) return `and ${period}'s are all used.`;
    if (n < 3) return `and only ${n} ${n === 1 ? "is" : "are"} left ${period === "today" ? "today" : "this month"}, fewer than the next map tile needs.`;
    return "";
  };
  const withLeft = (clause: string) => (clause ? `, ${clause}` : ".");
  const body = (() => {
    switch (pause.limit) {
      case "daily_cap":
        return `All campaigns together may make ${searches.dailyCap} Google searches a day${withLeft(left(searches.dailyCap, searches.today, "today"))} ${resumes}${byHand} ${notCharged}`;
      case "monthly_cap":
        return `All campaigns together may make ${searches.monthlyCap.toLocaleString("en-GB")} Google searches a month${withLeft(left(searches.monthlyCap, searches.month, "this month"))} ${resumes}${byHand} ${notCharged}`;
      case "campaign_daily":
        return `This campaign is set to ${dailyCalls ?? "a few"} Google searches a day. ${resumes}${byHand} ${notCharged}`;
      case "google_quota":
        return `Google says today's search quota is used up. ${resumes}${byHand} ${notCharged}`;
      case "other":
        return `${pause.reason ?? "The search is paused."} ${resumes}`;
    }
  })();
  return { title: PAUSE_TITLES[pause.limit], body: body.replace(/\s+/g, " ").trim() };
}

// "$0.41", or "under $0.01" for a sliver.
export const usd = (n: number) => (n === 0 ? "$0.00" : n < 0.01 ? "under $0.01" : `$${n.toFixed(2)}`);

// The headline sentence: how far it has got, and that the page can be closed.
// A search with leads wanted ends once it has them, or says how many it found
// when the idea ran out of good fits first.
export function progressSentence(p: Progress, found: { leadsWanted: number | null; leadCount: number } = { leadsWanted: null, leadCount: 0 }): string {
  const searched = plural(p.cost.searches.campaign, "Google search", "Google searches");
  if (p.status === "running") return `${searched} and ${plural(p.listings, "listing", "listings")} so far. You can close this page: the search carries on without it.`;
  if (p.status === "paused") return `${searched} and ${plural(p.listings, "listing", "listings")} so far. The leads found are in the list.`;
  if (p.status === "done" && found.leadsWanted !== null) {
    return found.leadCount >= found.leadsWanted
      ? `Found ${plural(found.leadCount, "lead", "leads")} that fit, as wanted, with ${searched}.`
      : `Found ${found.leadCount} of the ${found.leadsWanted} leads wanted with ${searched}: this idea ran out of good fits in these places.`;
  }
  if (p.status === "done") return `The search covered every place in this campaign: ${searched}, ${plural(p.listings, "listing", "listings")}.`;
  return `${searched} and ${plural(p.listings, "listing", "listings")} before it ended.`;
}
