// Send links and plain words for drafts and outcomes (spec, Core pipelines > 4).
import type { Outcome, Stage } from "./api-types/outcomes";
import type { Channel, Draft } from "./api-types/outreach";
import type { OpportunityCard } from "./api-types/research";
import { citeName, citeReadAt } from "./campaign-view";

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
  new: "bg-neutral-soft text-neutral-ink",
  sent: "bg-neutral-soft text-neutral-ink",
  replied: "bg-positive-soft text-positive-ink",
  meeting: "bg-positive-soft text-positive-ink",
  won: "bg-positive-soft text-positive-ink",
  lost: "bg-negative-soft text-negative-ink",
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

// ---- the composer ------------------------------------------------------------

// Opening or copying a draft logs Sent once per channel, so "Mark as sent"
// is offered only until this channel has a Sent.
export const canMarkSent = (channel: Channel, outcomes: Pick<Outcome, "type" | "channel">[]) =>
  !outcomes.some((o) => o.type === "sent" && o.channel === channel);

// When each page a card quotes was read, by source id: a draft's claims
// cite the same pages without the date.
export function sourceReadDates(card: OpportunityCard, finishedAt: string | null) {
  const dates = new Map<string, string | null>();
  for (const claim of [card.offer, card.gap, ...card.why, card.angle]) {
    for (const cite of claim?.cites ?? []) if (cite.kind !== "fact") dates.set(cite.sourceId, citeReadAt(cite, finishedAt));
  }
  return dates;
}

export type Check = { text: string; state: "pass" | "fail" | "info" };

// "their website", "their Instagram bio", "a search result".
function sourcePhrase(name: string) {
  if (name === "Their website") return "their website";
  if (name === "A search result") return "a search result";
  if (name === "Our check") return "our own check";
  return `their ${name}`;
}

const listWords = (words: string[]) => (words.length < 2 ? words.join("") : `${words.slice(0, -1).join(", ")} and ${words.at(-1)}`);

// Signed when a line of the body is the name, or starts "Name, site".
function signedAs(body: string, name: string) {
  const n = name.trim().toLowerCase();
  return body.split("\n").some((line) => {
    const t = line.trim().toLowerCase();
    return t === n || t.startsWith(`${n},`);
  });
}

// What the Checks panel lists for a ready draft (it is only shown for a lead
// not on the opt-out list). An email's opt-out line and sign-off are read
// from the body as it will be sent: missing is a failed check.
export function draftChecks(draft: Draft, rules: { optOut: string; sender: string | null }): Check[] {
  const checks: Check[] = [{ text: "Not on your opt-out list", state: "pass" }];
  const claims = draft.lines.filter((l) => l.kind === "claim");
  const unsourced = claims.filter((l) => l.cites.length === 0).length;
  const aboutThem = claims.filter((l) => l.cites.some((c) => c.kind !== "fact"));
  const aboutYou = claims.length - unsourced - aboutThem.length;
  if (aboutThem.length > 0) {
    const names = [...new Set(aboutThem.flatMap((l) => l.cites.filter((c) => c.kind !== "fact").map((c) => sourcePhrase(citeName(c)))))];
    checks.push({ text: `${aboutThem.length} ${aboutThem.length === 1 ? "claim" : "claims"} about them, from ${listWords(names)}`, state: "pass" });
  }
  if (aboutYou > 0) checks.push({ text: `${aboutYou} ${aboutYou === 1 ? "claim" : "claims"} about you, from your approved facts`, state: "pass" });
  if (unsourced > 0) checks.push({ text: `${unsourced} ${unsourced === 1 ? "claim has" : "claims have"} no source`, state: "fail" });
  if (draft.channel === "email") {
    checks.push(draft.body.includes(rules.optOut.trim()) ? { text: "Opt-out line included", state: "pass" } : { text: "Opt-out line missing", state: "fail" });
    checks.push(
      !rules.sender
        ? { text: "No business name to sign as: approve your Brand DNA", state: "fail" }
        : signedAs(draft.body, rules.sender)
          ? { text: `Signed as ${rules.sender}`, state: "pass" }
          : { text: `Not signed as ${rules.sender}`, state: "fail" },
    );
  }
  const removed = draft.removed.filter((r) => r.text !== "(whole draft)").length;
  if (removed > 0) checks.push({ text: `${removed} ${removed === 1 ? "sentence" : "sentences"} removed: ${removed === 1 ? "its source didn't" : "their sources didn't"} back ${removed === 1 ? "it" : "them"}`, state: "info" });
  return checks;
}
