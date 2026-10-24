# Accounts setup

This replaces the OpenAI, TypeSafe Jev and Supabase steps in the earlier "Outreach Tool Pre-Build Setup Checklist". Do these before Phase 0.

## Claude Console (AI)
- [ ] Create a workspace for this tool, so its usage stays separate from other work
- [ ] Create an API key in that workspace. It goes in the backend's environment variables only
- [ ] Set a monthly spend limit on the workspace (start around $60 for the build month)
- [ ] Check whether the $1,000 credit has an expiry date, and note it in the decisions log

## Google Cloud (Places)
- [x] Create a new project used only for Maps (`opmap-maps`)
- [x] Billing account with a dollar card attached. Free usage still needs billing turned on. Pay as you go, no Maps subscription
- [x] Enable Places API (New) and Geocoding API. Not the legacy Places API, nothing else
- [x] One API key restricted to those two APIs, server-side only. Env var `GOOGLE_MAPS_API_KEY`, on the Railway `api` service and in `opmap-api/.env` only. Application restriction: none, because Railway Hobby has no fixed outbound IP
- [x] Quotas: Text Search 10 requests per minute and 30 per day
- [x] Billing > Budgets & caps: a $1 budget scoped to the opmap-maps project only, Alerts only, free tier credits counted, promotional credits excluded, alerts at 50%, 90% and 100% of actual spend
- [ ] Optional: check whether "Spend cap enforcement" in Budgets & caps supports Places API (New) and how it treats the free tier. If it does, a capped budget can replace the kill switch
- [ ] Optional: the kill switch that disables billing on this project when the budget is hit
- [ ] Confirm in Billing > Credits that the $30 credit is listed as promotional

## Railway (hosting)
- [ ] Sign up with GitHub and verify it, which unlocks the full trial instead of the limited one
- [ ] Create one project with two services: `api` (from the `opmap-api` repo) and Postgres. `web` is on Vercel Pro
- [ ] `api` stays awake because the worker polls the database
- [ ] Move to the Hobby plan ($5 a month) before the 30-day trial ends; trial volumes are deleted 30 days after credits expire

## GitHub
- [ ] Two private repos: `opmap-api` (gets `specs/`, `reference/` and `CLAUDE.md` from the repo pack) and `opmap-web` (gets a copy of `CLAUDE.md` and the spec)

## Later, not for v1
- Domain and email for the tool's own brand (needed for stage 3 and the Google for Startups application)
- Lemon Squeezy for international subscriptions, Paystack Starter Business for naira payments
- Business name registration once revenue is steady
