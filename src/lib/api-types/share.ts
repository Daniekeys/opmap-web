// Copied from opmap-api/src/modules/outreach/contracts.ts (sharing a campaign).

export type Share = {
  id: string;
  link: string;
  allowDownloads: boolean;
  createdAt: string;
  revokedAt: string | null;
  viewCount: number;
  lastViewedAt: string | null;
};

// GET .../campaigns/:campaignId/share (owner); POST, PATCH and DELETE answer the same.
export type ShareStatusResponse = {
  share: Share | null;
  leads: number;
  withMessages: number;
  optedOut: number;
  toPrepare: number;
  prepareCostUsd: { typical: number; max: number };
};

// POST .../campaigns/:campaignId/share/prepare (owner).
export type PrepareShareResponse = { started: number; running: number; done: number; limit: string | null };

// GET .../shares (owner).
export type SharesResponse = { shares: (Share & { campaignId: string; campaignName: string })[] };

export type SharedLead = {
  name: string;
  category: string | null;
  city: string | null;
  rating: number | null;
  reviewCount: number | null;
  fit: { score: number | null; verdict: string | null; reason: string | null };
  buyer: string | null;
  stage: string;
  contacts: {
    phone: string | null;
    whatsapp: string | null;
    email: string | null;
    website: string | null;
    person: string | null;
    socials: { kind: string; value: string }[];
  };
  targets: { whatsapp: string | null; email: string | null; call: string | null };
  opportunities: { offer: string | null; gap: string | null; why: string[]; angle: string | null; confidence: string | null; general: boolean; sources: string[] }[];
  messages: { channel: string; subject: string | null; body: string }[];
  notes: string[];
  outcomes: { type: string; channel: string | null; note: string | null; at: string }[];
};

// GET /api/share/:token (no account).
export type SharedCampaignResponse = {
  sharedBy: string;
  campaign: { name: string; segment: string; places: string[]; createdAt: string };
  sharedAt: string;
  allowDownloads: boolean;
  leads: SharedLead[];
};
