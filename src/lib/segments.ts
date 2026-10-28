import type { BuyerSignals } from "@/lib/api-types/leads";

// Buyer signals in plain words, for a segment card: "10+ reviews", "rated
// 4.0+", "has a website", "no website yet", "on Google as car wash".
export function signalsInWords(s: BuyerSignals) {
  const words: string[] = [];
  if (s.minReviews !== null) words.push(`${s.minReviews}+ reviews`);
  if (s.minRating !== null) words.push(`rated ${s.minRating.toFixed(1)}+`);
  if (s.website === "has") words.push("has a website");
  if (s.website === "lacks") words.push("no website yet");
  if (s.socials === "has") words.push("active on social media");
  if (s.socials === "lacks") words.push("no social media yet");
  if (s.categories.length) words.push(`on Google as ${s.categories.map((c) => c.replace(/_/g, " ")).join(", ")}`);
  return words;
}

// The "Rated at least" choices, plus a suggested rating that isn't one of
// them (say 4.2), so the select shows it instead of falling back to "Any".
const RATINGS = [3, 3.5, 4, 4.5];
export const ratingOptions = (current: number | null) =>
  current === null || RATINGS.includes(current) ? RATINGS : [...RATINGS, current].sort((a, b) => a - b);

// "car wash, auto spa" ->["car wash", "auto spa"]: 1 to 3 Google Maps searches.
export function parseSearchTerms(text: string) {
  return [...new Set(text.split(/[,\n]/).map((t) => t.trim().toLowerCase().replace(/\s+/g, " ")).filter((t) => t.length >= 2))].slice(0, 3);
}
