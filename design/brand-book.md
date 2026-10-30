# Opportunity Map

Opportunity Map finds the local businesses most likely to buy what you sell, shows what to offer each one with the proof behind it, and writes the WhatsApp message. This is its brand DNA: how it talks, how it looks, and the rules every screen and page follows.

"Opportunity Map" is a working name. The final name and logo come before the tool is sold under its own brand (go-to-market stage 3). Nothing here depends on the name.

Version 2 (30 October 2026) rebuilt the look against the taste-skill house rules: the cream ground and terracotta accent, the uppercase labels and the resting shadows are gone.

## Brand idea

**A sharp local guide who shows their working.** It knows the streets, it knows who needs you, and it never claims something it can't point to.

People should feel three things:

- **Found.** "159 bakeries in Lekki fit, and these 12 are your best bet." Real places, real numbers.
- **Trusted.** Every claim has its source a tap away. "Not enough information" is said out loud.
- **Ready.** The next step is always one obvious button: Open in WhatsApp.

It serves Nigerian SME sellers and agencies first, on phones between other work, and it must also hold up in front of clients and investors.

## The signature: the lit tile

The product searches a city by cutting it into map tiles. That grid is the brand's one shape: small square tiles in a neutral tint, with the tiles where buyers were found lit in raspberry. It is the logo's starting point, the empty state, the loading state, the campaign's coverage map and the frame inside the landing page headline. No pins, globes, rockets or sparkles anywhere.

## Voice

Plain, warm, specific. Like a smart colleague briefing you before a call.

- Lead with the fact, then the reason. "No online menu. Their bio says DM to order."
- Real numbers, places and names. Never "many businesses" when it is 47.
- Short sentences, sentence case everywhere, buttons that start with a verb ("Open in WhatsApp", "Approve fact").
- Say what the tool doesn't know. "We couldn't confirm an email. Use WhatsApp."
- No hype words, no exclamation marks, no emoji, no em dashes or en dashes.

| Instead of | Write |
| --- | --- |
| Unlock powerful AI-driven insights! | 3 opportunities for Crumbs and Co. |
| Error occurred | We couldn't load their website. Try again after 6 pm. |
| Lead score: 0.82 | Strong fit: bakery, 4.6 stars, no website |

## Colour

One neutral ground with a faint raspberry cast, near-black ink, and one hue, raspberry, used the way an accent ladder works: the full hue only on small marks, its pale tints on areas.

- **Ground and surfaces.** `ground` is the page, `surface` is cards and panels on it, `raised` is a quiet inset (an evidence quote, a key-value well). Surfaces separate by a 1px `border` or a tone step, never a shadow.
- **Ink.** `ink` for all running text and every number that matters. `muted` for secondary text only; it passes 4.5:1 on every surface.
- **Raspberry.** `accent` goes on data and small marks only: lit map tiles, the fit bar, the active nav icon, the selected tab underline, a sourced claim's underline. `accent-soft` and `accent-track` carry areas: the selected row, the active nav row, the evidence highlight. `accent-ink` is raspberry text on those tints.
- **Primary action** is `primary`, near-black, white label. One per screen. "Open in WhatsApp" is that button, marked with the WhatsApp glyph, not with a second green.
- **Status** comes as pale pairs: `positive` (confirmed, replied, won), `warning` (guessed, single source, paused), `negative` (wrong number, bounced, lost), `neutral` (not yet). Every status also carries its word.
- **Business monograms.** Six pale identity tints (`mono-1` to `mono-6` with their inks), picked by hashing the business name, at least 60 degrees apart. They are identity, never data, and stay out of charts.

Banned for this brand: cream grounds with terracotta or rust, violet and indigo, gradients, glows, glass, and colour on chrome.

## Type

One family: **DM Sans** (Google Fonts), 400, 500, 600 and 700.

- App screens: title 24 to 32px at 700, section 18px at 600, figures 24px, body 14 to 15px, small 12 to 13px. Tabular figures on every number that lines up or updates.
- Pages: display at clamp(56px, 9vw, 150px), 700, tracking -0.04em, leading 0.95; statements at 36px or less; body 17 to 19px.
- Labels are sentence case at 12 to 13px in `muted`. No tracked uppercase labels, no monospace.

## Shape and space

- 4px base. App gutter 24px, card padding 20 to 24px, rows 48px (72px with a monogram and a second line).
- Radius is tight and decided once: 6px controls and chips, 8px cards, square map tiles at 4px. Pills only for status.
- Shadows only on what floats: a popover, a menu, the mobile bottom sheet.

## Layout patterns

- **Desktop:** an open-plane sidebar on the ground (workspace switcher, campaigns with counts, Brand DNA, the Google search allowance), a list in the middle, and the chosen business in a bordered pane on the right.
- **Phone, 380px first:** a 48px top bar with a menu button and the screen name; lists become two-line rows; a chosen business opens full screen; the one primary action sits in a bar at the bottom in thumb reach.
- **Evidence:** a sourced claim has an `accent-soft` fill and an `accent` underline. Tapping it shows the quote, the page and the day it was read.
- **Progress:** the city's tile grid filling in, beside a short list of steps with a done, running or waiting mark.

## Iconography

Lucide outline icons at 16 to 20px, about 1.5px stroke, grey. Icons sit beside a word, never in a tinted square or circle. Channel glyphs (WhatsApp, email, call) are the only brand marks, one colour.

## Logo

No logo yet, on purpose. The wordmark is "Opportunity Map" in DM Sans 700 next to a 2x2 tile mark with the top-right tile lit in raspberry. When the name is chosen, draw the final mark from the lit tile; it must work at 16px as a favicon.

## Using this system

Tokens are named by role. Use `primary` for the one main button and `accent` only on data and small marks. Light is the first theme; dark exists for evening phone use. The app is Tailwind with shadcn/ui: map these tokens onto its CSS variables and keep the names.
