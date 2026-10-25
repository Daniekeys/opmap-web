# Phase 2.5 - Buyer segments

Read: Overview, Core pipelines > 1 and 2, Lead sourcing, Quality guardrails. `00-explee-flow-breakdown.md` step 3 (Define campaigns) for reference only; never copy their UI or copy.

The value is matching, not search: the tool reads the seller's Brand DNA, works out who is most likely to pay for what they sell, and finds them locally. No Google calls in this phase.

Build:
- Specs in sync: the "Keep the specs in sync" rule in CLAUDE.md (both repos); Overview flow, Core pipelines 1 and 2, the Scope table and this phase updated; decisions log rows.
- Brand DNA without a website: a "describe your business" path, a short text plus an optional Instagram handle. Same Opus extraction to the same Zod schema, same approve-facts flow, same versions. Facts from a description are sourced to that description (its excerpt must be in the text), so they are approved like crawled ones. Instagram pages are never fetched; the handle is kept with the profile, and the user can paste their bio or captions into the description.
- Buyer segments: a versioned prompt with a Zod schema. Input: approved Brand DNA facts only (`getApprovedFacts`). Output: up to 6 segments, each with a name, 2 or 3 Places search terms, why they buy, the pain, what to pitch first, buyer signals as checkable fields (review count, rating, has website, has socials, category), suggested places from `geo_areas` or country names, reachability (`places` or `not_yet`), and a rank with a one-line reason. Ranked by real pain, ability to pay and digital exposure: a business already spending on marketing ranks above one with no online presence, unless the seller's offer is exactly about getting them online.
- Claude Opus 5.5 behind `LlmProvider`, cached per Brand DNA version (and prompt version), cost written to `usage_ledger` through `checkLimit`.
- The campaign screen opens with the segment cards. Pick one, edit it, or type your own. "Not reachable yet" segments are shown but can't start a campaign. The chosen segment is saved on the campaign, with the Brand DNA version it came from.
- Lead ranking, fit check v3: Haiku reports what the name, category, rating, review count, website and socials show; code scores it against the category and the segment's buyer signals. The score and its reasons are stored on the fit check. The leads table sorts by score and shows the top reason in plain words ("35 reviews and an active Instagram").
- Re-score the existing Ilorin campaign with a bakery segment from Daniekeys' Brand DNA, Haiku only, no Google.
- Mobile-first, with empty, loading and error states. Tests for the segment schema, the ranking rubric and workspace isolation.

Done when: Daniekeys and Afriment each get up to 6 segments from their approved Brand DNA that you'd use, a written description ("I make and sell liquid soap in Lagos") gives a usable segment list, and the Ilorin leads are ranked by buyer signals with a plain-words top reason on each.
