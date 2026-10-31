// Mirrors opmap-api/src/modules/outreach/contracts.ts
// (rows as they arrive over JSON: timestamps are ISO strings)
import type { Outcome, Stage } from "./outcomes";
import type { Cite } from "./research";

export type Channel = "whatsapp" | "email" | "linkedin" | "call";

export type DraftLine = {
  kind: "greeting" | "intro" | "claim" | "ask" | "signoff" | "optout";
  text: string;
  cites: Cite[];
  span: string | null;
};

export type RemovedSentence = { channel: Channel; text: string; reason: string; by: "code" | "check" };

export type Draft = {
  id: string;
  channel: Channel;
  status: "ready" | "not_ready";
  subject: string | null;
  body: string;
  lines: DraftLine[];
  removed: RemovedSentence[];
};

export type Target = { kind: "whatsapp" | "email" | "phone" | "linkedin"; value: string; label: string; confidence: number };

export type ContactRow = { kind: "phone" | "whatsapp" | "email" | "person"; value: string; label: string; confidence: number };

export type Blocked = "not_enough_information" | "no_cards" | "no_target" | "brand_not_usable" | "suppressed";

// GET /api/w/:workspaceId/campaigns/:campaignId/leads/:leadId/outreach
export type LeadOutreachResponse = {
  stage: Stage;
  suppressed: boolean;
  blocked: Blocked | null;
  // optOut: the line every email draft ends with, for this country.
  country: { code: string; law: string; optOut: string; emailNote: string | null };
  // Who drafts sign as, or null when Brand DNA isn't usable.
  sender: { name: string } | null;
  targets: Record<Channel, Target | null>;
  contacts: ContactRow[];
  cards: {
    opportunityId: string;
    run: {
      draftSetId: string;
      status: "running" | "done" | "failed";
      runId: string | null;
      error: string | null;
      costUsd: number;
      durationMs: number | null;
    } | null;
    drafts: Draft[];
  }[];
  outcomes: Outcome[];
};

// POST .../leads/:leadId/drafts  { opportunityId }
export type StartDraftsResponse =
  | { state: "started"; runId: string }
  | { state: "running"; runId: string | null }
  | { state: "done" }
  | { state: "limit"; reason: string }
  | { state: "blocked"; reason: string };

// POST .../leads/:leadId/drafts/:draftId/send  { via }
export type SendVia = "copy" | "whatsapp" | "gmail" | "outlook" | "linkedin" | "call";

export type SendResponse = { stage: Stage; outcome: Outcome | null };
