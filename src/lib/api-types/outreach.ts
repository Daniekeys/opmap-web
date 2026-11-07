// Mirrors opmap-api/src/modules/outreach/contracts.ts
// (rows as they arrive over JSON: timestamps are ISO strings)
import type { Outcome, Stage } from "./outcomes";
import type { Cite } from "./research";

export type Channel = "whatsapp" | "email" | "linkedin" | "call";

// A draft line's cite. A source's quote is the card's words this line rests
// on, or null when no one card claim's quote can be told apart.
export type DraftCite = Exclude<Cite, { kind: "source" }> | (Omit<Extract<Cite, { kind: "source" }>, "quote"> & { quote: string | null });

export type DraftLine = {
  kind: "greeting" | "intro" | "claim" | "ask" | "signoff" | "optout";
  text: string;
  cites: DraftCite[];
  span: string | null;
};

export type RemovedSentence = { channel: Channel; text: string; reason: string; by: "code" | "check" };

export type Draft = {
  id: string;
  channel: Channel;
  status: "ready" | "not_ready";
  // False when what it offers isn't in the approved Brand DNA any more: shown
  // as not ready, never sent.
  offerInBrandDna: boolean;
  // Cites another business's pages (or its card does): empty, never sent.
  mismatch: boolean;
  subject: string | null;
  body: string;
  lines: DraftLine[];
  removed: RemovedSentence[];
  // The fallback rewrite filled its fact about the business or its offer:
  // what the checks removed is still in `removed`.
  fallback: boolean;
};

// Tailored: the drafts rest on a specific, sourced gap from an evidence-backed
// card. General: the general offer card or the fallback rewrite.
export type Tailoring = "tailored" | "general";

export type Target = { kind: "whatsapp" | "email" | "phone" | "linkedin"; value: string; label: string; confidence: number };

export type ContactRow = { kind: "phone" | "whatsapp" | "email" | "person"; value: string; label: string; confidence: number };

export type Blocked = "not_enough_information" | "no_cards" | "no_target" | "brand_not_usable" | "suppressed";

// GET /api/w/:workspaceId/campaigns/:campaignId/leads/:leadId/outreach
// What a channel tab shows: a chip always, and the reason when the channel
// has no send target. A suppressed business has code "suppressed" everywhere.
export type ChannelStatus = { available: boolean; code: string; chip: string; reason: string | null };

// A UK lead's legal form. consentNeeded: only the call opener may be used.
// registry: what Companies House said (null until looked up), and how it was
// matched. confirmed: a member's own check, which wins.
export type LegalFormView = {
  consentNeeded: boolean;
  registry: {
    form: "company" | "partnership" | "unknown";
    method: "site_number" | "name_postcode" | null;
    company: { number: string; name: string; type: string; status: string; postcode: string | null } | null;
  } | null;
  checkedAt: string | null;
  confirmed: { form: "company" | "sole_trader"; note: string | null; by: string; at: string } | null;
};

export type LeadOutreachResponse = {
  stage: Stage;
  suppressed: boolean;
  blocked: Blocked | null;
  // The top card's newest drafts: Tailored or General; null with none.
  tailoring: Tailoring | null;
  // optOut: the line every email draft ends with, for this country.
  // name: the country in words. draftNote: shown on every draft when no rules
  // are on file for the country. channelOrder: the draft tab order, from the
  // lead's country profile (drafts arrive in this order).
  // callNote: shown on the call tab (the UK: check TPS/CTPS), or null.
  country: { code: string; name: string; law: string; optOut: string; emailNote: string | null; draftNote: string | null; channelOrder: Channel[]; callNote: string | null };
  // Only where the country's rule goes by legal form (the UK), else null.
  legalForm: LegalFormView | null;
  // Who drafts sign as, or null when Brand DNA isn't usable.
  sender: { name: string } | null;
  targets: Record<Channel, Target | null>;
  channels: Record<Channel, ChannelStatus>;
  contacts: ContactRow[];
  cards: {
    opportunityId: string;
    // False when the card's offer isn't a fact of the campaign's Brand DNA
    // version that the approved version still holds: no drafts can be written
    // for it, and offerNote says why ("This offer is no longer in your
    // approved Brand DNA." or "This offer isn't in the Brand DNA this
    // campaign uses.").
    offerInBrandDna: boolean;
    offerNote: string | null;
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
  | { state: "blocked"; reason: string }
  // The card's offer isn't in the approved Brand DNA any more: nothing was
  // written and nothing was spent.
  | { state: "offer_not_in_brand_dna" };

// POST .../leads/:leadId/drafts/:draftId/send  { via }
export type SendVia = "copy" | "whatsapp" | "gmail" | "outlook" | "linkedin" | "call";

export type SendResponse = { stage: Stage; outcome: Outcome | null };

// GET /api/w/:workspaceId/messages: every campaign's leads waiting on the
// user. "reply": the lead's newest outcome is a reply. "draft": a ready
// draft on a channel the lead can be sent to, nothing sent yet. Replies
// first; at most 50 rows, but the counts cover all.
export type MessageRow = {
  kind: "reply" | "draft";
  leadId: string;
  campaignId: string;
  businessId: string;
  name: string;
  offer: string | null;
  tailoring: Tailoring | null;
  note: string | null;
  at: string;
};

export type MessagesResponse = {
  toSend: number;
  newReplies: number;
  newRepliesByCampaign: { campaignId: string; count: number }[];
  queue: MessageRow[];
};
