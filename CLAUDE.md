Copy of opmap-api/CLAUDE.md. The API repo is the source of truth; update there first.

Web only: also read AGENTS.md for Next.js 16 notes before writing code.

# CLAUDE.md

Rules for any AI coding agent working in this repo. The product spec lives in `specs/`. Check specs/07-decisions-log.md before changing anything it covers, and add a row when you change a decision. Screenshots in `reference/` show flow and information density only; never copy Explee's UI or copy.

## How to work
- Read the existing code and patterns before writing anything.
- State your assumptions and tradeoffs, and give a plan, before any multi-step task.
- Keep code minimal. No premature abstraction or over-engineering.
- Make surgical diffs that match the existing style. No runaway refactors, no kitchen-sink changes.
- Verify with tests. For a bug fix, write the failing test first.
- When debugging, find the root cause instead of guessing.
- Don't add a dependency without saying why it's needed.
- Make architectural decisions visible: say what you chose and why.
- Handle empty, loading and error states, not just the happy path.
- Never invent an API. If you're unsure a method or endpoint exists, check the docs or say so.
- Keep the specs in sync. Whenever a decision changes how something works, update specs/01-opportunity-map-v1-spec.md (the build spec), specs/07-decisions-log.md and the matching phase file in specs/phases/ in the same commit, copy the specs to opmap-web, and list every spec change in your report with the section name.
- Every report that touches UI includes screenshots of each changed screen at 380px and at desktop width, saved in a screenshots-<phase>/ folder, with the file names listed in the report.

## Design rules
1. **Two repos, one database.** `opmap-web` (Next.js frontend) and `opmap-api` (Node + Express 5, which also runs the pg-boss worker). The API repo owns the specs and the data contracts (Zod schemas). The web repo keeps a copy of the API types it needs, updated whenever the API changes. No microservices.
2. **Workspace on everything.** Every business table carries `workspace_id`. Every query function takes a workspace id as a required argument. Leak tests must fail if any query returns another workspace's rows. The first query on any workspace-owned table must ship with its leak test.
3. **Modules own their data.** Feature modules: `brand`, `leads`, `research`, `outreach`, `outcomes`, `billing`, `admin`. A module calls another module's service functions, never its tables. Module folders are created in the phase that first needs them, not ahead of time.
4. **Every outside service sits behind an adapter.** `LlmProvider`, `DecisionProvider`, `PlacesProvider`, `GeoProvider`, `CrawlerProvider`, `EnrichmentProvider`, later `MailProvider`. Only adapters import vendor SDKs. Model names live in config.
5. **Pipelines are steps.** Each step saves input, output, cost and errors to `step_runs`, retries safely, and can be swapped without touching the others.
6. **Prompts are versioned files with typed outputs.** One file per prompt, with a Zod schema for its output. Every saved AI result records its prompt version. Prompts live in src/modules/<module>/prompts/<name>.v<n>.ts, each exporting the prompt and its Zod output schema.
7. **Limits are checked in one place.** `checkLimit(workspace, action)` reads the plan and the usage ledger before any paid action.
8. **Everything important becomes an event** in the append-only `events` table.
9. **Mobile-first UI.** Build every screen for a 380px width first, then widen. Tables become stacked cards on phones. Copy buttons and outcome buttons must be easy to tap. Check each screen at phone width before calling it done.
10. **The design folder is the visual spec.** design/ holds the screens, tokens and brand book exported from the design canvas. Colours, radii, shadows and fonts come only from design/tokens.json. Marketing pages sit in a Container (page 1280, wide 1440) with full-width backgrounds. The app fills the window, and its panes cap their own content (list 360 to 440, detail content 880, forms and reading 720). If code and design disagree, the design wins unless the spec says otherwise.

## Conventions in this repo
- Workspace routes live under `/api/w/:workspaceId`, behind `requireSession` and `requireWorkspace`. Handlers read the id with `currentWorkspaceId(res)`, never from the body.
- Queries live in `repo.ts` files with the signature `(db, workspaceId, ...)`. The only cross-workspace read allowed is `countActionAcrossWorkspacesSince` in the billing repo (the shared Google cap); do not add another.
- Every new repo file must register its queries with the leak test: put a `repo.leak.ts` beside the `repo.ts`, exporting `leakCases` with one case per exported query, each calling it with fixture arguments (see `test/leak-registry.ts`). A repo with no registration file, or a query missing from it, fails the leak test and the typecheck.
- Every new workspace-owned table needs a row in `seedFullWorkspace` (`test/helpers.ts`); the schema test fails until it has one.
- Capped vendor calls reserve their ledger row first (`reserveUsage`), call the vendor, then record the result (`settleUsage`). A failed call keeps its slot.
- Owner-only routes use `requireOwner`; members get 403. There is no dev-only router or flag: the Phase 0 test job is owner-only and stays on in production.
- Other modules import a module's `service.ts`, never its `repo.ts`.
- Write functions for shared tables go in files named `worker-writes.ts`; HTTP code may not import them.
- A pipeline is a function in `src/worker/pipelines/`, registered in its `index.ts`, that does its work through `step(...)`. Give a paid step its `paidAction` so the limit check and the ledger write happen for it.
- Places and geocoding are reached only through `places` and `geo` from `src/adapters/index.ts`, which write every call to the usage ledger. A step that calls them declares no `paidAction` (the type and `runStep` both refuse it), so a call is never counted twice.
- A paid step that can reuse an earlier result passes `reuse` in its step spec. It runs before the limit check, so a hit is allowed even over budget: no ledger row, cost 0.
- An adapter whose paid call was charged but whose answer can't be used (cut off, off-schema, refused) throws `PaidCallError` with the real cost; `runStep` writes it to the ledger as a failed row.
- A failure that retrying can't fix (site unreachable, no content) throws `PipelineError(code, message)`: the run fails at once with `{ errorCode }` in its output, and pg-boss does not retry it.
- Later phases read the seller's claims only through `getApprovedFacts` in the brand service.
- Every fetch of a user-supplied URL goes through `safeFetch` (`src/adapters/crawler/safe-fetch.ts`), which blocks private, loopback, link-local and internal addresses after DNS resolution.

## Stack
TypeScript everywhere. Next.js App Router, Tailwind, shadcn/ui. Express 5, Drizzle with plain SQL migrations, Postgres with pgvector, pg-boss, Better Auth, Zod, Playwright + Cheerio, Vitest. API and Postgres on Railway, web on Vercel Pro.

AI is the Claude API through the official Anthropic TypeScript SDK, inside the adapters only:
- `DecisionProvider`: Claude Haiku 5.5 for fit checks and routing, Claude Sonnet 5.5 for claim and draft checks, because Haiku's verdicts contradicted its own reasons on richer sites. The model is set per task in config. Use the Batch API when the result isn't needed right away.
- `LlmProvider`: Claude Sonnet 5.5 for opportunity cards and drafts, Claude Opus 5.5 for Brand DNA.
- Put Brand DNA and system prompts in a cached prefix (prompt caching).
- Keep Haiku prompts under 100K tokens; above that the price goes up.

## Money guardrails (non-negotiable)
- Every Google Places call goes through checkLimit. Hard stop on Text Search calls, set per environment in config: production 20 a day and 650 a month, development 10 a day and 300 a month. Together they stay inside Google Cloud's 30 a day, because local and production may share one Google key and can't see each other's ledger. When the cap is hit, the campaign pauses with a clear message. Google is never called past the cap.
- Places field mask is fixed to the fields listed in the spec's Lead sourcing section. Adding a field can move every call to a pricier tier, so field mask changes need a note in the PR.
- Every paid call (Claude tokens, Places, web search) writes its real cost to `usage_ledger`.
- Real Google calls (Places, Geocoding) from a local environment need `ALLOW_REAL_GOOGLE=true` on the command. Without it the app uses the fakes and the real adapters refuse to start, because a local ledger can't see production's calls against Google's shared 30 a day. Production needs no flag. Never put the flag in `.env`.
- API keys stay server-side, never in the browser or the repo. Use environment variables.

## Quality and compliance
- No claim without a source. Every opportunity and draft sentence links to a page in `sources` or an approved fact.
- "Not enough information" beats a guess.
- No LinkedIn scraping. Public websites, Google Places and approved APIs only.
- Suppression list checked before any draft is shown. Every email draft ends with an opt-out line and the sender's real business identity.
- Store place ids long-term; refresh other Places content per campaign.
- Never approve Brand DNA facts or drafts, promote leads, or log outcomes on a user's behalf. Those are human decisions. If a step needs one, stop and ask.
