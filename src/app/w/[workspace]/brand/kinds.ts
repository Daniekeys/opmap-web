// The fact kinds in review order, and the tabs built from them.
import type { Fact, FactKind } from "@/lib/api-types/brand";

export const KINDS: { kind: FactKind; label: string; one: string }[] = [
  { kind: "service", label: "Services", one: "Service" },
  { kind: "proof_point", label: "Proof points", one: "Proof point" },
  { kind: "ideal_client", label: "Ideal clients", one: "Ideal client" },
  { kind: "industry", label: "Industries", one: "Industry" },
  { kind: "tone", label: "Tone of voice", one: "Tone of voice" },
  { kind: "location", label: "Places served", one: "Place served" },
];

export const kindLabel = (kind: FactKind) => KINDS.find((k) => k.kind === kind)!.one;

export type FactFilter = FactKind | "all";

// Every kind gets a tab, even with no facts, so the user sees the gap (often
// Industries) and can add one by hand.
export function factTabs(facts: Pick<Fact, "kind">[]): { kind: FactFilter; label: string; count: number }[] {
  return [
    { kind: "all", label: "All", count: facts.length },
    ...KINDS.map(({ kind, label }) => ({ kind, label, count: facts.filter((f) => f.kind === kind).length })),
  ];
}

export function emptyFactsMessage(filter: FactFilter) {
  if (filter === "all") return "No facts were found on the site. Add the ones you want by hand below.";
  const label = KINDS.find((k) => k.kind === filter)!.label.toLowerCase();
  return `No ${label} were found on the site. Add any you want by hand below.`;
}
