# KAI — Contemporary Japanese Dining

**Independent concept project, designed and developed by INVITÉ Studio.**
KAI is a fictional restaurant. The site, menu, guests and bookings are invented;
no real reservation can be made.

A bilingual (EN / DE) single-page website for a contemporary omakase restaurant: an
interactive menu, a private dining enquiry, a visit and contact hub, and a booking flow
that works in three modes (portfolio demo, request by WhatsApp or email, or a link to the
restaurant's booking provider), plus a demo reservation dashboard. Static files only: no
backend, no database, no tracking.

| | |
| --- | --- |
| Pages | `/` (website) · `/demo-dashboard/` (fictional reservation dashboard) |
| Stack | HTML, CSS, vanilla JavaScript modules, GSAP 3 + ScrollTrigger |
| Build | esbuild (optional; the source also runs as-is) |
| Hosting | Any static host. GitHub Pages workflow included |

---

## Quick start

Requirements: Node.js 22 or newer.

```bash
npm install          # esbuild + sharp, only needed for build and image tools
npm run dev          # http://localhost:5173 — serves the source, no build step
```

No Node at hand? Any static server works on the project root, for example
`python -m http.server 5173`. (Opening `index.html` by double-click does not work for the
source because browsers block ES modules on `file://`; the **built** `dist/index.html` does open directly.)

| Script | What it does |
| --- | --- |
| `npm run dev` | Serves the project root on port 5173 (zero-dependency server) |
| `npm run build` | Bundles and minifies into `dist/` (fingerprinted JS/CSS, fonts) |
| `npm run preview` | Serves `dist/` on port 5173 |
| `npm test` | Unit tests: capacity rules, duplicates, validation, the menu file, opening hours, hand-off links, EN/DE key parity |
| `npm run test:e2e` | Browser smoke test (needs `npm i -D playwright && npx playwright install chromium`) |
| `npm run images` | Converts final photos in `images-src/` into the image slots |

## Project structure

```
index.html                  Website (EN markup; German applied at runtime)
demo-dashboard/index.html   Demo reservation dashboard
404.html  robots.txt
content/                    What the restaurant edits: no design or code knowledge needed
  menu.js                   Every dish, price, allergen and diet mark, EN and DE side by side
  restaurant.js             Opening days and hours, seatings, contact details, booking mode
  README.md                 Editing guide for owners and staff
assets/
  images/                   10 image slots (AI concept visuals, 1672 px masters) + README
  fonts/                    Manrope + Noto Sans JP, self-hosted WOFF2 subsets + LICENSES.md
  icons/  og/               Favicon, touch icon, Open Graph image
  vendor/gsap/              GSAP 3.13 + ScrollTrigger, self-hosted
src/
  css/
    main.css                Site entry (imports below)
    dashboard.css           Dashboard entry
    tokens.css              Palette, type scale, spacing, motion tokens
    fonts.css  base.css  layout.css
    components/             header, hero, philosophy, menu, space, private, booking, footer,
                            action-bar, buttons, lang-switch
  js/
    main.js                 Site entry
    dashboard.js            Dashboard entry
    i18n/                   Engine, locale registry, locales/en.js + de.js
    data/guests.js          Fictional guests for the demo dashboard
    demo/reservations.js    Demo store: seed data, availability, capacity, cancel, reset
    modules/                header, mobile-nav, language-switcher, theme, menu, visit,
                            private-dining, action-bar, animations
    modules/booking/        Booking flow (three modes), calendar, validation
    core/                   DOM, dates, storage, seeded random, GSAP loader,
                            schedule (opening hours as text), handoff (WhatsApp, email, phone links)
scripts/                    build, serve, optimize-images, image-slots, subset-fonts.py
tests/                      Unit tests (node:test) + e2e/smoke.mjs
docs/                       AUDIT.md, CASE-STUDY.md, TESTING.md
.github/workflows/          GitHub Pages deployment
```

## Deploying to GitHub Pages

**Recommended (built and minified):**

1. Run `npm install` once and commit the `package-lock.json` it creates, then push the
   project to a GitHub repository (branch `main`).
2. Repository **Settings → Pages → Source: GitHub Actions**.
3. Optional: **Settings → Secrets and variables → Actions → Variables**, add
   `SITE_URL` = `https://<user>.github.io/<repo>/`. The build then writes absolute
   canonical, `hreflang` and `og:image` URLs (needed for link previews).
4. Every push to `main` runs the tests, builds and publishes `dist/`.

**Without a build:** Pages can also serve the repository root directly
(Settings → Pages → Deploy from a branch → `/ (root)`). Everything works; files are
just not minified.

All paths are relative, so the site works in a sub-folder (`/repo/`) and on a custom
domain. `/demo-dashboard` is a real folder, so direct links and refreshes work on static hosting.

## Editing the menu, hours and contact details

Everything a restaurant changes week to week lives in `content/`: the menu in `menu.js`, and
opening days, hours, seatings, contact details and the booking mode in `restaurant.js`.
Opening hours are written out from those settings wherever the site shows them, in both
languages. `npm test` checks the menu file for missing translations, unknown allergen codes
and duplicate ids. Step-by-step guide: [`content/README.md`](content/README.md).

## Replacing the images

The ten image slots, their ratios and sizes are listed in
[`assets/images/README.md`](assets/images/README.md). They hold INVITÉ Studio's AI-generated
concept visuals, cropped from 1672 × 941 px masters at their native resolution (nothing is
upscaled). That is sharp at normal sizes; for large and high-density screens, export bigger
versions (the slot sizes in the table) and replace them in either of two ways:

- **Drop-in:** overwrite `assets/images/<slot>.webp` with a WebP of the same name.
- **Automatic:** put originals in `images-src/` (`kai-hero.jpg`, `kai-chef.png`, …) and run
  `npm run images`. They are smart-cropped to each slot's ratio, resized and saved as WebP.
  The phone hero is derived from `kai-hero` unless you provide `kai-hero-mobile`.

Crop focus is set per image with `style="--focus: 50% 50%"` in `index.html`; the hero also
has `--focus-mobile`. Image alt texts live in the locale files.

## Design system

- **Palette** (from the brief): ivory `#EDE9DF`, charcoal `#25251F`, stone `#8F8372`,
  sand `#B5AC96`, rust `#B75839`. Text tones are darkened variants that pass WCAG AA:
  `#5E564A` (6:1 on ivory), rust text `#9E4A2F` (5:1). Stone is used for decoration only.
- **Type:** one family, Manrope, in four upright weights: Light 300 for editorial headings,
  leads and the wordmark; Regular 400 for body text; Medium 500 for navigation, buttons
  and labels; SemiBold 600 only for the smallest marks (badges, tags, demo notices).
  Uppercase with wide tracking is kept for navigation, buttons, labels and eyebrows; the
  K A I wordmark is set wide (`--tracking-wordmark: 0.3em`). No italics anywhere: a
  `font-style: normal` house rule in `base.css` plus `font-synthesis: none`, checked by the
  e2e test. Japanese (会 and 一期一会) uses a three-character Noto Sans JP subset. Both
  fonts come from the Google Fonts library but are **self-hosted** (about 29 KB together),
  so visitors' browsers never contact Google, which matters under German data-protection
  rulings on embedded Google Fonts. A metric-matched Arial fallback keeps text from jumping
  while Manrope loads. The type scale and weight and tracking tokens are in `tokens.css`.
- **Grid:** 12 columns, generous section spacing. Section rhythm: dark hero → light
  philosophy and menu → dark "The Space" (the whole canvas cross-fades) → light
  private dining and reservations → dark footer with the visit and contact details.
- **Concept labels:** anything a real restaurant would supply (sample prices, contact
  details, a booking system) carries a small rust "Concept" tag where it appears.
- **Concept:** 会 (kai) means a meeting or gathering, the same character that ends
  ichigo ichie (一期一会, "one time, one meeting"). The Japanese is used once, explained,
  and marked up with `lang="ja"`.

All tokens are in `src/css/tokens.css`.

## Localisation

- Copy lives in `src/js/i18n/locales/en.js` and `de.js` (formal "Sie"). Markup opts in
  with `data-i18n`, `data-i18n-html`, `data-i18n-lines` (art-directed line breaks) and
  `data-i18n-attr` (alt, aria-label, placeholder, meta content).
- Switching is instant and keeps the scroll position, the open menu tab and every booking
  selection and typed value. The choice is remembered (localStorage) and reflected in the
  URL as `?lang=de`.
- Prices, dates, plurals and numbers use `Intl` with `en-GB` / `de-DE` (`€185` / `185 €`).
- **Adding a language:** copy `en.js` to `fr.js`, translate, register it in
  `src/js/i18n/config.js`. The switcher renders a button for every registered locale.
  `npm test` fails if any key or placeholder is missing.
- SEO: `<html lang>`, title, description and `og:locale` update on switch, and
  `hreflang` alternates point to `./` and `./?lang=de`. The German version is rendered
  client-side; for fully separate pre-rendered `/de/` pages, see Next steps.

## Booking modes

One booking component, three ways of working, set with `booking.mode` in
`content/restaurant.js`. None of them needs a backend.

| Mode | For | What happens |
| --- | --- | --- |
| `demo` (default) | This portfolio piece | Simulated availability, demo confirmation and the demo dashboard. Labelled as a demo at every step; nothing is booked. |
| `request` | Restaurants without a booking system | The same three steps (table, details, review), then the request is written out as a WhatsApp message or email that the guest sends from their own app. The restaurant confirms by reply. Nothing is stored or sent by the site. |
| `provider` | Restaurants that use OpenTable, SevenRooms, TheFork, Quandoo or similar | The form gives way to a button that opens the restaurant's page on that system. |

In the concept, a switch above the form lets visitors compare the three (`showModeSwitch`).
Parties above the online maximum are pointed to the **private dining enquiry**, which also
prepares an email or WhatsApp message rather than sending anything itself. Until the
restaurant's email and WhatsApp number are set, these messages open without a recipient,
and the site says so.

## Visit, contact and the mobile action bar

- The footer is a **Visit** hub: address, directions, opening hours, call, WhatsApp and
  email, all from `content/restaurant.js`. Empty details show as labelled placeholders,
  never as links to an invented number.
- On phones and tablets, a **Menu · Reserve** bar appears once the hero's buttons have
  scrolled away. It steps aside at the booking form, private dining, the menu's own Reserve
  prompt and the footer, shows only Reserve inside the menu, and respects safe areas.

## Demo booking and dashboard

Everything runs in the browser and is labelled as a portfolio demo before confirming.

- **Hours:** Tuesday to Saturday, closed Sunday and Monday. Bookable 60 days ahead.
- **Capacity model:** two seatings, start times 17:30 / 18:00 / 18:30 and 20:30 / 21:00 / 21:30,
  **9 seats per start time** (54 covers per evening), up to **8 guests** per booking.
  Same-day times close 60 minutes before they start. Configured in `content/restaurant.js`.
- **Availability** comes from fictional bookings generated per date (deterministic,
  busier towards the weekend, emptier further ahead) plus your demo bookings.
- **Rules enforced** (`src/js/demo/reservations.js`, unit-tested): no booking on closed or
  past days or beyond the window; capacity re-checked at the moment of confirming; a time
  that filled up is rejected and the guest is sent back to pick another; repeated clicks
  on "Confirm" return the same booking instead of creating a duplicate; cancelling frees
  the seats; completed bookings can't be cancelled.
- **Privacy:** demo bookings live in `sessionStorage` for the current tab only. The name is
  stored shortened (`Mariam K.`); email, phone and requests are never stored. Nothing is sent
  to a server.
- **Dashboard** (`/demo-dashboard/`): overview for any date (reservations, guests, seats
  left of 54, next 7 days), seatings chart, filters by date and status, search by guest or
  reference, details dialog, cancel, reset demo data. After a demo booking, "View in demo
  dashboard" opens that booking directly (`?ref=`). Marked noindex.

## Motion

GSAP 3.13 and ScrollTrigger ship with the site in `assets/vendor/gsap/` and are loaded by
`src/js/core/gsap-loader.js` once the page is usable. Because nothing comes from a CDN, the
motion also works offline and when `dist/index.html` is opened straight from the file
system, and the site makes no third-party requests at all. The site never waits for GSAP:
navigation, menu, language switch and booking work without it, and elements already on
screen are never hidden by an animation.

- One orchestrated moment: the hero (image settles from 112 % scale while a veil lifts, the
  wordmark letters rise out of masks, the rest follows).
- Quiet reveals after that: headings rise line by line, images open from the bottom, on large
  screens photos drift a few percent inside their frames.
- `prefers-reduced-motion`: no GSAP animation, no smooth scrolling, instant colour changes.
- Blocks that contain links or buttons fade with opacity only, never `visibility`, so the
  keyboard can reach them before they have been revealed; focusing one shows it at once.
- A failsafe shows the hero after 2.6 s if scripts are slow or blocked.
- If your operating system's "reduce motion" or "animation effects" setting is on, the site
  deliberately stays still. Turn animation effects on to see the motion.
- To update GSAP, see [`assets/vendor/gsap/README.md`](assets/vendor/gsap/README.md).

## Accessibility

Semantic landmarks and one `h1`; skip link; visible focus states; accessible menu tabs
(arrow keys, Home/End); calendar as a real table with one tab stop and arrow-key navigation;
native radio groups for guests and times; labelled fields with `aria-invalid`, inline errors
and an error summary; live announcements for availability and step changes; focus moved to
each step heading; mobile menu makes the page behind it `inert` and closes on Escape;
`<dialog>` for dashboard details and the private dining enquiry; the allergen switch is a
toggle button (`aria-pressed`); the mobile action bar is `inert` while hidden; touch targets meet WCAG 2.2 AA (24 px minimum, primary actions 44 px or more);
`lang` attributes for German and Japanese text. Contrast values are listed under Design system.

## Testing

`npm test` (35 unit tests) and `npm run test:e2e` (19 browser checks at 320–1440 px:
layout, a typography audit in English and German, language switching, menu tabs, the sticky
category bar and allergen switch, mobile menu, dark canvas, opening hours and contact
placeholders, the mobile action bar, the private dining enquiry, the request and provider
booking modes, keyboard access with motion on, the full demo booking flow, dashboard).
Results and what was not covered: [`docs/TESTING.md`](docs/TESTING.md).

## Known limitations and next steps

- **Image resolution:** the AI concept visuals are 1672 px wide masters. They are fine at
  normal sizes but slightly soft as a full-screen hero on large or Retina displays; a
  2400 px or wider hero (and slot-size versions of the others) would fix that.
- **German is client-rendered.** For separate indexable `/de/` pages, add a build step that
  pre-renders the German HTML.
- **Lighthouse:** not yet measured. Run it on the deployed site (Chrome DevTools →
  Lighthouse → Mobile) once the final photos are in.
- **Live availability:** the `request` and `provider` modes work for a real restaurant
  today. Instant confirmation against live availability on the site itself would need a
  reservation provider's API or a small backend; the demo store in
  `src/js/demo/reservations.js` already has the interface it would need (`availability`,
  `createReservation`, `cancelReservation`), so the UI would not change.
- **Before a real launch:** see the checklist in [`content/README.md`](content/README.md)
  (contact details, booking mode, Impressum and privacy policy, own photography, structured data).

## Credits and licences

Concept, art direction, copy and code: INVITÉ Studio. Imagery: AI-generated concept visuals
supplied by INVITÉ Studio; they depict a fictional restaurant and are labelled as such in
the site footer. Fonts: Manrope and Noto Sans JP, SIL Open Font License 1.1, see
[`assets/fonts/LICENSES.md`](assets/fonts/LICENSES.md). GSAP 3.13.0: GreenSock Standard
License (free, including commercial use), included unmodified in `assets/vendor/gsap/`.
