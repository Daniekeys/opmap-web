// Mirrors opmap-api/src/modules/leads/contracts.ts
// (rows as they arrive over JSON: timestamps are ISO strings)
import type { PipelineRun } from "./pipeline";

export type TargetKind = "local_business" | "b2b" | "institution";
export type CampaignStatus = "draft" | "running" | "paused" | "stopped" | "done" | "failed";
// region: a first-level division nobody seeded (Greater Accra Region,
// England), searched as one area; a seeded state runs its towns.
export type AreaLevel = "country" | "state" | "region" | "city" | "neighbourhood";

// A place from geo_areas, with the place above it ("Ilorin", "Kwara").
export type GeoArea = {
  id: string;
  name: string;
  level: AreaLevel;
  parentName: string | null;
  country: string;
  population: number | null;
};

// GET /api/w/:workspaceId/geo-areas?q= (or ?ids=a,b for exact places)
export type GeoAreasResponse = { areas: GeoArea[] };

// POST /api/w/:workspaceId/geo-areas/lookup { query }: look a place up on
// Google Maps (one geocode, in the worker). Then GET .../lookup/:runId until
// it is done: `area` is the place found and saved, or `problem` says why
// it can't be used (not_found, whole_country, not_an_area, unknown_country;
// "failed" when the lookup didn't run).
export type PlaceLookupStarted = { runId: string };
export type PlaceLookupResponse = {
  status: "running" | "done" | "failed";
  area: GeoArea | null;
  problem: { code: string; message: string } | null;
};

// GET /api/w/:workspaceId/campaigns/suggested-places: the default places for a
// new campaign from the approved Brand DNA. from: the location fact the first
// place came from. unmatched: location facts that name no known place.
export type SuggestedPlacesResponse = { areas: GeoArea[]; from: string | null; unmatched: string[] };

// POST /api/w/:workspaceId/campaigns/route-target
export type RouteTargetBody = { segment: string; queries?: string[] };
export type RouteTargetResponse = { kind: TargetKind; reason: string; promptVersion: string };

// Buyer segments (Phase 2.5). "has": buyers with one are likelier to pay;
// "lacks": the offer is to give them one; "any": no signal.
export type Presence = "has" | "lacks" | "any";

export type BuyerSignals = {
  minReviews: number | null;
  minRating: number | null;
  website: Presence;
  socials: Presence;
  categories: string[];
};

// Words in business names: ones that say it is this kind of business, and
// ones for other kinds that rule a name out.
export type NameWords = { thisKind: string[]; otherKinds: string[] };

export type BuyerSegment = {
  rank: number;
  name: string;
  whoTheyAre: string;
  searchTerms: string[];
  whyTheyBuy: string;
  pain: string;
  pitchFirst: string;
  pitchFacts: { id: string; text: string }[];
  buyerSignals: BuyerSignals;
  // What to look for that Google Maps can't check ("recently funded").
  signalNotes: string[];
  // Null for older sets, or when the words couldn't be made.
  nameWords: NameWords | null;
  suggestedPlaces: { name: string; areaId: string | null }[];
  reachability: "places" | "not_yet";
  reachabilityReason: string;
  rankReason: string;
};

// A Brand DNA version a campaign may be made with or switched to.
export type CampaignBrandVersion = { version: number; current: boolean; source: "website" | "description"; website: string | null; approvedAt: string | null };

// GET /api/w/:workspaceId/buyer-segments[?version=N]; POST starts the run for
// the approved version (202). not_suggested: an earlier version with no
// segments (none are made for it). versions: what a new campaign may use.
export type SegmentsResponse = {
  state: "not_approved" | "none" | "running" | "failed" | "ready" | "not_suggested";
  brandProfileVersion: number | null;
  run: PipelineRun | null;
  error: string | null;
  setId: string | null;
  segments: BuyerSegment[];
  versions: CampaignBrandVersion[];
};

// POST .../campaigns/:campaignId/brand-version (owner): logged as an event.
export type SwitchBrandVersionBody = { version: number };
export type SwitchBrandVersionResponse = { from: number | null; to: number };
export type StartSegmentsBody = { retry?: boolean };

// The segment a campaign is created from: a suggestion, maybe edited (setId
// and rank), or the user's own (both null). 1 to 3 search terms.
export type CampaignSegment = {
  setId: string | null;
  rank: number | null;
  name: string;
  searchTerms: string[];
  whyTheyBuy: string;
  pain: string;
  pitchFirst: string;
  buyerSignals: BuyerSignals;
};

// POST /api/w/:workspaceId/campaigns, 201: a draft. With a buyerSegment, its
// name and search terms replace segment and queries.
export type CreateCampaignBody = {
  segment: string;
  queries?: string[];
  targetKind: TargetKind;
  locations: string[];
  suggested?: { kind: TargetKind; promptVersion: string };
  buyerSegment?: CampaignSegment;
  // 20 to 30; the API starts a campaign at 20 without it.
  leadsWanted?: number;
  // Any approved Brand DNA version; the current one when left out.
  brandProfileVersion?: number;
};

export type Campaign = {
  id: string;
  name: string;
  segment: string;
  queries: string[];
  targetKind: TargetKind | null;
  // The segment as the user kept it, and whether they changed it.
  buyerSegment: (CampaignSegment & { edited: boolean }) | null;
  // The words the fit check classifies business names with. Read-only; null
  // until made (from the segment, or before the first fit check).
  nameWords: NameWords | null;
  brandProfileVersion: number | null;
  locations: GeoArea[];
  status: CampaignStatus;
  // Set while paused: when the search starts again, and why it stopped. A
  // stopped campaign keeps why it stopped here too.
  resumeAt: string | null;
  pauseReason: string | null;
  // Set while paused: what paused it ("setup": Google was off, no reset time).
  pauseKind: PauseKind | null;
  settings: SearchSettings;
  // Google searches the campaign has made so far.
  callsUsed: number;
  leadCount: number;
  createdAt: string;
  // When its search was first started; null for a draft.
  startedAt: string | null;
};

// Why a campaign is paused: Google was off on the server ("setup", no reset
// time), or a Google cap that resets at resumeAt.
export type PauseKind = "setup" | "campaign_daily" | "daily_cap" | "monthly_cap" | "google_quota";

// A campaign's search settings: the most Google searches it may use (null: no
// budget), pages per map tile (1 to 3), neighbourhood searches per city (0 to
// 3), its own searches a day (null: the shared cap alone, which always holds),
// and the leads wanted before the search ends as done (20 to 30; null on
// campaigns made before it, which search everything).
export type SearchSettings = { maxCalls: number | null; pagesPerTile: number; extrasPerCity: number; dailyCalls: number | null; leadsWanted: number | null };

// PATCH .../campaigns/:campaignId (owner): search terms, places and search
// settings, while it is a draft, paused, stopped or failed. A field left out
// is kept; null lifts a limit. Answers CampaignResponse. POST .../stop (owner)
// does too.
export type EditCampaignBody = Partial<SearchSettings> & { queries?: string[]; locations?: string[] };

export type CampaignResponse = { campaign: Campaign };

// GET /api/w/:workspaceId/campaigns, newest first.
export type CampaignsResponse = { campaigns: Campaign[] };

// GET .../campaigns/:campaignId
// fewResults: the search finished with fewer than 3 businesses across all its
// tiles: the page says Google Maps has little data for this area.
export type CampaignDetailResponse = { campaign: Campaign; possibleCount: number; fewResults: boolean };

type Range = { min: number; max: number };

// GET .../campaigns/:campaignId/estimate, optionally with settings to preview
// (?maxCalls=100&pagesPerTile=2&leadsWanted=25; maxCalls=none or
// dailyCalls=none for no limit). The calls are for covering every area; with
// leads wanted the search usually ends after a few, so they are the most it
// could use, and `warning` stays null.
export type EstimateResponse = {
  areas: { name: string; tiles: number; queries: number; freshPairs: number; extras: number }[];
  tileSearches: number;
  pagesPerTile: Range;
  // What the whole search needs; calls is this, cut at the budget left.
  needed: Range;
  budgetCut: boolean;
  calls: Range;
  costUsd: Range;
  // Days at perDay searches a day: the campaign's own pace, at most the cap.
  daysAtDailyCap: Range;
  perDay: number;
  // Google searches a day the shared caps allow (50 in production).
  dailyCap: number;
  // The settings this estimate is for (saved, or previewed).
  settings: SearchSettings;
  callsUsed: number;
  // Google searches left under the shared caps (all workspaces).
  callsLeft: { today: number; month: number };
  unmapped: string[];
  // Countries among its places where Google Maps has little data.
  thinMaps: string[];
  warning: string | null;
  // The campaign's places past 40 tiles, and the places under each (London's
  // boroughs) to start with instead.
  largeAreas: LargeArea[];
  // Set when even one page a tile needs more Google searches than this month
  // has left: the confirm button refuses with this message.
  overMonth: string | null;
  notes: string[];
};

export type LargeArea = { areaId: string; name: string; tiles: number; smaller: { id: string; name: string }[] };

// GET .../campaigns/:campaignId/progress: the search's steps (from
// step_runs), what it has cost, and which limit paused it. A failed step's
// message is set only when it was written for the user; `next` says whether
// it is being retried, was skipped while the search carried on, or stopped it.
export type ProgressStepKey = "map" | "search" | "dedupe" | "fit" | "contacts";
export type ProgressStepState = "done" | "running" | "waiting" | "failed" | "skipped";
export type ProgressStep = {
  key: ProgressStepKey;
  state: ProgressStepState;
  problem: { message: string | null; next: "retrying" | "skipped" | "stopped"; attempt: number; attempts: number } | null;
};
// What a paused search waits for, the same answer Resume search acts on:
// google_off, this server can't call Google; google_back, it paused because
// Google was off and now it is on; a cap until its reset; other, a cap pause
// from before pause kinds were stored.
export type PauseLimit = "google_off" | "google_back" | "campaign_daily" | "daily_cap" | "monthly_cap" | "google_quota" | "other";
export type CampaignProgressResponse = {
  status: CampaignStatus;
  steps: ProgressStep[];
  // Businesses the searches kept so far, before duplicates are removed.
  listings: number;
  // Places mapped and tiles planned for the current search.
  areas: number;
  tiles: number;
  // The search term of the newest search step.
  query: string | null;
  cost: {
    // Claude credit spent by every run of this campaign (search, research, drafts).
    claudeUsd: number;
    // This campaign's Google searches and budget, and the shared caps (from
    // the API's config) with what all workspaces used today and this month.
    searches: { campaign: number; budget: number | null; today: number; dailyCap: number; month: number; monthlyCap: number };
  };
  // Set while paused; autoResume is false (an owner resumes, in every
  // environment). resumeAt: a cap's reset (never moved by a refused Resume);
  // lifted: it has passed; canResume: Resume search would start it now.
  pause: { limit: PauseLimit; resumeAt: string | null; lifted: boolean; canResume: boolean; reason: string | null; autoResume: boolean } | null;
};

// POST .../campaigns/:campaignId/start (owner), 202.
export type StartCampaignResponse = { campaign: Campaign; runId: string };

export type BuyerReason = { key: "fit" | "reviews" | "rating" | "website" | "socials"; text: string; good: boolean };

export type ContactSource = { type: string; url: string };
export type Contact = { value: string; label: string; sources: ContactSource[] };
export type SocialContact = Contact & { kind: string };

// GET .../campaigns/:campaignId/leads: those that can be messaged now first,
// then best fit first.
export type Lead = {
  leadId: string;
  businessId: string;
  name: string;
  category: string | null;
  city: string | null;
  rating: number | null;
  reviewCount: number | null;
  fit: { score: number | null; verdict: string | null; reason: string | null };
  // How likely to buy (0 to 1), from checkable facts against the campaign's
  // buyer signals, with its top reason in plain words. Null until ranked.
  buyer: { score: number; topReason: string; reasons: BuyerReason[] } | null;
  promoted: boolean;
  // The deep-dive has run: opening the lead costs nothing.
  researched: boolean;
  // Channels it can be messaged on now: WhatsApp or email with a checked
  // contact point; none when the business asked not to be contacted.
  // Confirmed and likely WhatsApp apart; confirmed sorts first.
  ready: ("whatsapp_confirmed" | "whatsapp_likely" | "email")[];
  // Asked not to be contacted (an opt-out, or on the suppression list).
  optedOut: boolean;
  contacts: {
    phone: Contact | null;
    whatsapp: Contact | null;
    email: Contact | null;
    website: Contact | null;
    person: Contact | null;
    socials: SocialContact[];
  };
};
export type LeadsResponse = { leads: Lead[] };

// GET .../campaigns/:campaignId/possibles
export type Possible = {
  businessId: string;
  name: string;
  category: string | null;
  city: string | null;
  rating: number | null;
  reviewCount: number | null;
  reason: string;
};
export type PossiblesResponse = { possibles: Possible[] };

// POST .../campaigns/:campaignId/possibles/:businessId/promote, 201
export type PromoteResponse = { leadId: string; enrichmentRunId: string };
