// Sample data and plain logic for the public landing page (design/screens/
// Landing.dc.html). Everything here is invented: the page never calls our API
// or Google. Business names are made up so none can match a real business.

export const CONTACT_EMAIL = "daniel@daniekeysstudios.com";

const mailto = (subject: string, body?: string) =>
  `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}${body ? `&body=${encodeURIComponent(body)}` : ""}`;

// The closing form: the visitor's site goes in the body of an email to us.
export const leadsRequestMailto = (site: string) => mailto("5 free leads request", `Site: ${site.trim()}`);

export const STOP_CONTACT_MAILTO = mailto("Stop contacting me");

export type SampleRow = { initials: string; name: string; why: string; fit: "Strong fit" | "Good fit" };
export type SampleAnswer = { note: string; rows: SampleRow[] };

export const SEARCH_EXAMPLES = ["cake shops in Lekki", "private clinics in Ikeja", "event planners in Surulere"];

const ANSWERS: Record<string, SampleAnswer> = {
  "cake shops in lekki": {
    note: "159 good fits across 46 tiles. Sample data.",
    rows: [
      { initials: "DL", name: "Doughlark Cakes", why: "Lekki Phase 1. No website, takes orders by DM", fit: "Strong fit" },
      { initials: "SP", name: "Sugarfern Pastries", why: "Ikate. Website slow on phones", fit: "Strong fit" },
      { initials: "PC", name: "Plumtile Cake Studio", why: "Chevron. Opened in 2026, 41 reviews", fit: "Strong fit" },
    ],
  },
  "private clinics in ikeja": {
    note: "42 good fits across Ikeja so far. Sample data.",
    rows: [
      { initials: "QC", name: "Quillmere Clinic", why: "Bookings by phone only", fit: "Strong fit" },
      { initials: "BC", name: "Bramblecare Family Clinic", why: "Website down since August", fit: "Strong fit" },
      { initials: "HH", name: "Hollowfen Health", why: "Open weekends, no booking page", fit: "Good fit" },
    ],
  },
  "event planners in surulere": {
    note: "Not searched yet. These show what a result looks like. Sample data.",
    rows: [
      { initials: "CL", name: "Confetti Lantern Events", why: "Portfolio only on Instagram", fit: "Strong fit" },
      { initials: "MO", name: "Marigold Owl Party Planners", why: "4.8 stars, no website", fit: "Strong fit" },
      { initials: "TD", name: "Twelve Drums Events", why: "Prices only by DM", fit: "Good fit" },
    ],
  },
};

export const normaliseQuery = (query: string) => query.trim().replace(/\s+/g, " ").toLowerCase();

// A sample answer for one of the three examples, else null (the "we'd cut that
// place into map tiles" state).
export const sampleAnswer = (query: string): SampleAnswer | null => ANSWERS[normaliseQuery(query)] ?? null;

// The examples to offer under the search: every one except the query shown.
export const otherExamples = (query: string) => SEARCH_EXAMPLES.filter((q) => normaliseQuery(q) !== normaliseQuery(query));

// The bakery used on the how-it-works Send step and the sources card.
export const SAMPLE_BAKERY = {
  initials: "DL",
  name: "Doughlark Cakes",
  handle: "@doughlarkcakes",
  place: "Lekki Phase 1, Lagos. 4.6 stars, 112 reviews",
};

// Every sentence of sample copy, for the brand voice test.
export const allSampleCopy = () => [
  ...SEARCH_EXAMPLES,
  ...Object.values(ANSWERS).flatMap((a) => [a.note, ...a.rows.flatMap((r) => [r.name, r.why])]),
  SAMPLE_BAKERY.name,
  SAMPLE_BAKERY.place,
];
