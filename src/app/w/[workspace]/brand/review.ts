// Words for the draft review screen (design/screens/BrandDNA.dc.html): the
// one-sentence finding, short page names and the "read from" line.
import type { CrawledPage, Fact, FactKind, ProfileSummary } from "@/lib/api-types/brand";
import { formatDay } from "@/lib/format";

// What one or several facts of a kind are called in a sentence.
const NOUNS: Record<FactKind, [string, string]> = {
  service: ["service", "services"],
  proof_point: ["proof point", "proof points"],
  ideal_client: ["ideal client", "ideal clients"],
  industry: ["industry", "industries"],
  tone: ["note on your tone", "notes on your tone"],
  location: ["place served", "places served"],
};

const count = (n: number, [one, many]: [string, string]) => (n === 1 ? `One ${one}` : `${n} ${many}`);

const APPROVED_ONLY = "Only facts you approve go into messages.";

// The most important thing about the draft right now: facts that may be out
// of date first, then how many are left, then that it can be approved.
export function reviewFinding(facts: Pick<Fact, "kind" | "status" | "possiblyStale">[], source: ProfileSummary["source"]) {
  if (facts.length === 0) return "Nothing was found to review. Add the facts you want by hand.";
  const pending = facts.filter((f) => f.status === "pending");
  const stale = pending.filter((f) => f.possiblyStale);
  if (stale.length > 0) {
    const kinds = new Set(stale.map((f) => f.kind));
    const what = kinds.size === 1 ? count(stale.length, NOUNS[stale[0]!.kind]) : count(stale.length, ["fact", "facts"]);
    const where = source === "website" ? "on your site" : "in your description";
    return `${what} ${where} may be out of date. ${APPROVED_ONLY}`;
  }
  if (pending.length > 0) return `${count(pending.length, ["fact", "facts"])} left to review. ${APPROVED_ONLY}`;
  return `All ${facts.length} facts are decided. Only the ones you approved go into messages.`;
}

// "services" for https://site.com/services/, "home" for the home page.
export function pageName(url: string) {
  let path: string;
  try {
    path = new URL(url).pathname;
  } catch {
    return url;
  }
  const last = path.split("/").filter(Boolean).pop();
  if (!last) return "home";
  let name = last;
  try {
    name = decodeURIComponent(last);
  } catch {
    // Keep it as written.
  }
  return name
    .replace(/\.(html?|php|aspx?)$/i, "")
    .replace(/[-_]+/g, " ")
    .trim()
    .toLowerCase() || "home";
}

const SHOWN_PAGES = 6;

// "9 pages on 28 Oct: home, about, services, portfolio, contact, team and 3 more."
export function pagesRead(pages: Pick<CrawledPage, "url">[], readAt: string) {
  const on = formatDay(readAt);
  if (pages.length === 0) return `On ${on}.`;
  const names = [...new Set(pages.map((p) => pageName(p.url)))];
  const shown = names.slice(0, SHOWN_PAGES);
  const rest = pages.length - shown.length;
  const list =
    rest > 0
      ? `${shown.join(", ")} and ${rest} more`
      : shown.length === 1
        ? shown[0]
        : `${shown.slice(0, -1).join(", ")} and ${shown.at(-1)}`;
  return `${pages.length} ${pages.length === 1 ? "page" : "pages"} on ${on}: ${list}.`;
}

// What approving the draft changes.
export function approveNote(approvedVersion: number | null) {
  return approvedVersion === null
    ? "Approving makes it the version used in messages written from now on."
    : `Approving replaces version ${approvedVersion} in messages written from now on.`;
}
