# Opportunity Map design handoff (v2, 30 Oct 2026)

This folder is the source of truth for how opmap-web looks. It was exported from the Claude Design canvas "Opportunity Map app and landing design". Copy it into the opmap-web repo as `design/` and keep it there. When the design changes, re-export and replace the folder.

## What's in here

- `brand-book.md`: the brand DNA. Voice, colour, type, shape, layout rules, the lit tile signature. Read this first.
- `tokens.json`: every colour, radius, font size and spacing value. The Tailwind theme and shadcn CSS variables come from this file and nowhere else.
- `screens/*.dc.html`: one file per screen. Open them as text, not in a browser. See "How to read a .dc.html file" below.
- `screens/canvas.json`: the board list. Each board's `title` says what the screen is and its `w`/`h` say the frame size (1440x900 desktop, 390x844 phone).
- `photos/`: the five landing page photos, already cropped. Credits are in the landing footer and below.
- `screenshots/`: PNG exports of each board, if Daniel added them. Use them to check your result visually. If a screenshot and the .dc.html source disagree, the source wins.

## Screen to route map

| Board | What it is | Route in opmap-web |
| --- | --- | --- |
| Sidebar.dc.html | App shell navigation, shared by every desktop screen. `active` prop picks the highlighted item | `app/(app)/layout.tsx` |
| Main.dc.html | Campaign workspace: tile coverage map, lead list, open business with opportunity card | `/campaigns/[id]` |
| Progress.dc.html | Campaign running, live progress from `step_runs` | `/campaigns/[id]/progress` |
| Segments.dc.html | Pick a buyer segment from Brand DNA | `/campaigns/new` |
| BrandDNA.dc.html | Approve or remove extracted facts | `/brand` |
| Composer.dc.html | Message composer with drafts list | `/messages` |
| Pipeline.dc.html | Outcomes board: sent, replied, won, lost | `/pipeline` |
| MobileLeads.dc.html | Phone version of the campaign lead list | `/campaigns/[id]` at 380px |
| MobileDetail.dc.html | Phone version of an open lead | `/campaigns/[id]/leads/[leadId]` at 380px |
| MobileComposer.dc.html | Phone composer | `/messages` at 380px |
| MobileMenu.dc.html | Phone navigation sheet | app shell at 380px |
| Landing.dc.html | Public marketing page | `/` (signed-out) |

Route names are a suggestion. If the repo already has routes for these screens, keep the existing routes and restyle them.

## How to read a .dc.html file

They are plain HTML with inline styles plus a small template layer. Treat them as a precise visual spec, not as code to copy.

- `<x-dc>` wraps the markup. `<helmet>` holds fonts, keyframes and hover styles.
- `{{name}}` is a value returned by `renderVals()` in the `<script type="text/x-dc">` block at the bottom.
- `<sc-for list="{{rows}}" as="r">` is a `.map()` over that list. `<sc-if value="{{x}}">` is a conditional render.
- `<dc-import name="Sidebar" active="pipeline">` means "render the Sidebar component with this prop".
- The arrays in `renderVals()` are sample data. Their shape tells you what the real API response needs to carry. Never ship the sample names or numbers.
- Attributes like `hint-placeholder-count`, `hint-size` and `data-ui` are design-tool hints. Ignore them.

Every inline style value maps to a token. If you find a value that isn't in `tokens.json`, use the closest token and list it in your summary.

## Rules that make it look like this and not like a template

- Font is DM Sans (Google Fonts, weights 400, 500, 600, 700). Load it with `next/font/google`.
- Ground is `#FBF7F8`, cards are white with a `#EAE4E6` 1px border and 8px radius. No resting shadows. Shadows only on things that float: popovers, menus, bottom sheets.
- Primary buttons are near-black `#17131A` with white text. Raspberry `#B8336A` is for data and the lit tile, never for chrome or big buttons.
- Status pills: positive `#DCFCE7`/`#14532D`, warning `#FFFBEB`/`#92400E`, negative `#FFEDEA`/`#831C1E`, neutral `#F3F4F6`/`#374151`.
- Monogram tiles for businesses use the six mono tints in `tokens.json`, picked by a stable hash of the business id.
- KPIs are big type with a small muted label, not boxed stat cards.
- One page title plus one sentence that states the most important finding.
- Sentence case everywhere. No uppercase tracked labels, no eyebrow text, no 01/02/03 numbering, no gradients, no emoji, no em dashes in copy.
- Radii: 4 tile, 6 control, 8 card, 999 pill.
- Respect `prefers-reduced-motion` for every animation on the landing page.

## Product guardrails the UI must show

- Every claim on an opportunity card links to its source (page, listing or bio, with the date it was read).
- "Not enough information" is a real, visible state, not an empty card.
- Suppressed contacts never show a draft or a send button.
- The Google search usage line ("46 of 950 map searches used this month") reads from the usage ledger.

## Photo credits (Pexels)

Muhammad-Taha Ibrahim (street, Kawo, Kaduna), Abdulrahman Abubakar (aerial, Kaduna), VIVO Ken (bakery dough), Vurzie Kim (food stall, Kaduna), Segun Jana (Abeokuta at night). Alt text must stay accurate to where each photo was taken. Swap in Lagos photos when we have them.
