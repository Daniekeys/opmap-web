// Looking up a place that isn't in the list (spec, Location > Beyond
// Nigeria): offered when the typed text names no place in the list exactly.
import type { GeoArea } from "./api-types/leads";

const words = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();

// Whether to offer "Look up ... on Google Maps": two letters or more, the list
// has answered, and no place in it is called exactly that (its first part:
// "Accra, Ghana" asks for Accra).
export function offerLookup(text: string, results: GeoArea[] | null) {
  const asked = words(text.split(",")[0] ?? "");
  if (asked.length < 2 || results === null) return false;
  return !results.some((a) => words(a.name) === asked);
}
