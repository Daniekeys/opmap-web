# Changes

Where the build stands. Decisions and their reasons are in 07-decisions-log.md.

## Status

- Phase 3 done 2026-10-26: claim check v2, 20-lead eval set saved, stale runs judged by database clock, development cap pauses resume only by hand.
- Claim check v3 2026-10-26 (on the open Phase 3 PRs): reason before verdict, narrow overreach, one verdict per claim or one retry, uncited signals a claim rests on become cites, a card stands on its offer and gap. Second eval set (5 real-estate leads) and a replay mode that judges saved cards. The checker is config (`CLAIM_CHECK_MODEL`).
- Checker chosen 2026-10-28: Sonnet 5.5 for claim checks; fit checks and routing stay on Haiku. Final v3 side-by-side reports in `eval/reports/`.
- Phase 4 built 2026-10-30 on branch `phase-4-outreach` (both repos): drafts on request with a Sonnet draft check, send targets from checked contact points (Maps phone for calls only), send links, outcome and feedback buttons, suppression, country rules for every country, pipeline view, drafts eval. Migration 0024 (`draft_sets`, `contact_feedback`, outcome and draft columns). Eval: four drafts $0.021–$0.032 and 10–27 s per card.
- Offer check 2026-11-01 on branch `redesign`: drafts need the card's offer in the approved Brand DNA (checked before any spend), stale drafts can't be sent, and "Re-run deep-dive with current Brand DNA" rewrites cards from saved research. No migration. Clone check on Estate Code: v4 re-run $0.025 (Not enough information), v2 re-run $0.061 (2 cards on v2 facts), drafts $0.039 (four ready, each with an offer sentence).
- Demo-ready Phase 1 2026-11-01 on branch `redesign`: leads wanted (20 to 30; migration 0028), neighbourhood extras off by default, Places caps production 50/650 and development 10/300 by env, an alert past $5 a day of Claude on Internal instead of a block, no auto-resume anywhere, no-Google pause once, deep-dive fails once on an unusable answer, Start search lock, an interactive lane for deep-dives and drafts, ready-to-message leads first, keyless tests and confirm-before-spend scripts. Clone: a Lagos bakery search stopped at 20 leads after 2 Google searches ($0.0014 of Claude).
- Demo-ready follow-ups 2026-11-03 on branch `redesign`, committed 2026-11-05: Places caps are ceilings (env can lower them; above a ceiling the API refuses to start); owners see a Claude daily alert banner for the rest of the UTC day. Clone drafts check with v2 re-approved: four drafts for Cherish cakes and events place, $0.037 and 21 s; v4 approved again after. pause-state-fixes' migrations renumbered to 0029 and 0030 to follow redesign's 0028.
- Migrate on start gated 2026-11-05 on branch `redesign`: the Docker image runs migrations at start only when `RUN_MIGRATIONS_ON_START=true`; off by default, so a local run of the image never migrates a local database.
- Channel status 2026-11-06 on branch `channel-status` (worktree, both repos): every draft tab shows a status chip and, with no target, the reason with "Show draft anyway" (copy only); likely WhatsApp for Nigerian MOBILE or FIXED_LINE_OR_MOBILE numbers, decided in `research/phone-rules.ts`; LinkedIn only from their site or listing; a "Not on WhatsApp" button; WhatsApp confirmed and likely apart in the leads list, confirmed first. No migration.
- Any country, step D7 2026-11-06: a place past 40 tiles gets a note and a borough to swap in (London's 32 boroughs and the City of London seeded); a search needing more Google searches than this month has left can't start (`over_monthly_cap`), checked again once its places are mapped.
- Any country, step D6 2026-11-06: a UK lead's legal form from Companies House (number on its site, then name and postcode), saved for every workspace for 90 days; only an active company gets every draft, everyone else the call opener; "I checked" buttons on the lead; TPS/CTPS line on UK call tabs. Migration 0031 (0029 and 0030 are pause-state-fixes').
- Any country, step D5 2026-11-06: "Google Maps has little data for this area" before a search in China or North Korea, and after a search that found fewer than 3 businesses. The confirm panel's Google cost reads $0 inside the free tier.
- Fix batch after D4 2026-11-06: campaign counts are businesses (Messaged is any stage outcome); cards and drafts citing another business's sources show "This doesn't match this business"; "Email not checked"; green chips only for checked contacts; "Opted out" in the leads list; a fade on the phone's filter chips; geocoding caps (100 a day, 2,000 a month).
- Any country, step D4 2026-11-06: places not in the list are looked up on Google Maps on demand from the campaign form and cached in geo_areas (towns, districts under their town, regions searched whole), in any country Google covers.
- Any country, polish after D3 2026-11-06: country notes at the top of the draft; phones national only for the workspace's own country, else international; Settings text follows a save and the zone picker lists the workspace country's zones first.
- Any country, step D2 2026-11-06 on branch `any-country` (worktree, both repos): country profiles for NG, GH, KE, GB and a default for every other country (all drafts, a "check local marketing rules" note); phone parsing, dedupe, social search, Places language, WhatsApp guesses and draft tab order read the lead's profile; the workspace time zone (Settings page, suggested from the Brand DNA) replaces Lagos time in the web. No migration.
- Any country, D2 follow-ups and D3 2026-11-06 on `any-country`: an unknown country code gets the default profile, never Nigeria's; phone display loads its library only on the lead and messages pages; `/campaigns/new` starts from the Brand DNA's places.
- Fix A 2026-11-07 on `redesign`: the campaigns 500 was code ahead of the database (0028 on 11-04, 0029 on 11-07); the API and worker now refuse to start on a database behind the code, naming the missing migrations; every 500 is logged with a request id the error screen shows; error screens with Retry for the workspace shell and every section.
- Fix B 2026-11-07 on `redesign`: Nigeria and Africa/Lagos are the default workspace country and zone; a Brand DNA version based in another country asks the owner, as its own item in the review, whether to switch (approve saves that country's zone, reject keeps Nigeria, both logged); Settings still overrides. No migration.
- Messages never blocked 2026-11-07 on `redesign`: the Tech365 name-check fix (page names like FAQ aren't business names), the fallback rewrite, general offer cards for leads with no specific gap, auto-drafts after every deep-dive, every tab shows its draft with a copy-and-paste chip where nothing can be opened, "Chat on WhatsApp" prefilled, and the Tailored / General badge, filter, order and counts. No migration.
- Next: the user's manual check of drafts for 10 real leads, then contacting 10 real leads with the tool (more deep-dives are needed: 6 of 19 local leads with cards have a send target).

## Clones to re-clone

- `opmap_shots_redesign` and `opmap_b_backfill` ran migration 0029 before its backfill changed (2026-11-06, merging pause-state-fixes into redesign: it now also turns campaigns paused with "This server can't call Google..." into setup pauses). Their pause labels can't be trusted until both are re-cloned from local `opmap` and migrated again.
## Known flaky tests

- `test/pipeline.test.ts` > "runs an interactive run (a deep-dive, drafts) while a background run still holds its lane": failed once in the full API suite under load on 2026-11-06 (after 23 s); its file passed alone (14 of 14). Again on 2026-11-07 in the full suite after merging any-country into redesign ("pipeline run did not finish in time"); alone, 14 of 14. Timing, not a lane bug; rerun the file before looking further.

## Parked

- UK, for when we run a UK campaign (no Companies House key yet, so D6 runs without it: no lookup, every UK lead gets the call opener only until a member says "I checked: limited company"): set `COMPANIES_HOUSE_API_KEY` and make the one real lookup with `npm run registry:try` (estimate and yes first); then the candidate list, Companies House entries close to the lead for a member to pick from when no automatic match is found.

## Deploy checklist

Before `redesign` deploys to Railway:

- [ ] Set `RUN_MIGRATIONS_ON_START=true` on the `api` service. Without it the new image doesn't migrate, and the API refuses to start, logging the missing migrations (from 0029 on).
- [ ] `PLACES_DAILY_CAP` and `PLACES_MONTHLY_CAP`, if set, are at or below 50 and 650, or the API refuses to start.
- [ ] Google Cloud's Places daily quota is at least 60 (production 50 plus development 10).
- [ ] Optional: `CLAUDE_DAILY_ALERT_USD` (default 5).
