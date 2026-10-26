# Opportunity Map v1 Build Spec

2026-10-06 · @danilo

Source of truth is this file in the opmap-api repo. The old live doc is retired.

## Overview

Version one is an internal tool that tells a business exactly what to offer each lead, with evidence, and writes the outreach for them to copy. It runs for two workspaces, Daniekeys Studios and Afriment, with a handful of team users. "Opportunity Map" is a working name.

The flow in one line: describe your business or paste your website, approve your Brand DNA, pick from buyer segments the tool suggests (or type your own), choose places, get leads ranked by how likely they are to buy, open one to see what to offer and a ready message, send, and tap what happened.

**Success targets for v1** (adjust after the first week of real use)

- Daniekeys and Afriment each run at least two campaigns through it
- At least 90% of claims on a 30-card spot check are correct and backed by their cited source
- A lead deep-dive finishes in under 2 minutes
- A lead deep-dive costs under $0.10 on average
- Outcomes (sent, replied, meeting, won) are logged for most leads that get contacted

The architecture is built for many workspaces, plans and channels from day one, but only the screens v1 needs get built.

## Scope

V1 builds six user-facing features and the full foundation underneath. Everything in the "Later" column gets its tables or interfaces now, but no screens.

| Area | In v1 | Later |
| --- | --- | --- |
| Access | Invite-only login, workspaces, roles (owner, member) | Public signup, access code redemption screen |
| Brand DNA | Crawl website or a written description, extract profile, edit, approve facts | File uploads (portfolio, price list) |
| Lead finder | Buyer segment suggestions from Brand DNA, leads ranked by buyer signals, Google Places search by business type and city, dedupe, quick fit filter | Signal triggers, people-data APIs for B2B, more countries |
| Deep-dive | Website crawl, signals, opportunity cards with evidence and confidence | Review text analysis, Instagram signals, website audit |
| Outreach | Email, WhatsApp, LinkedIn DM and call opener drafts. Copy buttons. Open in Gmail or Outlook compose links | Connected mailboxes, sending, follow-up sequences, reply inbox |
| Outcomes | Sent, replied, meeting, won, lost buttons. Simple pipeline view | Reply nudges, learning loop that reweights segments |
| Admin | Workspaces, users, usage and cost per workspace | Access codes, manual payments, plans editor |
| Billing | Plans and usage limits enforced in code (Internal plan only) | Paystack, Free and Pro tiers live |
| Future bets | Every analysis and outcome saved as events | Personalized creative per lead, matching network, data index, white-label |

## Architecture

> Diagram: [reference/diagrams/architecture.png](../reference/diagrams/architecture.png) (outdated: shows one app and no GeoProvider)

The web app never calls a vendor directly. It queues jobs in Postgres, the worker runs them through adapters, and results land back in the database for the screens to show.

## Design rules that keep it easy to extend

Nine rules keep the codebase simple today and open for new scope later. Put them in the repo's CLAUDE.md so Claude Code follows them in every session.

1. **Two repos, one database.** A modular monolith: two repos, `opmap-web` (the Next.js frontend) and `opmap-api` (one Node backend service that serves the API and runs the background worker), sharing one database. The API repo holds the specs and owns the data contracts. No microservices.
2. **Workspace on everything.** Every business table carries `workspace_id`. All queries go through a data layer that requires a workspace, and tests fail if any query can read another workspace's rows.
3. **Modules own their data.** Code lives in feature modules (`brand`, `leads`, `research`, `outreach`, `outcomes`, `billing`, `admin`). A module calls another module's service functions, never its tables directly.
4. **Every outside service sits behind an adapter.** `LlmProvider`, `DecisionProvider`, `PlacesProvider`, `GeoProvider`, `CrawlerProvider`, `EnrichmentProvider`, and later `MailProvider`. The rest of the code never imports a vendor SDK. Swapping a vendor means writing one new adapter and changing config.
5. **Pipelines are steps.** Each pipeline is a chain of small jobs. Every step saves its input, output, cost and errors to `step_runs`, can retry safely, and can be added or swapped without touching the others.
6. **Prompts are versioned files with typed outputs.** Each prompt lives in its own file with a Zod schema for its output. Every saved AI result records its prompt version, so changes can be compared.
7. **Limits are checked in one place.** One function, `checkLimit(workspace, action)`, reads the workspace's plan and the usage ledger. The Internal plan is unlimited. Turning on paid tiers later changes data, not code.
8. **Everything important becomes an event.** An append-only `events` table records analyses, copies and outcomes. That table is the future learning loop and data index, collected for free from day one.
9. **Mobile-first UI.** Build every screen for a 380px width first, then widen. Tables become stacked cards on phones. Copy and outcome buttons must be easy to tap.

## Tech stack

Claude handles every AI step, paid from the $1,000 in Claude API credits. Railway hosts our own backend and Postgres at about $9 to $12 a month, and the frontend runs on the existing Vercel Pro plan.

| Layer | Choice | Note |
| --- | --- | --- |
| Language | TypeScript everywhere | One language for frontend, backend, worker and scripts. Node 24 LTS everywhere (local, Docker, Railway) |
| Frontend | Next.js (App Router) | Screens only. Every read and write goes through our backend API |
| Backend | Node.js with Express 5 | Our own API: auth, workspaces, checkLimit, and the adapters. The pg-boss worker runs in the same service to save hosting cost |
| UI | Tailwind CSS and shadcn/ui | Fast, consistent, easy for Claude Code to extend |
| Database | Postgres on Railway, with pgvector | Workspace isolation enforced in the data layer, with tests that fail on any cross-workspace leak |
| Auth | Better Auth, inside our backend | Invite-only in v1, sessions in Postgres |
| ORM and migrations | Drizzle | Plain SQL migrations kept in the repo |
| Job queue | pg-boss | Runs on the same Postgres, no Redis |
| Validation | Zod | Schemas for forms, API input and AI output live in `opmap-api`. `opmap-web` keeps a typed copy of the ones it uses. |
| Crawling | Playwright with Cheerio | Handles JavaScript-heavy sites, Cheerio for parsing |
| AI writing | Claude API: Sonnet 5.5 for opportunity cards and drafts, Opus 5.5 for Brand DNA, behind `LlmProvider` | Model names in config, never in code. Prompt caching on Brand DNA and system prompts |
| AI decisions | Claude Haiku 5.5, behind `DecisionProvider` | Fit checks, routing, claim and draft checks. Batch API (50% off) where it isn't urgent |
| Web search | Claude web search tool, behind `EnrichmentProvider` | Finds socials for businesses with no website |
| Tests | Vitest | Unit tests for services and adapters, plus an AI eval set |
| Hosting | Railway for `api` and Postgres; Vercel Pro for `web` | Two repos, deployed separately. `opmap-api` (backend plus worker) and Postgres on Railway. `opmap-web` (Next.js) on Vercel Pro |

## Data model

Twenty-eight tables, plus Better Auth's own (user, session, account, verification) cover v1 and the next two years of features. Tables marked "later" get created in phase 0 but stay empty until their feature ships, which is what removes the migration pain.

| Table | Module | Key columns | Why it exists |
| --- | --- | --- | --- |
| `workspaces` | access | name, slug, plan_id, settings, archived | One per company: Daniekeys, Afriment, future clients. An archived workspace is left out of the switcher; its rows and events are kept and its URL still works |
| `memberships` | access | user_id, workspace_id, role | Who belongs where, owner or member |
| `invites` | access | workspace_id, email, role, token_hash, expires_at, accepted_at | Invite-only access. Owners create a link and hand it over until MailProvider exists |
| `plans` | billing | name, limits (json) | Seeded with Internal, Free, Pro |
| `usage_ledger` | billing | workspace_id, action, quantity, cost_usd, status | Counts every paid action and its real cost. Places calls are written as `reserved` before the call and updated to `done` or `failed`; all three count toward the Google cap |
| `access_codes` | billing (later) | code, plan_id, expires_at, redeemed_by | Manual-payment unlocks |
| `payments` | billing (later) | workspace_id, amount, currency, reference, method | The manual payment log |
| `brand_profiles` | brand | workspace_id, version, source (website or description), website (null for a description), instagram, profile (json), status (draft, approved, archived, retired), retired_reason | Brand DNA, versioned so old analyses still make sense. A version read from another workspace's website is retired: kept for history, never used |
| `workspace_domains` | brand | workspace_id, domain (unique) | The websites a workspace's Brand DNA may be read from. The first workspace to crawl a domain holds it; another workspace's crawl of it is refused |
| `approved_facts` | brand | brand_profile_id, kind, text, source_url, added_by | The only claims the AI may make about the seller. Each one links to the page it came from, or names the member who typed it in (added_by) |
| `campaigns` | leads | workspace_id, name, segment, buyer_segment (json), name_words (json), locations, brand_profile_version, status | A search for one kind of business in some places, started from a buyer segment (as the user kept it) and the Brand DNA version it came from. name_words: the words its fit check classifies business names with, made from the segment |
| `buyer_segment_sets` | leads | workspace_id, brand_profile_id, brand_profile_version, segments (json), dropped (json), prompt_version, model, cost_usd | Up to 6 buyer segments suggested from one Brand DNA version: generated once per version and prompt version, then read from here |
| `businesses` | leads | place_id, domain, name, city, country, phone, website, rating, review_count, refreshed_at | One row per real business, shared across workspaces. Places fields get refreshed, not hoarded |
| `leads` | leads | workspace_id, campaign_id, business_id, fit_score, status | A business inside one workspace's campaign. Contact details live in `contact_points` on the business, never on the lead |
| `contact_points` | research | business_id, kind, value, source_id, confidence, status, checked_at | Every contact detail as a sourced, labelled claim. Shared across workspaces |
| `geo_areas` | leads | level, name, parent_id, country, bbox, population | The location ladder |
| `search_coverage` | leads | query, tile_bbox, geo_area_id, searched_at, result_count | Which tiles were searched and when. Shared across workspaces |
| `sources` | research | business_id, url, type, fetched_at, excerpt | Every page and listing the AI read, so every claim can point to one |
| `signals` | research | business_id, kind, value, source_id | Facts found: no website, a mobile layout tag, no order flow, an Instagram account, what they sell, who they serve. Each cites the source that shows it. Written as one set per read of the business and reused for 90 days |
| `deep_dives` | research | workspace_id, lead_id, run_id, status (running, done, failed), brand_profile_version, outcome (json), cost_usd, duration_ms, started_at, finished_at | One deep-dive of one lead. At most one running row per lead (a partial unique index), so two people opening a lead start one run. The newest done row is the lead's research; a refresh adds a row |
| `opportunities` | research | lead_id, deep_dive_id, rank, service, need, angle, confidence, evidence (json: every claim with what it cites), prompt_version | The opportunity cards |
| `outreach_drafts` | outreach | lead_id, opportunity_id, channel, subject, body, highlights (json), prompt_version | Email, WhatsApp, LinkedIn and call drafts |
| `outcomes` | outcomes | lead_id, type, channel, note, created_by | Sent, replied, meeting, won, lost |
| `suppression_list` | outcomes | workspace_id, email, domain, phone | People who opted out. Checked before any draft is shown |
| `mailboxes` | outreach (later) | workspace_id, provider, address, credentials (encrypted), daily_cap, warmup_stage | Connected email accounts |
| `pipeline_runs` and `step_runs` | core | type, status, input, output, error, cost_usd, duration_ms | Progress for the UI, debugging and cost tracking |
| `events` | core | workspace_id, type, entity_id, payload, created_at | The append-only log behind the learning loop and future index |

Every private table carries workspace_id, including child tables such as opportunities and step_runs.

One deliberate choice: `businesses` and its `sources` and `signals` are shared across workspaces, while everything a workspace creates (leads, opportunities, drafts, outcomes) is private to it. Two workspaces looking at the same bakery reuse the research, which saves money, but never see each other's pitches.

## Core pipelines

Four pipelines do all the work. Each runs in the worker as a chain of steps, and the UI shows live progress from `step_runs`, the same way Explee's pipeline log did.

**1. Brand DNA**

1. Crawl the seller's site (home, about, services, portfolio, contact, up to about 10 pages), or, if they have no website, extract from a short description they write or their Instagram bio and posts.
2. Extract a profile to a fixed schema: services, proof points, ideal clients, industries, tone, locations served
3. Show it in an editable form. The user fixes anything wrong
4. The user approves facts one by one. Only approved facts can appear in outreach

Facts can also be added by hand, with no crawl and no Claude call ("Add a fact" on the Brand screen). The fact goes into the open draft, or into a new draft made from the approved version: its approved facts are copied and stay approved, and the new fact is sourced to the member who typed it. Approving that draft asks only about the facts added since the last approval.

A version is only used (by segments, campaigns, deep-dives and outreach) when its source is the workspace's own: a website on a domain the workspace holds, or a description written in it.

**2. Lead finder**

1. The tool suggests up to 6 buyer segments from the approved Brand DNA, ranked by likelihood to pay. Each shows who they are, their Places search terms, the pain, what to pitch first, buyer signals, suggested places, and whether Places can reach them. A segment is "not reachable yet" only when Google Maps doesn't list its businesses as a business type; a filter Maps can't check (recently funded, hiring, launching) is shown as something to look for, never a reason to block the segment. Suggested places start where the facts say the seller is based, then add the cities where these buyers cluster when the seller serves the whole country. The user picks one, edits it, or types their own, then chooses locations. The chosen segment is saved on the campaign and feeds the lead ranking and the deep-dive.
2. The AI expands it into neighbourhood-level searches, for example "cake shop Bodija Ibadan"
3. Places Text Search runs each query, respecting the daily call cap
4. Results are deduplicated by place ID and saved to `businesses`
5. Claude Haiku reports what each business's name and category say; code settles the name from the campaign's own word lists (words that name this kind of business, and words for other kinds that rule a name out, made by Haiku from the segment and shown read-only on the campaign screen) and applies the category rubric. Only a business that passes the rubric (match or likely) becomes a lead and gets a buyer score from its reviews, rating, website and socials against the segment's buyer signals; one the user promotes by hand from the "possible" list keeps its score and is tagged "Promoted by you". Any other lead scores 0 and sits last.

**3. Lead deep-dive**

Trigger: the first time a user opens a lead (`research.openLead`). It goes through `checkLimit` before it starts, and the lead is claimed first (`deep_dives`), so two people opening it at once start one run. The result is saved, so opening it again costs nothing. A deep-dive older than 90 days offers a refresh button instead of re-running on its own. The lead page shows the run's steps from `step_runs` while it runs, and every step is timed there. The whole run should take under 2 minutes and cost under $0.10.

1. Crawl the lead's website if it has one: up to 8 pages in 45 seconds (the crawl is the slow part), and save every page read to `sources` with its text. A lead with no website of its own, or one whose site can't be read, gets the one social search instead (Lead sourcing, step 6)
2. Extract signals. Code checks: has a website, has a mobile layout tag (a viewport set to the device width; it only shows the page declares a phone layout, so it is named that way and no card may claim the site works well or badly on phones from it), has an order or booking flow on the pages read, social accounts. Claude Haiku says what they sell and who they serve, each with a word-for-word quote that code finds in its source, or it is dropped. The Google Maps listing is a source too. Signals and sources are shared across workspaces and reused for 90 days
3. Claude Sonnet matches the seller's approved facts (in a cached prefix) and the campaign's buyer segment (its pain and what to pitch first) against those signals and produces up to three opportunity cards: what to offer, the gap at this business, why it matters to them, the angle, a confidence level. Every claim cites what shows it: a source with a word-for-word quote, a signal, or an approved fact. Code drops evidence whose quote isn't in its source, an offer that cites no approved fact, and a gap that cites nothing about this business, so a generic pitch ("brand identities for food businesses") never survives
4. Claude Haiku checks each claim against what it cites, and each gap for being specific to this business. Unsupported claims are removed; a card that loses its offer, gap or angle is dropped. No card left, or too little data to start with (no website, no social, nothing said about what they sell, and fewer than 5 reviews, with no Sonnet call), produces a "Not enough information" card instead of a guess. The lead page shows each quote under its claim, with a link that opens the source page, and lists the claims that were removed

**4. Outreach and outcomes**

1. For the chosen opportunity, write four drafts: email, WhatsApp, LinkedIn DM and a call opener. Each sentence maps to a source or an approved fact, shown as highlights
2. The user copies a draft, or opens it in Gmail or Outlook through a compose link
3. Copying logs an event and moves the lead to "Sent"
4. The user taps replied, meeting, won or lost as things happen. Every tap becomes an outcome and an event

## Lead sourcing

A router picks the data source before any search runs, because local businesses, B2B companies and institutions live in different places. Claude Haiku classifies the campaign's target in one cheap call; the user can override it.

| Target kind | Examples | Primary source | Status |
| --- | --- | --- | --- |
| Local business | Bakeries, clinics, schools, salons, real estate | Google Places Text Search, then our crawler | v1 |
| B2B company | Startups, agencies, fintechs, SaaS | Web search API, then our crawler | Later (SearchProvider adapter stubbed in v1) |
| Institution | NGOs, government agencies, associations | Web search plus public directories | Later |

A buyer segment marked reachable is searched on Places as a local business whatever its industry: software companies, IT companies, tech hubs and fintechs with a Maps listing are found there. The B2B row covers the ones without a listing.

**Local business flow (v1)**

1. Places Text Search per search tile (see Location), with a field mask limited to: place ID, name, formatted address and address components, coordinates, primary type, phone, website, rating, review count, business status, Maps link.
2. Drop anything whose business status is not operational.
3. Dedupe and save to `businesses` (see Data accuracy).
4. Claude Haiku quick fit check on name and category, before any money is spent on the lead. Code settles the name signal from the campaign's word lists, made from its segment (words for this kind must be specific to it: words that commonly name other businesses too, like "auto", "store" or "market", are left out; a word for this kind of business names it, even next to another kind: "Cakes and Events"; only a word for another kind, such as "Events Palace", names another kind) and applies the rubric. The rubric must pass (match or likely) before the buyer score counts: code then scores each lead against the campaign's buyer segment (reviews, rating, website, socials, fit) and the leads table is ordered by it, with the top reason in plain words. A lead below likely scores 0 and sits last, unless the user promoted it by hand ("Promoted by you"), which keeps its score. The score is worked out again when enrichment finds a website or socials. The lead's note is Haiku's sentence on the name and category, followed by what the listing shows (reviews, website, socials), built by code from current data each time the lead is read.
5. For fit leads with a website: crawl up to about 10 pages and pull emails, phones, `wa.me` links, Instagram and Facebook handles, owner names from about or team pages, and schema.org LocalBusiness or Organization data.
6. For fit leads without a website: no search at lead-finding time. When a user first opens the lead, the deep-dive runs one web search on the lead's phone number and name (also when its website can't be read that day), and saves a social only if its cited text contains that phone (verified), or names the business and its city (single source).

No LinkedIn scraping. A decision maker's name comes only from the business's own pages, Google review owner replies, or (later) an approved people-data API.

## Data accuracy

Every contact detail is stored as a claim with a source, a date and a confidence, never as a bare value. This adds one table, `contact_points` (business_id, kind, value, source_id, confidence, status, checked_at), and the best value per kind is what screens show.

contact_points is owned by the research module because it references sources. The lead finder writes contact points through research's service functions.

**One identity per business.** Dedupe on place ID, normalised domain and E.164 phone, plus a fuzzy name match within 200 m, so "Mix n Bake Ilorin" and "Mix 'n' Bake Confectionery" stay one record.

| Detail | Sources, best first | Check | Labels shown |
| --- | --- | --- | --- |
| Website | Places, then search | Loads, and mentions the business name, phone or city. Facebook, Instagram, Linktree and other link-in-bio pages (about.me, beacons.ai...) are filed as socials, not websites. A short link (tinyurl, bit.ly...) is followed to where it lands first. Dead only when two checks at least 6 hours apart both fail, DNS failures included; a first failure of any kind is unverified, with a recheck queued | verified, unverified, dead |
| Phone | Places, their website, their Instagram bio | libphonenumber parse to E.164, mobile or landline | confirmed (2 sources agree), single source |
| WhatsApp | `wa.me` link on their site, in their Places listing, or in their bio | Never auto-pinged | confirmed (a `wa.me` link they published), likely (a mobile number with no `wa.me` link) |
| Email | Their own site, then pattern guess, then a paid finder (later) | MX check; paid verification only for fit leads | found on site, verified, catch-all, guessed |
| Person | About or team page, Google owner replies | Their source must name the company or domain | sourced, none |
| Socials | Their site, Places, one search | Handle bio mentions the business name or city | verified, unverified |

**Rules that keep it honest**

- When two independent sources agree on a value, its confidence goes up; when they disagree, both are kept and flagged.
- A guessed email is never shown as verified, and drafts only use emails labelled found or verified.
- A person is only attached if their source names the company. This is the check Explee's draft to sportsvot.com about Mix 'n' Bake failed.
- Places fields are refreshed per campaign; contact points older than 90 days are rechecked before use, and closed businesses drop out.
- Team feedback fixes the data: "wrong number", "bounced" and "not the owner" buttons lower that contact point's confidence on the shared business record, so every workspace benefits.
- The 20-lead eval set gains a contact check: target at least 90% of shown phones and emails correct on a monthly 30-lead spot check.

## Location

Location is a ladder from region down to neighbourhood. The user picks any level, and the tool always breaks it down to small map tiles before calling Google, because one Places search returns at most 60 results.

> Diagram: [reference/diagrams/location-ladder-and-tile-search.png](../reference/diagrams/location-ladder-and-tile-search.png)

Dense tiles keep splitting until each search returns fewer than 60 results; thin outskirts cost one search each.

**Tile search**

1. Get the chosen place's boundary from the Geocoding API and cache it.
2. Cut it into a grid of tiles about 4 km across, and keep only tiles that overlap the boundary circle or polygon. Dense tiles split under step 4, so the starting size only sets the cost of thin outskirts.
3. Run each query with the search restricted to that tile's rectangle, paging up to 60 results.
4. A tile that returns 60 splits into 4 and is searched again; a tile that returns fewer is done. Tiles stop splitting at about 250 m.
5. AI neighbourhood queries such as "cake shop Tanke Ilorin" run on top as extras, never as the only coverage, since the names can be wrong or patchy.

| Level | Example | How it runs |
| --- | --- | --- |
| Neighbourhood | Tanke, GRA | One or a few tiles |
| City | Ilorin | The whole city tiled |
| State | Kwara | Towns ranked by size (Ilorin, Offa, Omu-Aran, Jebba) and run in that order |
| Country | Nigeria | Cities ranked for the segment, run in waves; the next wave runs only if the last one produced fit leads |
| Region or global | Africa, UK, US | AI picks best-fit countries from Brand DNA, then the country flow runs per country |

**Beyond Nigeria.** Each country carries settings that change the run: search terms in the local language (French in Abidjan or Dakar), phone parsing, the currency and time zone used in drafts, and its privacy rules (NDPA in Nigeria, GDPR in the UK and EU, POPIA in South Africa), which set the opt-out wording and whether the market is allowed at all.

**Data model changes**

- `geo_areas` (id, level, name, parent_id, country, bbox, population): seeded with Nigeria's 36 states, the FCT and their main towns; other countries are geocoded on demand.
- `search_coverage` (query, tile_bbox, geo_area_id, searched_at, result_count): shared across workspaces like `businesses`, so expanding from Ilorin to Kwara only searches new ground and re-runs skip tiles that are still fresh.
- `campaigns.locations` is a list of `geo_areas` ids at any level.

**Cost before every run.** The campaign's confirm button shows tiles × queries × pages as a call count and cost, for example "Kwara bakeries: about 40 searches, inside the free tier". checkLimit and the Google Cloud quota cap still apply.

## Build phases

Six phases plus Phase 2.5, fed to Claude Code one at a time. Don't start a phase until the previous one passes its done-when test. Each phase is roughly 3 to 5 days of focused work, so v1 lands in about four to six weeks alongside your other work.

1. **Phase 0: Foundation.** Two repos. `opmap-api` first: Express 5 backend with the pg-boss worker in the same service, Postgres with pgvector on Railway, Drizzle schema for every table in this spec (including contact_points, geo_areas, search_coverage and invites, plus Better Auth's own tables), workspace-scoped data layer with leak tests, Better Auth invite-only login, seed data (Daniekeys and Afriment workspaces, the three plans, three accounts), `pipeline_runs` and `step_runs` logging, every adapter as an interface with a fake implementation, checkLimit and the usage ledger with the global Google call caps. Then `opmap-web`: Next.js shell, login, workspace switcher and live progress panel, mobile-first, forwarding `/api/*` to the API. Deploy `api` and Postgres to Railway and `web` to Vercel Pro.
   - Done when: you log in on the live URL, switch between the two workspaces, a test job runs in the worker and shows in `step_runs`, and the workspace leak tests pass.
2. **Phase 1: Brand DNA.** Crawler adapter, Brand DNA pipeline, editable profile screen, approve-facts flow, profile versions.
   - Done when: daniekeysstudios.com produces a profile you'd sign off on with fewer than five edits.
3. **Phase 2: Lead finder.** Places adapter, campaign screen, tile search with neighbourhood queries on top, geo_areas and search_coverage tables, contact_points with labels, daily cap, dedupe, Haiku fit filter, leads table view.
   - Done when: a campaign for one business type in Ilorin returns at least 50 deduplicated leads without passing the daily cap.
4. **Phase 2.5: Buyer segments.** Brand DNA from a written description (and an Instagram handle) when there's no website; up to 6 buyer segments from the approved Brand DNA (Opus, cached per Brand DNA version); the campaign screen opens on the segment cards; the chosen segment is saved on the campaign; fit check v5 (the category rubric, with word lists from the segment) decides which businesses are leads, and the buyer score ranks them by the segment's buyer signals. See `phases/phase-2.5-buyer-segments.md`.
   - Done when: Daniekeys and Afriment each get up to 6 segments from their approved Brand DNA that you'd use, a written description gives a usable segment list, and the Ilorin leads are ranked by buyer signals with a plain-words top reason and no non-bakery in the top 10.
5. **Phase 3: Deep-dive.** Lead page, signal extraction, opportunity cards with evidence, claim checking, the "not enough information" state.
   - Done when: 20 deep-dives run with no unsupported claims on a manual check, each under 2 minutes.
6. **Phase 4: Outreach and outcomes.** Four drafts per opportunity with highlights, copy buttons, Gmail and Outlook compose links, outcome buttons, pipeline view, suppression list check.
   - Done when: you contact 10 real leads using only the tool, and every outcome is logged.
7. **Phase 5: Hardening.** `checkLimit` on every paid action, usage and cost per workspace on an admin page, an eval set of 20 saved leads that reruns after any prompt change, error states, retries, and alerts.
   - Done when: a prompt change runs against the eval set and shows a side-by-side before and after, and the admin page shows each workspace's monthly cost.

After phase 5, Daniekeys and Afriment use it for real for two to four weeks before any new scope gets added.

## Adding features later

Every feature on the roadmap plugs into something v1 already has, so new scope means adding a module or an adapter, not reworking the core.

| Future feature | Already in v1 | What you add |
| --- | --- | --- |
| Connected mailboxes and sending | `MailProvider` interface, `mailboxes` table, drafts | Zoho, IMAP, Microsoft and Gmail adapters, a connect screen |
| Follow-up sequences | Drafts, outcomes, worker jobs | A `sequences` table and a scheduled job |
| Reply inbox | `mailboxes`, `DecisionProvider` | A sync job and an inbox screen, with Claude Haiku sorting replies |
| Access codes and manual payments | `plans`, `access_codes`, `payments`, `checkLimit` | An admin screen and a redeem screen |
| Paystack billing | Same tables as above | A webhook that does what the admin does by hand |
| Free and Pro tiers | `plans` and `usage_ledger` | New plan rows and a public signup page |
| New data source (Instagram, people data) | `EnrichmentProvider`, `sources`, `signals` | One adapter. Its findings flow into the same signals |
| WhatsApp follow-up | Channel field on drafts and outcomes | A WhatsApp Business adapter for opted-in contacts |
| Personalized creative per lead | Opportunities and Brand DNA | A creative module, for example Remotion teasers or homepage mockups |
| Learning loop | `events` and `outcomes` | A job that reweights segments and angles by reply rate |
| Data index and reports | Shared `businesses` and `signals`, `events` | Aggregate queries and a reports screen |
| Matching network | Brand DNA for every workspace, shared signals | A match job across workspaces, plus consent settings |
| White-label for agencies | Workspaces and memberships | A parent-agency layer and branding settings |

## Go-to-market

Sell the tool's results as a service first, give it to clients as a perk next, and launch subscriptions under its own brand only once paying clients prove it. The code is the same at every stage, because it is built around workspaces from day one; only who we sell to changes.

> Diagram: [reference/diagrams/go-to-market-stages.png](../reference/diagrams/go-to-market-stages.png)

Stage 1 is the one that brings in money soonest, so it starts the moment Phase 4 works.

| Stage | Who pays | What they get | Starts when | Why this order |
| --- | --- | --- | --- | --- |
| 1. Sell results | Businesses buying outreach from Daniekeys Studios | 50 researched leads with opportunity cards and ready messages, or the outreach run for them | Phase 4 works | Fastest money: no payments, trials or support to build. 50 fully worked leads cost about $3.25 in AI and fit inside the free Google calls |
| 2. Client perk | Daniekeys retainer clients | Their own workspace, with limits set by an access code | Month 2 | Makes Daniekeys stand out, and turns 5 to 10 clients into design partners who give feedback, testimonials and reply-rate data |
| 3. Own brand SaaS | Businesses worldwide | Free trial and paid plans | Paying clients, reply-rate data, and customers asking for self-serve | Needs its own name and domain: Google's startup program excludes agencies, and investors fund product companies |

**The free piece is a sales hook, not a free app.** Run the tool on a prospect's business and send them 5 leads with the messages already written. It costs about 30 cents and proves the value; thousands of free signups would burn the 1,000 free Google calls instead.

**Why not subscriptions first.** Self-serve means building payments, trials, abuse protection and onboarding, plus supporting strangers worldwide and funding every free user's Google calls. A SaaS with no users earns nothing for months, while the service can earn within weeks.

**Proof to collect from stage 1**

- Paying clients and revenue from results the engine produced
- Reply, meeting and won rates from the outcome buttons
- Testimonials from design partners
- Register the business name once revenue is steady; most grants, Paystack's full account and Google's startup program ask for it

**Payments when stage 3 opens.** Lemon Squeezy for international customers (it handles global cards and sales tax, and pays out to Nigerian banks), Paystack Starter Business for naira customers until registration, and manual access codes as the fallback.

## Quality, cost and compliance guardrails

These are built into v1, not added later, because they're what make the tool trustworthy enough to use with real leads.

**Quality**

- No claim without a source. Every opportunity and every draft sentence links to a page in `sources` or an approved fact. A quote from a source must appear in it word for word, checked in code
- An opportunity names a gap seen at this business, backed by its own sources or signals. The seller's facts alone never show a gap
- "Not enough information" is a valid answer, and it's always better than a guess
- Fixed output schemas, pinned model versions and a saved prompt version on every result
- The 20-lead eval set reruns after every prompt or model change

**Cost**

- Google Places daily and monthly caps in config, per environment (production 20 a day and 650 a month, development 10 a day and 300 a month), plus the quota cap in Google Cloud (30 a day) that the two share
- Every paid call writes its real cost to `usage_ledger`
- Research on a business is reused across workspaces and only refreshed when it's stale
- Claude Haiku filters cheaply before the expensive LLM calls run
- Hard monthly budget per workspace, checked by `checkLimit`

**Compliance**

- The suppression list is checked before any draft is shown
- Every email draft ends with an opt-out line and the sender's real business identity
- No LinkedIn scraping. Public websites, Maps and approved APIs only
- Place ids are stored long-term. Coordinates and other Places fields are refreshed or cleared within 30 days. Data our crawler finds on a business's own site is ours to keep.
- A privacy notice on the website explains data sources, use and opt-out, in line with Nigeria's NDPA
- API keys and future mailbox credentials are encrypted and never sent to the browser

## Open questions

- [x] What's the tool's real name? Working name stays Opportunity Map, repo codename `opmap`. Brand name decided before stage 3
- [x] Should a deep-dive run automatically on every lead, or only when someone opens it? Only when someone opens it. Automatic runs cost more, and most leads in a campaign never get contacted
- [x] Is version one desktop only, or does it need to work well on a phone too? Both. Mobile-first layouts, tested at phone width
- [ ] What is Afriment's first campaign: which kind of business or institution, and in which cities? (deferred until Phase 2)
- [ ] What is Daniekeys' first campaign: the segment and two or three cities? (deferred until Phase 2)
- [x] Who are the first users in each workspace, and who owns each one? Daniel owns both workspaces. One shared login per workspace (Daniekeys Studios, Afriment) as members, seeded from env. Real team members get their own accounts through invites later.
- [ ] Which approved facts can Daniekeys use from day one? (needed by Phase 1)
