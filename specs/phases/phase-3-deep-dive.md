# Phase 3 - Deep-dive

Read: Core pipelines > 3, Quality guardrails.

Build:
- Lead page opens the deep-dive on first view only. Show a loading state that reads from `step_runs` (same progress panel as Phase 0). The job must be safe if two people open the same lead at once, so it runs once, and it goes through `checkLimit` like any paid action. Saved results load for free. Leads older than 90 days show a refresh button instead of re-running on their own. Check the page at phone width.
- Crawl the lead's site and save every page read to `sources`.
- For a lead with no website of its own, call `research.openLead` on first view: it starts the one social search (`lead_socials`, built in Phase 2; spec, Lead sourcing > Local business flow 6) and does nothing after that or for a lead with a website.
- Signals: has a website, works on mobile, booking or order flow, social links, what they sell, who they serve.
- Claude Sonnet 5.5 writes up to three opportunity cards from approved facts only: what to offer, why they need it, the angle, confidence, evidence links. Brand DNA goes in a cached prompt prefix.
- Claude Haiku checks every claim against its cited source; unsupported claims are removed. Too little data gives a "Not enough information" card.
- Explee's draft pitched "brand identities and websites for food businesses" with no specific gap. Our cards must name the gap.

Done when: 20 deep-dives run with no unsupported claims on a manual check, each under 2 minutes and under $0.10.
