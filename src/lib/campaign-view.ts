import type { LargeArea } from "./api-types/leads";
import type { OpportunityCard } from "./api-types/research";
// Plain words for the campaign workspace: how well a lead fits, its one-line
// summary, and the sentence under the campaign's title.
import type { ProfileSummary } from "./api-types/brand";
import type { Campaign, CampaignStatus, Lead } from "./api-types/leads";
import type { DraftCite } from "./api-types/outreach";
import type { Cite, DatedCite } from "./api-types/research";
import { formatDay } from "./format";
import { categoryText, FIT_WORDS, labelText } from "./leads";

// Buyer scores cluster around 0.4; a few rise above 0.7.
const STRONG = 0.7;
const GOOD = 0.5;

// The fit word and the fit bar's width (a percentage), from the buyer score.
// Before ranking there is no bar, only the fit check's verdict.
export function fitOf(lead: Pick<Lead, "buyer" | "fit">): { word: string; strong: boolean; width: number | null } {
  const score = lead.buyer?.score;
  if (score === undefined) return { word: FIT_WORDS[lead.fit.verdict ?? ""] ?? "Fit", strong: false, width: null };
  const word = score >= STRONG ? "Strong fit" : score >= GOOD ? "Good fit" : "Fair fit";
  return { word, strong: score >= STRONG, width: Math.round(score * 100) };
}

// The best way to reach them, and how sure we are: "WhatsApp confirmed".
export function contactNote({ contacts }: Pick<Lead, "contacts">) {
  if (contacts.whatsapp) return `WhatsApp ${labelText("whatsapp", contacts.whatsapp.label).word.toLowerCase()}`;
  if (contacts.phone) return contacts.phone.label === "confirmed" ? "Phone confirmed" : "Phone, single source";
  if (contacts.email) return `Email ${labelText("email", contacts.email.label).word.toLowerCase()}`;
  return "No contact found";
}

// A list row's second line: "Cake shop, Ilorin. 4.6 (210). WhatsApp confirmed".
export function leadMeta(lead: Lead) {
  const where = [categoryText(lead.category), lead.city].filter(Boolean).join(", ");
  const rating = lead.rating !== null ? `${lead.rating.toFixed(1)} (${lead.reviewCount ?? 0})` : null;
  return [where, rating, contactNote(lead)].filter(Boolean).join(". ");
}

// The one sentence under the title: the most useful thing to do next.
export const LITTLE_DATA = "Google Maps has little data for this area";

// Before a search: the countries among its places where Google Maps has
// little data, or null.
export function thinMapsNote(countries: string[]) {
  if (countries.length === 0) return null;
  const names = countries.length === 1 ? countries[0] : `${countries.slice(0, -1).join(", ")} and ${countries.at(-1)}`;
  return `${LITTLE_DATA} (${names}): expect few or no businesses.`;
}

// Before a search: a place past 40 tiles, and what to start with instead.
export function largeAreaNote(area: LargeArea) {
  const start =
    area.smaller.length > 0 ? "Start with one borough or district of it, and add more later." : "Start with a smaller place inside it, and add more later.";
  return `${area.name} covers ${area.tiles} map tiles, so searching all of it uses a lot of Google searches. ${start}`;
}

// The campaign's places with `from` swapped for `to` where it stood.
export function swapLocation(locations: string[], from: string, to: string) {
  const swapped = locations.map((id) => (id === from ? to : id));
  return [...new Set(swapped)];
}

// `contacted`: the leads that ever had a stage outcome (contactedLeads).
// `fewResults`: the finished search found fewer than 3 businesses (the API's).
// "Found no businesses that fit" only once the search has finished (its fit
// checks with it); before any Google search has run, it hasn't started.
export function findingSentence({
  leads,
  contacted,
  status,
  callsUsed,
  fewResults = false,
}: {
  leads: Lead[];
  contacted: ReadonlySet<string>;
  status: CampaignStatus;
  callsUsed: number;
  fewResults?: boolean;
}) {
  if (fewResults) return `${LITTLE_DATA}: the search found fewer than 3 businesses here.`;
  if (leads.length === 0) {
    if (status === "draft") return "Not searched yet. Confirm the search to find businesses that fit.";
    if (status === "running") return "Searching. Businesses that fit show up here as they are checked.";
    if (status === "done") return "The search found no businesses that fit.";
    if (callsUsed === 0) return "The search hasn't started yet.";
    return "No businesses that fit so far.";
  }
  const fresh = leads.filter((l) => !contacted.has(l.leadId));
  const strong = fresh.filter((l) => fitOf(l).strong);
  if (strong.length > 0) {
    const n = strong.length;
    const head = `${n} strong ${n === 1 ? "fit hasn't" : "fits haven't"} been contacted yet.`;
    return `${head}${whereClause(strong)}`;
  }
  if (fresh.length === 0) return "Every business here has been contacted.";
  return `${fresh.length} of ${leads.length} businesses haven't been contacted yet.`;
}

// The line under a campaign's title: who it is for (a suggested segment's
// name, or the user's own words), where, the Brand DNA version it uses (its
// deep-dives and drafts read it; with the version to link to, when it is still
// listed), when its search started, and, when a newer version has been
// approved since, the question whether to switch to it.
export function campaignContext(
  campaign: Pick<Campaign, "segment" | "buyerSegment" | "locations" | "brandProfileVersion" | "startedAt">,
  brand: { approved: Pick<ProfileSummary, "version"> | null; versions: Pick<ProfileSummary, "id" | "version">[] },
  timeZone: string,
) {
  const segment = campaign.buyerSegment;
  const who = segment?.setId ? segment.name : `Your own: ${segment?.name ?? campaign.segment}`;
  const where = campaign.locations.map((l) => l.name).join(", ");
  const built = campaign.brandProfileVersion;
  const profile = built === null ? null : (brand.versions.find((v) => v.version === built) ?? null);
  const approved = brand.approved?.version ?? null;
  return {
    who,
    where,
    brand: built === null ? null : { label: `Brand DNA v${built}`, profileId: profile?.id ?? null },
    started: campaign.startedAt ? `Started ${formatDay(campaign.startedAt, timeZone)}` : null,
    newer:
      built !== null && approved !== null && approved > built
        ? { version: approved, question: `A newer Brand DNA (v${approved}) was approved. Switch this campaign to v${approved}?` }
        : null,
  };
}

// " 3 of them are in Ikate and Osapa.", when two places hold most but not all.
function whereClause(leads: Lead[]) {
  const counts = new Map<string, number>();
  for (const l of leads) if (l.city) counts.set(l.city, (counts.get(l.city) ?? 0) + 1);
  const top = [...counts].sort((a, b) => b[1] - a[1]).slice(0, 2);
  if (top.length < 2) return "";
  const k = top[0]![1] + top[1]![1];
  return k < leads.length ? ` ${k} of them are in ${top[0]![0]} and ${top[1]![0]}.` : "";
}

// When a source was read ("read 26 Oct").
export const readOn = (iso: string | null, timeZone: string) => (iso ? `read ${formatDay(iso, timeZone)}` : "date not recorded");

// When a cite's page was read: its own read, or the research's finish time
// when the page has been read again since. Approved facts carry no date.
export const citeReadAt = (cite: DatedCite, finishedAt: string | null) => (cite.kind === "fact" ? null : (cite.fetchedAt ?? finishedAt));

const SOCIAL_HOSTS: [RegExp, string][] = [
  [/instagram\.com$/, "Instagram bio"],
  [/facebook\.com$/, "Facebook page"],
  [/tiktok\.com$/, "TikTok profile"],
  [/(^|\.)x\.com$|twitter\.com$/, "X profile"],
  [/linkedin\.com$/, "LinkedIn page"],
];

// The page, listing or bio a piece of evidence came from.
export function citeName(cite: Cite | DraftCite) {
  if (cite.kind === "fact") return "Your approved fact";
  if (cite.kind === "signal") return "Our check";
  if (cite.sourceType === "places") return "Google Maps listing";
  if (cite.sourceType === "search") return "A search result";
  try {
    const host = new URL(cite.url).hostname.replace(/^www\./, "");
    const social = SOCIAL_HOSTS.find(([re]) => re.test(host));
    if (social) return social[1];
  } catch {
    // Not a URL: fall through to the plain name.
  }
  return "Their website";
}

export const NOT_THIS_BUSINESS = "This doesn't match this business";

// A card's name in lists and headings: its offer, or that it is about
// another business (it cites their pages, so nothing of it is shown).
export function cardTitle(card: OpportunityCard) {
  if (card.mismatch) return NOT_THIS_BUSINESS;
  return card.offer?.text ?? "Opportunity";
}
