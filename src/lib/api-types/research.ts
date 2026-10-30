// Mirrors opmap-api/src/modules/research/contracts.ts
// (rows as they arrive over JSON: timestamps are ISO strings)

// One piece of evidence behind a claim: a quote from one of the lead's
// sources, a signal our code checked, or one of the seller's approved facts.
export type Cite =
  | { kind: "source"; ref: string; sourceId: string; url: string; sourceType: string; quote: string }
  | { kind: "signal"; ref: string; signalKind: string; text: string; sourceId: string; url: string }
  | { kind: "fact"; ref: string; factId: string; text: string; url: string | null };

// On the lead's cards, a quote or signal also says when its page was read:
// null when the page has been read again since this result.
export type DatedCite = Exclude<Cite, { kind: "fact" }> & { fetchedAt: string | null } | Extract<Cite, { kind: "fact" }>;

export type ClaimField = "offer" | "gap" | "why" | "angle";

export type Claim = { id: string; field: ClaimField; text: string; cites: DatedCite[] };

export type OpportunityCard = {
  id: string;
  rank: number;
  confidence: string;
  confidenceReason: string | null;
  offer: Claim | null;
  gap: Claim | null;
  why: Claim[];
  angle: Claim | null;
};

export type RemovedClaim = { card: number; field: ClaimField; text: string; reason: string; by: "code" | "check" };

type ContactValue = { value: string; label: string } | null;

// GET /api/w/:workspaceId/campaigns/:campaignId/leads/:leadId
export type LeadResearchResponse = {
  lead: {
    leadId: string;
    businessId: string;
    name: string;
    category: string | null;
    city: string | null;
    rating: number | null;
    reviewCount: number | null;
    phone: ContactValue;
    whatsapp: ContactValue;
    website: ContactValue;
  };
  run: {
    deepDiveId: string;
    status: "running" | "done" | "failed";
    runId: string | null;
    startedAt: string;
    finishedAt: string | null;
    error: string | null;
    errorCode: string | null;
  } | null;
  result: {
    deepDiveId: string;
    finishedAt: string | null;
    stale: boolean;
    costUsd: number;
    durationMs: number | null;
    notEnough: string | null;
    removed: RemovedClaim[];
    read: { pages: number; socials: number; sources: number } | null;
    cards: OpportunityCard[];
  } | null;
  signals: { kind: string; label: string; text: string; sourceUrl: string; sourceType: string }[];
};

// POST /api/w/:workspaceId/campaigns/:campaignId/leads/:leadId/deep-dive
export type OpenLeadBody = { refresh?: boolean };

export type OpenLeadResponse =
  | { state: "started"; runId: string }
  | { state: "running"; runId: string | null }
  | { state: "done" }
  | { state: "fresh" }
  | { state: "limit"; reason: string };
