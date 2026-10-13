# Explee flow breakdown (reference only)

Source: screen recording of explee.com/auto-gtm run on daniekeysstudios.com, Oct 11 2026 (2:50 long).
Screenshots: `reference/explee/01..14`. Use these to understand the pipeline and UX patterns. Do not copy their UI, branding or copy.

## The shape of it

One input (a domain), then a 6-step agent run that the user watches live. Every step has its own URL phase, so the run is resumable and linkable:

```
/auto-gtm/company/{domain}/explore?phase=
  research_company_loading -> research_company
  research_competitors_loading -> research_competitors
  research_segments_loading -> research_segments
  outreach_companies_loading -> outreach_companies
  outreach_people_loading -> outreach_people
  outreach_emails_loading -> outreach_emails
  final
```

Layout: left sidebar = accumulating results + live agent log. Top = 6-step stepper. Main area = current step's output (or a social-proof card while loading).

## Step by step

### 0. Landing (01, 02)
- Single input: "Paste your website". Typing a partial name autocompletes to a domain (`daniekeys` -> daniekeysstudios.com, "Nigeria-b..."), so they have a company lookup behind it.
- "I don't have a website" fallback link. Worth copying, a lot of Nigerian SMEs we sell to won't have one.

### 1. Research your company (03, 04)
Agent log lines:
- fetching daniekeysstudios.com
- reading /pricing and /about
- extracting what you sell and to whom
- building the company profile

Output card: logo, name, domain, one-paragraph description, founded year (2025), headcount (12 emp), city (Ilorin), "More" expander.
Product block: product name ("AI-powered creative digital agency") + 4 value bullets.
Queries block: 3 search queries it will use to find competitors ("Nigeria digital agency", "African branding agency", "AI marketing agency Africa").

Note: the profile says "smart automation", which Daniekeys dropped from its services. It read a stale site and there's no confirm/edit step. We fix this.

### 2. Explore competitors (05)
- Log: "listing daniekeysstudios.com products..."
- Output: 14 competitor domains with favicons and external links, "+6 more", settings cog to edit.
- Used as input for ICP reasoning (who they sell to, how they position). Low direct value to the user.

### 3. Define campaigns (06)
Log: clustering use cases -> matching pains to buyers -> scoring 6 campaign ideas.

Output: 6 campaign (segment) cards, each with:
- name + icon + estimated company count (SME founders 1.2K, Retail ecommerce 900, Funded startups 650, Professional services 700, Education brands 450, Media creators 600)
- one-line offer for that segment with bold keywords ("Build **pitch-ready visuals**, **launch pages**, and **investor-facing storytelling**")
- PAIN: one line ("Great product, but weak market presentation")
- CRITERIA: 3 bullets ("Recently funded or scaling", "Launching new products", "Need investor-ready brand")
- example companies as chips (Cowrywise, Bamboo, PiggyVest, Spleet)

This is the strongest part of their product and the closest to our differentiator.

### 4. Find potential customers (07, 08)
Log: building search queries from campaigns -> querying the company index (312...) -> scoring fit for 1,284 domains.

Output table (only for the selected campaign, SME founders): checkbox, Company (logo, name, domain), Description (one AI line), Location (city, Nigeria), Size (headcount), Monthly traffic (with % change arrow). "+" to add columns.
For SME founders it picked almost all food businesses (snacks, bakeries, restaurants), clearly steered by the example chips.

### 5. Find decision makers (09, 10, 14)
Log: picking top companies from the list -> finding decision makers on LinkedIn -> verifying emails (78% deliverable) -> assembling the contact list.

Output table: Name (avatar + LinkedIn icon), Job title, Company (logo + domain), Geo. Column toggle: Email, Job title, Headline.

### 6. Write emails (11)
Log: picking the hottest lead -> reading their company signals -> drafting the first email -> personalizing the opener.

Left: contact cards with an email-finder waterfall. Each card shows provider chips (hunter, exreacher, findymail, leadmagic) with pass/fail state, then the result: an address + provider + status (`catch_all`), or "no email found". Lots of "no email found" for Nigerian SMEs.

Right: the draft. To, Subj, body, "Click to edit", settings cog, send button.

Actual draft it wrote:
> Subj: Cake and training brand
> Hi Olufunmilayo,
> Saw Mix 'n' Bake has been running since 2001, with cakes, desserts, events and baker training all under one name.
> I'm at Daniekeys Studios. We craft brand identities and websites for food businesses across Nigeria.
> Could you use a few plain ideas on how the cakes, training and events could pull in more orders when they reply?
> Best,

### Final (12, 13)
- Stepper ends at "6 Outreach ready". "What happens next": 7 Send emails, 8 Book meetings, 9 Learn and double down.
- Tabs: Companies / People / Emails, all browsable.
- Paywall modal: $30 free credits, card required (Stripe), then $0.04 per email. Promises ~2-3 replies, ~1-2 meetings. They send from their own pre-warmed domains "on behalf of" your domain.

## UX patterns worth keeping
1. One input, then a visible multi-step agent run with a live log. Feels like work is happening, makes waits tolerable.
2. Every step is editable before the next one consumes it (cog icons).
3. Phase in the URL, so runs are resumable and shareable.
4. Results accumulate in the sidebar as a running summary.
5. Segment cards with pain + criteria + examples.
6. Provider waterfall for contact finding with visible status per provider.

## Weak spots we design against
1. **Stale self-profile.** It trusted the website blindly. Our Brand DNA step has the user approve facts one by one, and only approved facts reach outreach.
2. **Wrong-company personalization.** The email went to the GM of sportsvot.com but talks about Mix 'n' Bake. Person and company signals were not cross-checked. A person is only attached when their source names the company, and every draft sentence maps to a source or an approved fact.
3. **Generic pitch.** "We craft brand identities and websites for food businesses" could go to anyone. No specific gap, no specific offer, no proof. This is the gap our tool exists to fill.
4. **Email-only.** Most Nigerian SMEs had no findable email. We draft email, WhatsApp, LinkedIn DM and a call opener, and label every contact detail honestly (see Data accuracy in 01).
5. **Competitors step** is mostly theatre for the user. We skip it in v1.
6. **Card before value.** Not relevant to v1 (internal). For the client version, show leads and a sample draft before any paywall.
