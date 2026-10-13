# Phase 2 - Lead finder

Read: Core pipelines > 2, Lead sourcing, Data accuracy, Location. Image: `reference/diagrams/location-ladder-and-tile-search.png`.

Build:
- Campaign screen: business type, target kind (Haiku router, user can override), locations from `geo_areas` at any level.
- Seed `geo_areas` with Nigeria's 36 states, the FCT and their main towns. GeoProvider geocodes anything else and caches the boundary.
- Tile search: boundary to a grid of about 2 km in cities, Places Text Search restricted to each tile's rectangle, page to 60, split any tile that returns 60 into 4 (stop at about 250 m). AI neighbourhood queries run on top as extras.
- `search_coverage` written per tile and query; re-runs and expansions skip fresh tiles.
- Field mask limited to the Lead sourcing list (Enterprise tier). Drop non-operational businesses.
- Every Places call goes through checkLimit: hard stop at 950 a month and 30 a day, with "paused until tomorrow" shown on the campaign.
- Dedupe on place id, normalised domain, E.164 phone, and fuzzy name within 200 m.
- Haiku fit filter on name and category, 20 businesses per call, through the Batch API when not urgent.
- For fit leads: crawl the website for emails, phones, `wa.me` links, socials, owner names and schema.org data. For leads with no website, one Claude web search for their socials. Everything lands in `contact_points` with source, confidence and label.
- Cost estimate on the campaign confirm button (tiles x queries x pages).
- Leads table: name, category, city, rating and reviews, best phone, email and WhatsApp with their labels, fit, and a "Researched / Not yet" status so people know what opening a lead will do. On phones the table becomes stacked cards.

Done when: a campaign for one business type in Ilorin returns at least 50 deduplicated leads without passing the daily cap, and a manual check of 20 rows finds the contact labels honest.
