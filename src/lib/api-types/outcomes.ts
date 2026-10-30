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

export type PipelineLead = {
  leadId: string;
  name: string;
  city: string | null;
  category: string | null;
  stage: Stage;
  lastOutcome: { type: string; channel: string | null; createdAt: string } | null;
};

// GET /api/w/:workspaceId/campaigns/:campaignId/pipeline
export type PipelineResponse = {
  campaignId: string;
  stages: { stage: Stage; count: number; leads: PipelineLead[] }[];
};
