// Mirrors opmap-api/src/modules/leads/contracts.ts
// (rows as they arrive over JSON: timestamps are ISO strings)
import type { PipelineRun } from "./pipeline";

export type TargetKind = "local_business" | "b2b" | "institution";
export type CampaignStatus = "draft" | "running" | "paused" | "done" | "failed";
export type AreaLevel = "country" | "state" | "city" | "neighbourhood";

// A place from geo_areas, with the place above it ("Ilorin", "Kwara").
export type GeoArea = {
  id: string;
  name: string;
  level: AreaLevel;
  parentName: string | null;
  country: string;
  population: number | null;
};

// GET /api/w/:workspaceId/geo-areas?q=
export type GeoAreasResponse = { areas: GeoArea[] };

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

// GET /api/w/:workspaceId/buyer-segments; POST starts the run (202).
export type SegmentsResponse = {
  state: "not_approved" | "none" | "running" | "failed" | "ready";
  brandProfileVersion: number | null;
  run: PipelineRun | null;
  error: string | null;
  setId: string | null;
  segments: BuyerSegment[];
};
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
  // Set while paused: when the search starts again, and why it stopped.
  resumeAt: string | null;
  pauseReason: string | null;
  leadCount: number;
  createdAt: string;
};

export type CampaignResponse = { campaign: Campaign };

// GET /api/w/:workspaceId/campaigns, newest first.
export type CampaignsResponse = { campaigns: Campaign[] };

// GET .../campaigns/:campaignId
export type CampaignDetailResponse = { campaign: Campaign; possibleCount: number };

type Range = { min: number; max: number };

// GET .../campaigns/:campaignId/estimate
export type EstimateResponse = {
  areas: { name: string; tiles: number; queries: number; freshPairs: number; extras: number }[];
  tileSearches: number;
  pagesPerTile: Range;
  calls: Range;
  costUsd: Range;
  daysAtDailyCap: Range;
  // Google searches a day the caps allow (30 in production).
  dailyCap: number;
  // Google searches left under the shared caps (all workspaces).
  callsLeft: { today: number; month: number };
  unmapped: string[];
  warning: string | null;
  notes: string[];
};

// POST .../campaigns/:campaignId/start (owner), 202.
export type StartCampaignResponse = { campaign: Campaign; runId: string };

export type BuyerReason = { key: "fit" | "reviews" | "rating" | "website" | "socials"; text: string; good: boolean };

export type ContactSource = { type: string; url: string };
export type Contact = { value: string; label: string; sources: ContactSource[] };
export type SocialContact = Contact & { kind: string };

// GET .../campaigns/:campaignId/leads, best fit first.
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
