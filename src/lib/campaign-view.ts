// Plain words for the campaign workspace: how well a lead fits, its one-line
// summary, and the sentence under the campaign's title.
import type { CampaignStatus, Lead } from "./api-types/leads";
import type { Stage } from "./api-types/outcomes";
import type { DatedCite } from "./api-types/research";
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
export function findingSentence({ leads, stages, status }: { leads: Lead[]; stages: Record<string, Stage>; status: CampaignStatus }) {
  if (leads.length === 0) {
    if (status === "draft") return "Not searched yet. Confirm the search to find businesses that fit.";
    if (status === "running") return "Searching. Businesses that fit show up here as they are checked.";
    return "The search found no businesses that fit.";
  }
  const fresh = leads.filter((l) => (stages[l.leadId] ?? "new") === "new");
  const strong = fresh.filter((l) => fitOf(l).strong);
  if (strong.length > 0) {
    const n = strong.length;
    const head = `${n} strong ${n === 1 ? "fit hasn't" : "fits haven't"} been contacted yet.`;
    return `${head}${whereClause(strong)}`;
  }
  if (fresh.length === 0) return "Every business here has been contacted.";
  return `${fresh.length} of ${leads.length} businesses haven't been contacted yet.`;
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

const day = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "Africa/Lagos" });

// When a source was read ("read 26 Oct").
export const readOn = (iso: string | null) => (iso ? `read ${day.format(new Date(iso))}` : "date not recorded");

// When a cite's page was read: its own read, or the research's finish time
// when the page has been read again since. Approved facts carry no date.
export const citeReadAt = (cite: DatedCite, finishedAt: string | null) => (cite.kind === "fact" ? null : (cite.fetchedAt ?? finishedAt));
