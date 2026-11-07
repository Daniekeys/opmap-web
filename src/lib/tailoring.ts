// Tailored or General (2026-11-07): how specific a lead's messages are.
// Tailored: they rest on a specific, sourced gap from an evidence-backed card.
// General: they come from the general offer card or the fallback rewrite.
import type { Channel } from "./api-types/outreach";
import { whatsappHref } from "./leads";
import { whatsappSendHref } from "./outreach";

export type Tailoring = "tailored" | "general";
export type TailoringFilter = "all" | Tailoring;

export const TAILORING: Record<Tailoring, { word: string; title: string }> = {
  tailored: { word: "Tailored", title: "Messages rest on a specific, sourced gap from this business's own pages or listing." },
  general: { word: "General", title: "No specific gap was found or kept: messages use the business's basics and your general offer." },
};

export function tailoringCounts(leads: { tailoring: Tailoring | null }[]) {
  return {
    tailored: leads.filter((l) => l.tailoring === "tailored").length,
    general: leads.filter((l) => l.tailoring === "general").length,
  };
}

// "12 Tailored, 8 General", or null before any lead has messages.
export function tailoringSummary(c: { tailored: number; general: number }) {
  return c.tailored + c.general === 0 ? null : `${c.tailored} Tailored, ${c.general} General`;
}

export const matchesTailoring = (lead: { tailoring: Tailoring | null }, filter: TailoringFilter) => filter === "all" || lead.tailoring === filter;

const MISSING: Record<Channel, string> = { linkedin: "LinkedIn page", email: "email", whatsapp: "WhatsApp", call: "phone number" };

// A channel with nowhere to send still shows its draft, to copy and paste.
export const copyPasteChip = (channel: Channel) => `Copy and paste, no ${MISSING[channel]} found`;

// "Chat on WhatsApp": the WhatsApp draft prefilled when there is one.
export const whatsappChatHref = (value: string, draft: string | null) => (draft ? whatsappSendHref(value, draft) : whatsappHref(value));
