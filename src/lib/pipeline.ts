// Words for the pipeline (Pipeline.dc.html): each card's "when" line and the
// page's one finding sentence.
import type { PipelineFunnel, PipelineLead, PipelineResponse, Stage } from "./api-types/outcomes";
import { dayKey, formatDay } from "./format";
import { outcomeName, STAGE_NAMES } from "./outreach";

// The board's columns: contacted leads only. New ones stay on the campaign list.
export const BOARD_STAGES = ["sent", "replied", "meeting", "won", "lost"] as const satisfies readonly Stage[];

export const COLUMN_NAMES: Record<(typeof BOARD_STAGES)[number], string> = {
  sent: "Sent, waiting",
  replied: "Replied",
  meeting: "Meeting booked",
  won: "Won",
  lost: "Lost",
};

// "today", "yesterday" or "28 Oct", in the workspace's time zone.
export function dayText(iso: string, timeZone: string, now = new Date()) {
  const key = dayKey(new Date(iso), timeZone);
  if (key === dayKey(now, timeZone)) return "today";
  if (key === dayKey(new Date(now.getTime() - 86_400_000), timeZone)) return "yesterday";
  return formatDay(iso, timeZone);
}

const SENT_ON: Record<string, string> = { whatsapp: "WhatsApp", email: "email", linkedin: "LinkedIn" };

export type When = { text: string; tone: "muted" | "accent" | "positive" };

// A card's last line: an opt-out always reads "Asked us to stop"; otherwise
// the last outcome's note, or what it was and when ("Sent today, WhatsApp").
export function whenLine(lead: PipelineLead, timeZone: string, now = new Date()): When {
  if (lead.optedOut) return { text: "Asked us to stop", tone: "muted" };
  const tone = lead.stage === "replied" ? "accent" : lead.stage === "won" ? "positive" : "muted";
  const last = lead.lastOutcome;
  if (!last) return { text: STAGE_NAMES[lead.stage], tone };
  if (last.note) return { text: last.note, tone };
  const day = dayText(last.createdAt, timeZone, now);
  if (last.type === "sent" && last.channel === "call") return { text: `Called ${day}`, tone };
  if (last.type === "sent") return { text: last.channel && SENT_ON[last.channel] ? `Sent ${day}, ${SENT_ON[last.channel]}` : `Sent ${day}`, tone };
  return { text: `${outcomeName(last.type)} ${day}`, tone };
}

// The lead to answer first: the newest at Replied (the API sorts by news).
export const replyFirst = (stages: PipelineResponse["stages"]) => stages.find((s) => s.stage === "replied")?.leads.find((l) => !l.optedOut) ?? null;

// "2 of 9 replied. Adewole Cake Studio replied today."
export function pipelineFinding(funnel: PipelineFunnel, stages: PipelineResponse["stages"], timeZone: string, now = new Date()) {
  if (funnel.messaged === 0) return "No one has been messaged yet.";
  const counts = `${funnel.replied} of ${funnel.messaged} replied.`;
  const first = replyFirst(stages);
  if (!first || first.lastOutcome?.type !== "replied") return counts;
  return `${counts} ${first.name} replied ${dayText(first.lastOutcome.createdAt, timeZone, now)}.`;
}

// The leads counted as contacted (the Contacted tab, "haven't been contacted
// yet"): those with any stage outcome, the same rule as the Messaged count.
// A lead that asked us to stop before anything was sent is Lost but not
// contacted.
export function contactedLeads(pipeline: Pick<PipelineResponse, "stages">) {
  return new Set(pipeline.stages.flatMap((s) => s.leads).filter((l) => l.messaged).map((l) => l.leadId));
}
