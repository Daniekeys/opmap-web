# Phase 3 - Deep-dive

Read: Core pipelines > 3, Lead sourcing > Local business flow 6, Data accuracy, Quality guardrails.

Build:
- Lead page (`/w/<workspace>/campaigns/<campaign>/leads/<lead>`, linked from the leads list) opens the deep-dive on first view only, through `research.openLead`. Show a loading state that reads from `step_runs` (same progress panel as Phase 0). The job must be safe if two people open the same lead at once, so it runs once (the lead is claimed in `deep_dives` first; one running row per lead), and it goes through `checkLimit` like any paid action. Saved results load for free. Leads researched more than 90 days ago show a refresh button instead of re-running on their own. A run that died is marked failed when the lead is next opened, with a try-again button. Check the page at phone width.
- Crawl the lead's site (up to 8 pages in 45 seconds) and save every page read to `sources` with its text.
- For a lead with no website of its own (or a site that can't be read that day), the deep-dive runs the one social search (`deepdive.search`, the same search as `lead_socials`, built in Phase 2; spec, Lead sourcing > Local business flow 6). A social is kept only if its cited text has the lead's phone (verified) or names the business and its city (single source).
- Signals: has a website, has a mobile layout tag (named that way: it doesn't show the site works well on phones), order or booking flow on the pages read, social accounts, what they sell, who they serve (Haiku, quoted word for word).
- Claude Sonnet 5.5 writes up to three opportunity cards from approved facts only, plus the campaign's buyer segment (its pain and what to pitch first): what to offer, the gap, why it matters, the angle, confidence, evidence links. Brand DNA goes in a cached prompt prefix.
- Claude Haiku checks every claim against only what it cites (claim check v2): offers against approved facts, gaps and whys against their sources and signals. It gives a verdict (supported, unsupported, contradicted, overreach) and the evidence span that shows it; code removes everything not supported, and a supported verdict whose span isn't in the cited evidence. Absence claims say where we looked. Too little data gives a "Not enough information" card.
- The 20 leads of the first eval run are the eval set (`eval/deep-dive.json`, `npm run eval:deepdive`), rerun after every prompt or model change with a before/after report in `eval/reports/`.
- A run counts as died after 15 minutes, and a run's duration is measured in Postgres (`now()` against the `started_at` it set), never the app's clock.
- Explee's draft pitched "brand identities and websites for food businesses" with no specific gap. Our cards must name the gap: a gap that cites nothing about this business is dropped in code, and Haiku drops one that isn't specific.
- Evidence links open the source page, and each quote is shown under its claim on the lead page, so a claim can be checked without leaving it. Removed claims are listed too.
- Each step (crawl, search, signals, cards, check, save) is timed in `step_runs`.

Done when: 20 deep-dives run with no unsupported claims on a manual check, each under 2 minutes and under $0.10.
