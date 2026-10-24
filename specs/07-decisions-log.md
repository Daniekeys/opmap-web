# Decisions log

Newest first. Add a line whenever something changes, with the reason.

| Date | Decision | Why |
|---|---|---|
| 2026-10-24 | Places-sourced fields marked with places_fetched_at and refreshed or cleared after 30 days | Google terms allow storing place ids long-term and lat/lng for 30 days only. Crawled data is ours |
| 2026-10-24 | Fixed global tile grid (0.02 degrees, splitting to 0.0025), search_coverage stores business_ids | Lets expansions and other workspaces reuse tiles and still get the businesses back |
| 2026-10-24 | Google cap windows count in America/Los_Angeles, replacing UTC | Google's daily quota resets at Pacific midnight, so our counter has to match or Google returns 429s we didn't expect |
| 2026-10-24 | Google Cloud set up: `opmap-maps` project, key restricted to Places API (New) and Geocoding, Text Search quota 30/day and 10/min, $1 budget scoped to opmap-maps only | Budget counts free tier credits (so free calls don't trigger alerts) but excludes promotional credits (so the $30 credit can't hide Maps spend). Separate budget for Voice-work keeps alerts unambiguous |
| 2026-10-22 | A Claude call that is charged but unusable (cut off, off-schema, refused) writes its real cost to `usage_ledger` with status `failed`; it counts toward the budget | Every paid call writes its real cost (money guardrails); a failed answer still costs money |
| 2026-10-22 | A paid step's free reuse of an earlier result runs before `checkLimit`, so it works for a workspace over budget | Reuse costs nothing; blocking it would stop a re-crawl of an unchanged site for no saving |
| 2026-10-22 | Crawler user agent: `OpmapBot/1.0 (+https://daniekeysstudios.com/bot; ...)` | Site owners can see who we are and how to reach us; robots.txt rules still match `OpmapBot` |
| 2026-10-22 | opmap-api runs TypeScript 7 for tsc (`@typescript/native`) with `typescript` aliased to TS 6 for typescript-eslint | typescript-eslint doesn't support TS 7 yet. Collapse back to one version once it does |
| 2026-10-22 | Brand DNA versions: each crawl with changed content saves a new draft and archives the old draft; at most one draft and one approved version per workspace. Facts start pending; ones matching the approved version are pre-marked but confirmed again; approved facts the crawl no longer finds are listed as "no longer on your site" | The approve step exists to catch stale claims (00-explee-flow-breakdown, weak spot 1), so nothing carries over without a fresh yes, while a re-crawl keeps the user's earlier wording |
| 2026-10-22 | Candidate and approved facts share `approved_facts`, with `status` (pending, approved, rejected), `origin` (extracted, user) and nullable `source_url`. Later phases read only approved facts of the approved version, through `getApprovedFacts` | One table keeps a fact's review state and its source together; the single read function keeps unapproved rows out of outreach |
| 2026-10-22 | Owners and members review facts; only owners start a Brand DNA run and approve a version | A run spends money and replaces the draft; approving sets the claims every future message may make about the business |
| 2026-10-22 | Every extracted fact must quote its page: the excerpt (under 25 words) has to be found in that page's text or the fact is dropped | Enforces "no claim without a source" in code instead of trusting the model |
| 2026-10-22 | Brand extraction is reused (no Claude call, no ledger row) when the crawled text hash, prompt version and model all match an earlier version | The site changes rarely; re-running should cost nothing when nothing changed |
| 2026-10-22 | Brand DNA calls Claude without server-side refusal fallbacks; a refusal fails the step with a clear message | A fallback model has different prices, which would make the ledger cost wrong |
| 2026-10-22 | Docker image keeps `node:24-slim` and adds only the Chromium headless shell and its libraries (`playwright install --with-deps --only-shell chromium`), about 615 MB | The crawler needs a browser only for JS-rendered pages; the official Playwright image is bigger and not based on our Node image |
| 2026-10-22 | `geo.geocode` joins `places.text_search` as an action a step can't declare as its `paidAction` | Both are metered in their adapters; declaring them on the step counted the call twice |
| 2026-10-21 | Module folders created per phase, not up front; prompts live in src/modules/<module>/prompts/<name>.v<n>.ts | Empty folders aren't tracked by git and add nothing; one fixed place for prompts before Phase 1 writes the first |
| 2026-10-15 | Dropped leads.contact_name and contact_email | Contact details are sourced claims in contact_points (spec, Data accuracy); bare values on leads would bypass the labels |
| 2026-10-15 | `opmap-web` hosted on Vercel Pro; `opmap-api` and Postgres stay on Railway | Already paying for Pro, which allows commercial use, so it's fine for stage 1. Previews and faster deploys come free with it |
| 2026-10-13 | `railway.json` deleted; the `api` service's Railway settings are set by hand and listed in the README | Railway's Config as Code is closed to new services, so the file was never read. A config file that does nothing misleads whoever deploys next |
| 2026-10-12 | Repo `specs/` is the source of truth; the live doc is retired | Three copies drifted within six days; the repo is versioned and is what Claude Code reads |
| 2026-10-12 | `contact_points` owned by the research module | It references `sources`; the lead finder writes through research's service functions |
| 2026-10-12 | `web` hosted on Railway with app sleeping (replaced 2026-10-15) | Vercel's free plan is non-commercial and stage 1 is a paid service |
| 2026-10-12 | Google caps are global across workspaces, not per workspace | One Google project and one free tier shared by everyone |
| 2026-10-12 | ~~Google caps counted in UTC~~ (superseded 2026-10-24: America/Los_Angeles); Places calls reserve a ledger slot before calling | Worst case at the month boundary is 980 calls, under the free 1,000. Reserving first means a failed call can never slip past the cap |
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
