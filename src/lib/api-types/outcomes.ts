// Mirrors opmap-api/src/modules/outcomes/contracts.ts
// (rows as they arrive over JSON: timestamps are ISO strings)

export const STAGES = ["new", "sent", "replied", "meeting", "won", "lost"] as const;
export type Stage = (typeof STAGES)[number];

export type StageOutcome = "sent" | "replied" | "meeting" | "won" | "lost";
export type FeedbackOutcome = "wrong_number" | "bounced" | "not_owner";

// POST /api/w/:workspaceId/campaigns/:campaignId/leads/:leadId/outcomes
export type OutcomeBody =
  | { type: StageOutcome; channel?: "whatsapp" | "email" | "linkedin" | "call"; note?: string }
  | { type: FeedbackOutcome; contactKind: "phone" | "whatsapp" | "email" | "person"; contactValue: string; note?: string }
  | { type: "opted_out"; note?: string };

export type Outcome = {
  id: string;
  type: string;
  channel: string | null;
  note: string | null;
  contactKind: string | null;
  contactValue: string | null;
  createdAt: string;
};

export type OutcomeResponse = { stage: Stage; outcome: Outcome };

// offer: the service of the card the lead's newest messages were written
// from, or null. optedOut: the lead ever asked not to be contacted.
export type PipelineLead = {
  leadId: string;
  businessId: string;
  name: string;
  city: string | null;
  category: string | null;
  stage: Stage;
  offer: string | null;
  optedOut: boolean;
  lastOutcome: { type: string; channel: string | null; note: string | null; createdAt: string } | null;
};

// Distinct leads that ever had each outcome or a later one (messaged: any
// Sent), from outcome history; the stages are each lead's current stage.
export type PipelineFunnel = { messaged: number; replied: number; meeting: number; won: number };

// GET /api/w/:workspaceId/campaigns/:campaignId/pipeline
export type PipelineResponse = {
  campaignId: string;
  funnel: PipelineFunnel;
  stages: { stage: Stage; count: number; leads: PipelineLead[] }[];
};
