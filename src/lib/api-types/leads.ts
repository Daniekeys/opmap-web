// Mirrors opmap-api/src/modules/leads/contracts.ts
// (rows as they arrive over JSON: timestamps are ISO strings)

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

// POST /api/w/:workspaceId/campaigns, 201: a draft.
export type CreateCampaignBody = {
  segment: string;
  queries?: string[];
  targetKind: TargetKind;
  locations: string[];
  suggested?: { kind: TargetKind; promptVersion: string };
};

export type Campaign = {
  id: string;
  name: string;
  segment: string;
  queries: string[];
  targetKind: TargetKind | null;
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
