# Costs, free tiers and caps

Prices checked October 2026. They change, so recheck the source links before relying on a number.

## What we pay for

| Service | Free part | Paid rate | Who pays |
|---|---|---|---|
| Claude API | $1,000 in credits we already have | Haiku 5.5 $0.10 / $0.50, Sonnet 5.5 $2 / $10, Opus 5.5 $4 / $20 per million tokens (input / output). Batch API 50% off. Web search $10 per 1,000 searches | Claude credits |
| Google Places Text Search Enterprise (phone, website, rating) | 1,000 calls a month | $35 per 1,000 calls up to 100,000 | Card on file, $0 if we stay under the cap |
| Google Places Text Search Pro (no phone or website) | 5,000 calls a month | $32 per 1,000 | Card on file |
| Google Geocoding | 10,000 calls a month | $5 per 1,000 | Card on file |
| Railway | $5 one-time trial for 30 days, then $1 a month | Hobby $5 a month, which includes $5 of usage. RAM $10 per GB-month, CPU $20 per vCPU-month | Card |

Notes:
- The old Google Maps $200 monthly credit ended on February 28, 2025. Free usage caps per SKU replaced it, and they don't pool.
- Claude credits can't pay Google or Railway.
- Check in the Claude Console whether the credits have an expiry date.

## One Google search
- One Text Search call returns one page of up to 20 businesses. The next page needs another call, up to 3 pages and 60 results.
- The most expensive field in the field mask sets the price for the whole call. Asking for phone, website or rating makes it Enterprise.
- One record has: place id, name, address and parts, coordinates, category, business status, phone, website, rating, review count, opening hours, Maps link.
- No emails, owner names, Instagram or review text. Our crawler and web search fill those.
- Realistic yield: about 12 to 15 new businesses per call, so the free 1,000 calls give roughly 12,000 to 15,000 businesses a month.

## Sample campaign: bakeries and cake shops in Ilorin

| Step | Volume | Cost |
|---|---|---|
| Geocode Ilorin | 1 call | $0 |
| Tile search | About 80 Places calls | $0 (inside the free 1,000) |
| Dedupe | About 300 listings to 180 businesses | $0 |
| Haiku fit check | 9 calls, about 140 pass | $0.006 |
| Website crawl for contacts | 42 sites | $0.08 |
| Socials lookup | 98 web searches | $1.18 |
| Deep-dives (Sonnet + Haiku checks) | 50 leads at about $0.04 | $2.00 |
| Drafts, 4 per lead | 50 leads at about $0.025 | $1.25 |
| Total | | About $4.52 of Claude credit |

A fully worked lead (deep-dive plus 4 drafts) costs about 6.5 cents. Brand DNA is about $0.15 per workspace.

## Monthly picture
- Normal (8 campaigns): about $45 of Claude credit and about 640 Google calls. The credit lasts about 2 years.
- Heavy (20 campaigns, 100 deep-dives each): about $165 of Claude credit a month, so about 6 months. It also needs about 1,600 Google calls; the 600 over the free tier cost about $21 in cash.
- Railway: about $9 to $12 a month for `api` with the worker and Postgres. `web` is on Vercel Pro.

## Caps that keep it at $0
1. Maps lives in its own Google Cloud project (`opmap-maps`).
2. Our code: checkLimit stops at 950 Text Search calls a month and 30 a day, counted in America/Los_Angeles time because that's when Google resets its quotas. This is the real guarantee.
3. Google Cloud quotas: Text Search set to 10 per minute and 30 per day.
4. A $1 budget with alerts, scoped to `opmap-maps` only. The optional kill switch or a spend cap is still open. Billing data can lag up to 48 hours, so this is the last line, not the main one.
5. API key restricted to Places API (New) and Geocoding, server-side only.
6. A monthly spend limit in the Claude Console.

## Sources
- [Claude API pricing](https://platform.claude.com/docs/en/about-claude/pricing)
- [Google Maps Platform pricing list](https://developers.google.com/maps/billing-and-pricing/pricing)
- [Google Maps Platform billing overview](https://developers.google.com/maps/billing/overview/)
- [Places Text Search (New)](https://developers.google.com/maps/documentation/places/web-service/text-search)
- [Places usage and billing](https://developers.google.com/maps/documentation/places/web-service/usage-and-billing)
- [Manage Google Maps Platform costs](https://developers.google.com/maps/billing-and-pricing/manage-costs)
- [Disable billing with notifications](https://docs.cloud.google.com/billing/docs/how-to/disable-billing-with-notifications)
- [Railway pricing plans](https://docs.railway.com/reference/pricing/plans)
- [Railway free trial](https://docs.railway.com/reference/pricing/free-trial)
- [Railway serverless](https://docs.railway.com/deployments/serverless)
