# Phase 0 - Foundation

Read: Overview, Scope, Architecture, Design rules, Tech stack, Data model.

Build:
- Two repos. `opmap-api` (Node + Express 5, with the pg-boss worker in the same process, plus the specs) is built first. `opmap-web` (Next.js App Router, Tailwind, shadcn/ui) follows once the API can log a user in. Zod schemas live in the API repo; the web repo keeps a typed copy of the ones it uses.
- CLAUDE.md is already in the repo root; keep it updated as rules change.
- Postgres on Railway with pgvector. Drizzle schema and plain SQL migrations for every table in the Data model (including `contact_points`, `geo_areas`, `search_coverage` and `invites`, plus Better Auth's own tables).
- Workspace isolation in the data layer: every query function takes a workspace id, and a test suite fails if any query returns another workspace's rows. Shared tables (`businesses`, `sources`, `signals`, `contact_points`, `geo_areas`, `search_coverage`) are readable by all workspaces and written only by the worker.
- Better Auth inside the backend, invite-only. Workspace switcher. Seed: Daniekeys and Afriment workspaces, Internal, Free and Pro plans, and three accounts (Daniel as owner of both workspaces, one member login each for Daniekeys Studios and Afriment). Others are added later through the invite flow.
- Mobile-first layout from the start: design for 380px width, then widen (CLAUDE.md rule 9). The shell, workspace switcher and progress panel must work on a phone.
- `pipeline_runs` and `step_runs` logging, and a live progress panel that reads `step_runs` (feel of `reference/explee/03-step1-agent-log-research-company.png`, our own styling).
- Every adapter as an interface with a fake implementation: LlmProvider (Claude Sonnet and Opus), DecisionProvider (Claude Haiku), PlacesProvider, GeoProvider (geocoding), CrawlerProvider, EnrichmentProvider (Claude web search), MailProvider (later).
- `checkLimit(workspace, action)` and the usage ledger, including the global Google call caps (per environment since 2026-10-26: production 20 a day and 650 a month, development 10 a day and 300 a month) even though Places is still faked.
- Deploy `opmap-api` and Postgres to Railway, and `opmap-web` to Vercel Pro. Vercel forwards `/api/*` to the API's public URL so cookies and login work without CORS.

Done when: you log in on the live URL, switch between the two workspaces, a test job runs in the worker and shows in `step_runs`, and the workspace leak tests pass.
