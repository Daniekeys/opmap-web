# Decisions log

Newest first. Add a line whenever something changes, with the reason.

| Date | Decision | Why |
|---|---|---|
| 2026-10-21 | Module folders created per phase, not up front; prompts live in src/modules/<module>/prompts/<name>.v<n>.ts | Empty folders aren't tracked by git and add nothing; one fixed place for prompts before Phase 1 writes the first |
| 2026-10-15 | Dropped leads.contact_name and contact_email | Contact details are sourced claims in contact_points (spec, Data accuracy); bare values on leads would bypass the labels |
| 2026-10-15 | `opmap-web` hosted on Vercel Pro; `opmap-api` and Postgres stay on Railway | Already paying for Pro, which allows commercial use, so it's fine for stage 1. Previews and faster deploys come free with it |
| 2026-10-13 | `railway.json` deleted; the `api` service's Railway settings are set by hand and listed in the README | Railway's Config as Code is closed to new services, so the file was never read. A config file that does nothing misleads whoever deploys next |
| 2026-10-12 | Repo `specs/` is the source of truth; the live doc is retired | Three copies drifted within six days; the repo is versioned and is what Claude Code reads |
| 2026-10-12 | `contact_points` owned by the research module | It references `sources`; the lead finder writes through research's service functions |
| 2026-10-12 | `web` hosted on Railway with app sleeping (replaced 2026-10-15) | Vercel's free plan is non-commercial and stage 1 is a paid service |
| 2026-10-12 | Google caps are global across workspaces, not per workspace | One Google project and one free tier shared by everyone |
| 2026-10-12 | Google caps counted in UTC; Places calls reserve a ledger slot before calling | Worst case at the month boundary is 980 calls, under the free 1,000. Reserving first means a failed call can never slip past the cap |
| 2026-10-12 | `usage_ledger.status` (reserved, done, failed); every status counts toward the Google cap | A crashed or timed-out call can never free its slot |
| 2026-10-12 | Drop `leads.contact_name` and `contact_email`; contacts come from `contact_points` | Keeps every contact detail a sourced claim |
| 2026-10-12 | Active workspace lives in the URL (`/api/w/:workspaceId/...`), not on the session | Nothing to go stale, links are shareable, the switcher is frontend state only |
| 2026-10-12 | `workspace_id` on every private table, including child tables | Makes workspace isolation and leak tests mechanical |
| 2026-10-12 | Every repo has a `repo.leak.ts` registering its queries with fixture arguments | A missing registration fails the leak test and the typecheck, so isolation can't silently degrade |
| 2026-10-12 | Invite links handed over manually, with an `invites` table | No MailProvider in v1; sign-up stays closed |
| 2026-10-12 | Seed three accounts: Daniel as owner of both workspaces, one member login each for Daniekeys Studios and Afriment | Gets both teams in on day one; per-person accounts via invites once the team grows |
| 2026-10-12 | Free and Pro plans seeded with zero budget | No limits defined yet; nothing paid runs on them until real numbers are set |
| 2026-10-12 | Node 24 LTS everywhere (local, Docker, Railway) | The npm 11 lockfile fails under Node 22's npm 10 |
| 2026-10-12 | Two separate repos, `opmap-api` and `opmap-web`, instead of one monorepo | Personal preference and simpler mental model; the API repo owns the specs and the data contracts |
| 2026-10-12 | Deep-dive runs when a lead is first opened, not automatically | Cheaper, since most leads in a campaign never get contacted |
| 2026-10-12 | v1 works on desktop and phone | Team will check leads and copy messages from their phones |
| 2026-10-12 | Repo codename is `opmap`, brand name deferred to stage 3 | Two name candidates were unavailable. Renaming a repo is cheap, so it shouldn't block Phase 0 |
| 2026-10-12 | Express 5 instead of Fastify for the backend | More familiar, faster to debug; speed difference is irrelevant next to Google and Claude calls |
| 2026-10-12 | Go-to-market in three stages: sell results as a Daniekeys service, then client perk, then a separate SaaS brand | Fastest route to revenue with no money; service revenue counts as traction; Google's startup program excludes agencies and investors fund product companies |
| 2026-10-12 | Free offering is a 5-lead sample sent to prospects, not a free public app | Costs about 30 cents per prospect instead of burning the shared 1,000 free Google calls |
| 2026-10-12 | Stage 3 payments: Lemon Squeezy internationally, Paystack Starter Business for naira, manual access codes as fallback | Both work before CAC registration; Dodo Payments doesn't accept Nigeria |
| 2026-10-12 | Google Places capped in code at 950 calls a month and 30 a day, plus console quota, $1 budget and optional kill switch | No cash to absorb overages; Google budgets alone don't stop spending |
| 2026-10-12 | Ignore the "$200 monthly Maps credit" | It ended February 28, 2025; per-SKU free caps replaced it |
| 2026-10-11 | Claude API for all AI (Haiku, Sonnet, Opus); TypeSafe Jev and OpenAI removed | $1,000 in Claude credits; Haiku is cheap enough for fit and claim checks |
| 2026-10-11 | Own backend (Node) with Postgres on Railway; Supabase removed | Full control over the backend; one host for everything |
| 2026-10-11 | Location as a ladder down to map tiles, with adaptive splitting and a coverage table | One Places search caps at 60 results; tiles cover a city without guessing neighbourhood names |
| 2026-10-11 | Every contact detail stored as a sourced claim with a label | Explee attached the wrong person to the wrong company; Nigerian SMEs often have no email |
| 2026-10-06 | v1 is an internal tool for Daniekeys Studios and Afriment | Prove it works before opening it up |

## Open
- Final product name (working name Opportunity Map, repo `opmap`)
- First campaign for each workspace: business type and two or three cities (needed by Phase 2)
- Approved facts Daniekeys can use from day one (needed by Phase 1)
