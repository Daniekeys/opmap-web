// Plain words for the lead finder's data: contact labels (spec, Data
// accuracy), phone numbers, categories and campaign states.
import type { Campaign, Lead, TargetKind } from "./api-types/leads";

export type ContactKindGroup = "phone" | "whatsapp" | "email" | "website" | "person" | "social";

type LabelText = { word: string; tip: string; tone: "good" | "fair" | "weak" };

// Every label the API can send, per kind, with a short reason.
const LABELS: Record<ContactKindGroup, Record<string, LabelText>> = {
  phone: {
    confirmed: { word: "Confirmed", tip: "two separate places listed this number", tone: "good" },
    single_source: { word: "Single source", tip: "one place listed this number", tone: "fair" },
  },
  whatsapp: {
    confirmed: { word: "Confirmed", tip: "they published a WhatsApp link with this number", tone: "good" },
    likely: { word: "Likely", tip: "a mobile number, but no WhatsApp link from them", tone: "fair" },
  },
  email: {
    found: { word: "Found on site", tip: "shown on their own website", tone: "good" },
    verified: { word: "Verified", tip: "a mail check accepted this address", tone: "good" },
    catch_all: { word: "Catch-all", tip: "their mail server accepts any address, so it can't be checked", tone: "fair" },
    single_source: { word: "Single source", tip: "one search result showed this address", tone: "fair" },
    guessed: { word: "Guessed", tip: "made up from their domain (info@), not seen anywhere", tone: "weak" },
  },
  website: {
    verified: { word: "Verified", tip: "it loads and names the business, its phone or city", tone: "good" },
    unverified: { word: "Unverified", tip: "it didn't load once, or doesn't name the business; checked again later", tone: "fair" },
    dead: { word: "Dead", tip: "it failed two checks at least 6 hours apart", tone: "weak" },
  },
  person: {
    sourced: { word: "Sourced", tip: "named on a page that names the business", tone: "good" },
  },
  social: {
    verified: { word: "Verified", tip: "their own website links to it, or its bio shows their phone", tone: "good" },
    single_source: { word: "Single source", tip: "one place listed this account", tone: "fair" },
  },
};

export function labelText(group: ContactKindGroup, label: string): LabelText {
  return LABELS[group][label] ?? { word: label.replaceAll("_", " "), tip: "", tone: "fair" };
}

// "+2348033718771" as Nigerians write it: "0803 371 8771". Other countries
// keep the international form.
// A WhatsApp value can be a link with no number (wa.me/message/...).
export function formatPhone(e164: string) {
  if (/^https?:/.test(e164)) return "WhatsApp link";
  const ng = /^\+234(\d{3})(\d{3})(\d{4})$/.exec(e164);
  return ng ? `0${ng[1]} ${ng[2]} ${ng[3]}` : e164;
}

export const telHref = (e164: string) => `tel:${e164}`;
export const whatsappHref = (value: string) => (/^https?:/.test(value) ? value : `https://wa.me/${value.replace(/\D/g, "")}`);

// "bakery" -> "Bakery", "cake_shop" -> "Cake shop".
export function categoryText(type: string | null) {
  if (!type) return null;
  const words = type.replaceAll("_", " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

const SOCIAL_NAMES: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  x: "X",
  linktree: "Linktree",
  biolink: "Link in bio",
  youtube: "YouTube",
  linkedin: "LinkedIn",
};
export const socialName = (kind: string) => SOCIAL_NAMES[kind] ?? kind;

export const hasPhoneOrWhatsapp = (lead: Lead) => lead.contacts.phone !== null || lead.contacts.whatsapp !== null;

export const hasAnyContact = (lead: Lead) => {
  const c = lead.contacts;
  return Boolean(c.phone || c.whatsapp || c.email || c.website || c.socials.length);
};

export const FIT_WORDS: Record<string, string> = { match: "Match", likely: "Likely fit", possible: "Possible" };

export const TARGET_KINDS: { kind: TargetKind; label: string; help: string; supported: boolean }[] = [
  { kind: "local_business", label: "Local businesses", help: "Shops and services on Google Maps: bakeries, clinics, salons, schools", supported: true },
  { kind: "b2b", label: "B2B companies", help: "Startups, agencies, fintechs, found on the web. Not searchable yet", supported: false },
  { kind: "institution", label: "Institutions", help: "NGOs, government bodies, associations. Not searchable yet", supported: false },
];

// Fixed time zone so the server and the browser print the same day.
const dayOf = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos" }).format(d);
const timeOf = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Lagos" });

// Whether a paused campaign's limit has lifted, so an owner can resume it
// (the API checks again with the database's clock).
export const resumeDue = (resumeAt: string | null, now = new Date()) => resumeAt !== null && new Date(resumeAt).getTime() <= now.getTime();

// "Paused until tomorrow, 08:00" (Lagos time), or the date when it's later.
export function pausedUntil(resumeAt: string, now = new Date()) {
  const at = new Date(resumeAt);
  const tomorrow = new Date(now.getTime() + 86_400_000);
  if (dayOf(at) === dayOf(now)) return `later today, ${timeOf.format(at)}`;
  if (dayOf(at) === dayOf(tomorrow)) return `tomorrow, ${timeOf.format(at)}`;
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Lagos" }).format(at);
}

export function statusText(campaign: Pick<Campaign, "status" | "resumeAt">, now = new Date()) {
  switch (campaign.status) {
    case "draft":
      return "Draft, not started";
    case "running":
      return "Searching";
    case "paused":
      if (resumeDue(campaign.resumeAt, now)) return "Paused, limit lifted";
      return campaign.resumeAt ? `Paused until ${pausedUntil(campaign.resumeAt, now)}` : "Paused";
    case "done":
      return "Complete";
    case "failed":
      return "Failed";
  }
}

export function formatUsd(n: number) {
  return n < 0.01 && n > 0 ? "under 1 cent" : `$${n.toFixed(2)}`;
}
