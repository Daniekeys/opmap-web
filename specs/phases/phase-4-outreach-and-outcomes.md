# Phase 4 - Outreach and outcomes

Read: Core pipelines > 4, Data accuracy, Location (Beyond Nigeria), Quality, cost and compliance guardrails. Image: `reference/explee/11-step6-email-draft-and-email-waterfall.png` (flow only).

Build:
- Four drafts per opportunity card with Claude Sonnet 5.5, written only when a member asks ("Write messages"), WhatsApp first, then email, LinkedIn DM and call opener (`outreach.drafts@1`). One run per card (`draft_sets`), saved, free to reopen, through `checkLimit`, cost in `usage_ledger`. No drafts for "Not enough information", a suppressed lead, or a lead with no send target.
- Every sentence is a claim citing an approved fact or a source or signal the card cites, or an ask that states no fact; kept claims are highlighted and open to what shows them. A card with no why or angle is written from its offer and gap only.
- Draft check: code removes a sentence naming a company, person, place, handle or web address not in the lead's evidence (the Explee sportsvot / Mix 'n' Bake bug), a claim with no valid cite, or a number nothing it cites shows; then Sonnet (`CLAIM_CHECK_MODEL`, the same per-task setting as card claim checks) judges each sentence (`outreach.draft-check@2`). A draft without a fact about the business, an offer and an ask is "Draft not ready".
- Sign-off with the workspace's real business identity (approved Brand DNA business name and website); every email ends with the country's opt-out line. Country rules for every country, with notes where the law asks for more (`outreach/countries.ts`).
- Send targets only from contact points labelled found, verified or confirmed (WhatsApp confirmed, email found or verified, LinkedIn verified); the Google Maps listing phone (single source) for the call opener only. Never a guessed email.
- Copy buttons, `wa.me` links with the text, Gmail and Outlook compose links, LinkedIn and tel links. Each is an event; the first per channel is a "sent" outcome and moves a new lead to Sent.
- Outcome buttons (sent, replied, meeting, won, lost), data-feedback buttons (wrong number, bounced, not the owner) that lower that contact point's confidence on the shared record (`contact_feedback`, worker pipeline `contact_feedback`), and "They asked not to be contacted" (suppression list). Every tap is an outcome and an event.
- Pipeline view of a campaign's leads by stage. Suppression list checked before any draft is shown.
- Eval: `npm run eval:deepdive -- drafts` writes and checks the four drafts for the first card of each eval lead with cards and reports cost and time per lead.
- Mobile first: 380 px first, copy, WhatsApp and outcome buttons at least 44 px tall.

Done when:
- Drafts for 10 real leads pass a manual check: no claim without a source, no wrong company or person, opt-out on every email.
- Four drafts cost under $0.05 per opportunity and take under 1 minute.
- You contact 10 real leads using only the tool, and every outcome is logged. This is also when go-to-market stage 1 starts.
- All tests pass in both repos.
