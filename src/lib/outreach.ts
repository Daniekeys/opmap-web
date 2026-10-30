// Send links and plain words for drafts and outcomes (spec, Core pipelines > 4).
import type { Stage } from "./api-types/outcomes";
import type { Channel } from "./api-types/outreach";

const enc = encodeURIComponent;

// WhatsApp with the draft filled in. A WhatsApp value that is already a link
// with no number (wa.me/message/...) can't take text: it opens as it is.
export function whatsappSendHref(value: string, text: string) {
  if (/^https?:/.test(value)) return value;
  return `https://wa.me/${value.replace(/\D/g, "")}?text=${enc(text)}`;
}

// Gmail's compose window, in the browser or the app.
export const gmailHref = (to: string, subject: string, body: string) =>
  `https://mail.google.com/mail/?view=cm&fs=1&to=${enc(to)}&su=${enc(subject)}&body=${enc(body)}`;

// Outlook on the web (Outlook.com and Hotmail accounts).
export const outlookHref = (to: string, subject: string, body: string) =>
  `https://outlook.live.com/mail/0/deeplink/compose?to=${enc(to)}&subject=${enc(subject)}&body=${enc(body)}`;

export const CHANNEL_NAMES: Record<Channel, string> = { whatsapp: "WhatsApp", email: "Email", linkedin: "LinkedIn DM", call: "Call opener" };

export const STAGE_NAMES: Record<Stage, string> = { new: "New", sent: "Sent", replied: "Replied", meeting: "Meeting", won: "Won", lost: "Lost" };

export const STAGE_TONES: Record<Stage, string> = {
  new: "bg-muted text-foreground",
  sent: "bg-sky-100 text-sky-900",
  replied: "bg-violet-100 text-violet-900",
  meeting: "bg-amber-100 text-amber-950",
  won: "bg-emerald-100 text-emerald-900",
  lost: "bg-zinc-200 text-zinc-800",
};

const OUTCOME_NAMES: Record<string, string> = {
  sent: "Sent",
  replied: "Replied",
  meeting: "Meeting booked",
  won: "Won",
  lost: "Lost",
  wrong_number: "Wrong number",
  bounced: "Bounced",
  not_owner: "Not the owner",
  opted_out: "Asked not to be contacted",
};

export const outcomeName = (type: string) => OUTCOME_NAMES[type] ?? type.replaceAll("_", " ");

// "Sent on WhatsApp", "Wrong number: 0803 000 1111".
export function outcomeText(o: { type: string; channel: string | null; contactValue?: string | null }, formatValue: (v: string) => string = (v) => v) {
  const name = outcomeName(o.type);
  if (o.contactValue) return `${name}: ${formatValue(o.contactValue)}`;
  if (o.channel) return `${name} · ${CHANNEL_NAMES[o.channel as Channel] ?? o.channel}`;
  return name;
}
