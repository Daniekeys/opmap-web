// A UK lead's legal form on the lead page (the API's legalForm block): what
// Companies House found and how it was matched, or a member's own check,
// which wins; then what that means for the channels (PECR).
import type { LegalFormView } from "./api-types/outreach";

const TYPE_NAMES: Record<string, string> = {
  ltd: "Private limited company",
  plc: "Public limited company",
  llp: "Limited liability partnership",
  "limited-partnership": "Limited partnership",
  "scottish-partnership": "Scottish partnership",
  "private-limited-guarant-nsc": "Company limited by guarantee",
  "private-limited-guarant-nsc-limited-exemption": "Company limited by guarantee",
  "private-limited-shares-section-30-exemption": "Private limited company",
};

const typeName = (type: string) => TYPE_NAMES[type] ?? (type ? type.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase()) : "Company");

// Companies House statuses, read after "but".
const STATUS_WORDS: Record<string, string> = {
  liquidation: "in liquidation",
  receivership: "in receivership",
  administration: "in administration",
  "insolvency-proceedings": "in insolvency proceedings",
  "voluntary-arrangement": "in a voluntary arrangement",
  "converted-closed": "converted or closed",
};
const statusWords = (status: string) => STATUS_WORDS[status] ?? (status ? status.replace(/-/g, " ") : "with no status");

const METHODS = { site_number: "Matched by the company number on their site.", name_postcode: "Matched by name and postcode." } as const;

export const CONSENT_LINE = "Consent needed for this business under UK rules: only the call opener can be used until they agree to hear from you.";
const OPEN_LINE = "A company: every channel can be used, with your name and the opt-out line.";

export function legalFormText(view: LegalFormView): { status: string; badge: string | null; consequence: string } {
  const consequence = view.consentNeeded ? CONSENT_LINE : OPEN_LINE;
  if (view.confirmed) {
    return { status: `${view.confirmed.form === "company" ? "Limited company" : "Sole trader"}, checked by your team.`, badge: `Confirmed by ${view.confirmed.by}`, consequence };
  }
  const registry = view.registry;
  if (!registry) return { status: "Not checked on Companies House yet.", badge: null, consequence };
  const company = registry.company;
  if (!company) return { status: "Not found on Companies House.", badge: null, consequence };
  const who = `${company.name}, ${company.number}`;
  if (company.status !== "active") {
    return { status: `On Companies House as ${who}, but ${statusWords(company.status)}, so it counts as unknown.`, badge: null, consequence };
  }
  const how = registry.method ? ` ${METHODS[registry.method]}` : "";
  return { status: `${typeName(company.type)} on Companies House: ${who}.${how}`, badge: null, consequence };
}
