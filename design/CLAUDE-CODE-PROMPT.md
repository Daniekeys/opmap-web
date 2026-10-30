Read these before writing any code:

1. `design/HANDOFF.md` (what this folder is, the screen to route map, and how to read the .dc.html files)
2. `design/brand-book.md`
3. `design/tokens.json`
4. `specs/03-build-phases.md` (it lives in the opmap-api repo; if you can't see it, ask me for it), Phase 0, the parts about the shell, the workspace switcher, the progress panel and mobile-first layout
5. `CLAUDE.md`, especially rule 9 (mobile-first)

Task: rebuild the opmap-web UI so it matches the v2 design in `design/`. This is a design pass, not new features. Keep every existing route, data fetch, API call and behaviour. Change how things look and are laid out.

Do it in this order, and stop after each step to show me what changed:

1. Tokens. Put every value from `design/tokens.json` into the Tailwind theme and into the shadcn/ui CSS variables in `globals.css`. Load DM Sans with `next/font/google`. Remove any colours, radii, shadows or fonts that are not in the tokens. Restyle the shadcn primitives we use (Button, Input, Card, Badge, Dialog, Sheet, DropdownMenu) to match: near-black primary button, 6px control radius, 8px card radius, no resting shadows.
2. App shell. Rebuild the sidebar from `design/screens/Sidebar.dc.html` and the phone menu from `MobileMenu.dc.html`. Build at 380px first, then widen.
3. Screens, one at a time, in this order: Main (with MobileLeads and MobileDetail), Progress, BrandDNA, Segments, Composer (with MobileComposer), Pipeline. For each one, read the .dc.html file, map it to the existing route, and make the real screen match it. Use the sample data in each file's `renderVals()` only to understand what fields the screen shows. If a field doesn't exist in our API yet, render the empty or "not enough information" state and list the gap in your summary. Don't invent API endpoints.
4. Landing page at `/` for signed-out visitors, from `Landing.dc.html`, using the photos in `design/photos/` through `next/image`. Keep the interactive parts: the four-step how-it-works switcher, the "Type who you sell to" search with its example buttons, and the inline form in the closing sentence. Keep the scroll animations behind `@supports (animation-timeline: view())` and turn them off under `prefers-reduced-motion`.

Rules:
- Don't copy Explee's UI or copy. The only visual reference is `design/`.
- Don't add new dependencies without telling me why. Tailwind, shadcn/ui and lucide-react should be enough.
- Handle empty, loading and error states on every screen in the same visual language.
- Copy follows the brand book voice: sentence case, plain, specific, no em dashes, no emoji, no exclamation marks.

Before you start, state your plan: which existing files map to which design screen, what you'll change in each, anything in the design that our current data can't support, and any conflict between `design/` and the specs. Wait for my go-ahead.

Done when:
- Every screen in the route map matches its .dc.html board at 380px and 1440px widths, and you've checked each one in the browser at both sizes (screenshots in your summary if you can).
- No colour, radius, shadow or font in `app/` or `components/` is hard-coded outside the tokens (grep for `#` hex values and `shadow-` classes and show me the result).
- The landing page works with keyboard only, has accurate alt text on all five photos, and respects reduced motion.
- The app still passes its existing tests and the Phase 0 done-when check still holds: log in, switch workspaces, see a job in the progress panel.
