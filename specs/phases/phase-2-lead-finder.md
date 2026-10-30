# Phase 2 - Lead finder

Read: Core pipelines > 2, Lead sourcing, Data accuracy, Location. Image: `reference/diagrams/location-ladder-and-tile-search.png`.

Build:
- Campaign screen: business type, target kind (Haiku router, user can override), locations from `geo_areas` at any level.
- Seed `geo_areas` with Nigeria's 36 states, the FCT and their main towns. GeoProvider geocodes anything else and caches the boundary.
- Tile search: boundary to a grid of tiles about 4 km across, keeping only tiles that overlap the boundary circle or polygon (square corners dropped), Places Text Search restricted to each tile's rectangle, page to 60, split any tile that returns 60 into 4 (stop at about 250 m). AI neighbourhood queries run on top as extras.
- `search_coverage` written per tile and query; re-runs and expansions skip fresh tiles.
- Field mask limited to the Lead sourcing list (Enterprise tier). Drop non-operational businesses.
- Every Places call goes through checkLimit: hard stop at the per-environment cap (production 20 a day and 650 a month, development 10 a day and 300 a month), with "Paused until" and the time the cap lifts shown on the campaign in Lagos time (the daily cap lifts at midnight Pacific time, the monthly cap at the start of next month). Production resumes it by itself when the cap lifts; development only on an owner's Resume search, once the cap has lifted (judged by Postgres's clock).
- Dedupe on place id, normalised domain, E.164 phone, and fuzzy name within 200 m.
- Haiku fit filter on name and category, 20 businesses per call, through the Batch API when not urgent.
- For fit leads with a website: crawl it for emails, phones, `wa.me` links, socials, owner names and schema.org data. Everything lands in `contact_points` with source, confidence and label.
- For fit leads without a website: no search at lead-finding time (spec, Lead sourcing > Local business flow 6). When a user first opens the lead, the deep-dive runs one web search on the lead's phone number and name, and saves a social only if its cited text contains that phone, or names the business and its city. Built in Phase 2 as the `lead_socials` pipeline behind `research.openLead`; the Phase 3 lead page calls it.
- Cost estimate on the campaign confirm button (tiles x queries x pages).
- Added 2026-10-30: per-campaign search settings on the confirm panel (search budget, searches a day up to the shared cap, pages per tile 1 to 3, neighbourhood searches 0 to 3) with a live estimate; Edit campaign (search terms, places, settings) while draft, paused, stopped or failed; Stop search on a running or paused campaign, and Continue search on a stopped one. Owner only (spec, Location > Search settings, edit and stop).
- Leads table: name, category, city, rating and reviews, best phone, email and WhatsApp with their labels, fit, and a "Researched / Not yet" status so people know what opening a lead will do. On phones the table becomes stacked cards.

Done when: a campaign for one business type in Ilorin returns at least 50 deduplicated leads without passing the daily cap, and a manual check of 20 rows finds the contact labels honest.
