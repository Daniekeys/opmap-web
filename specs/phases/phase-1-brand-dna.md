# Phase 1 - Brand DNA

Read: Core pipelines > 1. Brand DNA, Quality guardrails.

Build:
- Crawler adapter (Playwright + Cheerio), up to about 10 pages: home, about, services, portfolio, contact.
- Extraction with Claude Opus 5.5 to a fixed Zod schema: services, proof points, ideal clients, industries, tone, locations served. Cache the result; it changes rarely.
- Editable profile screen, approve-facts flow (one by one), profile versions.
- Explee described Daniekeys as doing "smart automation", which it no longer offers. The approve step exists to catch exactly that.

Done when: daniekeysstudios.com produces a profile you'd sign off on with fewer than five edits.
