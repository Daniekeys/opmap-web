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
- Any country, step D2 2026-11-06 on branch `any-country` (worktree, both repos): country profiles for NG, GH, KE, GB and a default for every other country (all drafts, a "check local marketing rules" note); phone parsing, dedupe, social search, Places language, WhatsApp guesses and draft tab order read the lead's profile; the workspace time zone (Settings page, suggested from the Brand DNA) replaces Lagos time in the web. No migration.
- Next: the user's manual check of drafts for 10 real leads, then contacting 10 real leads with the tool (more deep-dives are needed: 6 of 19 local leads with cards have a send target).

## Deploy checklist

Before `redesign` deploys to Railway:

- [ ] Set `RUN_MIGRATIONS_ON_START=true` on the `api` service. Without it the new image starts without migrating, and the code fails on the missing columns (from 0028 on).
- [ ] `PLACES_DAILY_CAP` and `PLACES_MONTHLY_CAP`, if set, are at or below 50 and 650, or the API refuses to start.
- [ ] Google Cloud's Places daily quota is at least 60 (production 50 plus development 10).
- [ ] Optional: `CLAUDE_DAILY_ALERT_USD` (default 5).
