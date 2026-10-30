# Changes

Where the build stands. Decisions and their reasons are in 07-decisions-log.md.

## Status

- Phase 3 done 2026-10-26: claim check v2, 20-lead eval set saved, stale runs judged by database clock, development cap pauses resume only by hand.
- Claim check v3 2026-10-26 (on the open Phase 3 PRs): reason before verdict, narrow overreach, one verdict per claim or one retry, uncited signals a claim rests on become cites, a card stands on its offer and gap. Second eval set (5 real-estate leads) and a replay mode that judges saved cards. The checker is config (`CLAIM_CHECK_MODEL`).
- Checker chosen 2026-10-28: Sonnet 5.5 for claim checks; fit checks and routing stay on Haiku. Final v3 side-by-side reports in `eval/reports/`.
- Phase 4 built 2026-10-30 on branch `phase-4-outreach` (both repos): drafts on request with a Sonnet draft check, send targets from checked contact points (Maps phone for calls only), send links, outcome and feedback buttons, suppression, country rules for every country, pipeline view, drafts eval. Migration 0024 (`draft_sets`, `contact_feedback`, outcome and draft columns). Eval: four drafts $0.021–$0.032 and 10–27 s per card.
- Next: the user's manual check of drafts for 10 real leads, then contacting 10 real leads with the tool (more deep-dives are needed: 6 of 19 local leads with cards have a send target).
