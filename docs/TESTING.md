# Testing

Run on 29 October 2026 with Node 22 and headless Chromium (Playwright 1.63) on Linux, after
the commercial update (booking modes, private dining, Visit hub, menu file, mobile action bar).

## Results

| Suite | Command | Result |
| --- | --- | --- |
| Unit tests | `npm test` | **35 / 35 passed** |
| Browser smoke test, source | `npm run test:e2e` | **19 / 19 passed** |
| Browser smoke test, production build | `npm run build && npm run test:e2e -- dist` | **19 / 19 passed** |
| Reveal motion on the new sections (menu tools, menu prompt, private dining) | see Motion | **2 / 2 runs (390 and 1440 px): everything ends visible, no errors, no third-party requests** |
| Motion with the self-hosted GSAP 3.13.0 + ScrollTrigger, network blocked | see below | **6 / 6 runs: intro plays, everything ends visible, no errors, no third-party requests** |
| Animation code paths (GSAP API stand-in) | see below | **4 / 4 scenarios without errors** |

### Unit tests (`tests/*.test.js`)

- Seed data is deterministic and never exceeds 9 seats per start time (checked for 60 days).
- Closed days, past days and days beyond the 60-day window are refused.
- Same-day times inside the 60-minute cut-off are not offered.
- A booking reduces availability; a full time is refused with `full`; a party larger than
  the remaining seats is refused with `tooSmall`.
- Twelve rapid back-to-back bookings for one time stop exactly at capacity.
- Repeated submissions with the same submission id return the first booking (no duplicate).
- Cancelling frees the seats; completed bookings cannot be cancelled.
- Only a shortened name is stored; email and phone are `null`.
- Reset clears demo bookings and cancellations.
- Validation: names, email, phone (7–15 digits), request length, required date and time.
- English and German have identical keys, identical `{placeholders}` and the same number of
  art-directed heading lines; every allergen and diet mark is named in both languages.
- Every text key used in `index.html`, the dashboard and the 404 page exists in both
  languages, including the demo and request versions of texts that change with the booking
  mode; every mode has its notice and note.
- **Menu file** (`content/menu.js`, the file staff edit): three tabs; unique ids; set menus
  with names, notes, whole courses and prices; every group and dish in English and German;
  prices are positive numbers (only courses of a set may leave the price out); allergen and
  diet codes come from the official lists, with no duplicates.
- **Opening hours as text:** weekday runs (including Sunday wrapping to Monday), "Tue – Sat"
  and "Di – Sa", closed days, seatings in both languages.
- **Hand-off links:** WhatsApp keeps only digits and encodes the message; email links carry
  subject and body with `%20` rather than `+`, with or without a recipient; phone links keep
  `+` and digits.

### Browser smoke test (`tests/e2e/smoke.mjs`)

1–6. At **320, 375, 390, 768, 1024 and 1440 px**: no horizontal overflow, every image loads
     after scrolling, no script errors (motion allowed).
7. **Typography**, on the site at 320, 375, 1024 and 1440 px in English and German, the
   dashboard (German at 375 px, English at 1440 px) and the 404 page:
   - the self-hosted Manrope and Noto Sans JP files report `loaded`;
   - every element and `::before`/`::after` with content computes to `font-style: normal`;
   - all text is set in Manrope, and Japanese in Noto Sans JP;
   - only the weights 300, 400, 500 and 600 are used;
   - no art-directed heading line wraps.
8. EN → DE → EN: `lang` attribute, German statement and title, `185 €` vs `€185`,
   `?lang=de` in the URL, choice kept after reload.
9. Menu tabs by click and by arrow keys.
10. Mobile menu opens, makes the page behind it inert, closes with Escape.
11. Canvas turns dark while "The Space" is in the middle of the viewport, light again after.
12. Visit: footer hours written from the settings ("Tue – Sat · 17:30 – 23:00", "Sun and
    Mon · closed", and "Di – Sa · 17:30 – 23:00 Uhr", "So und Mo · Ruhetag" in German),
    seatings in the reservations aside, four labelled placeholders and no `tel:`, `mailto:`
    or WhatsApp link while the concept has no contact details; the hero links to the menu.
13. Menu at 375 px: allergens hidden by default; the category bar stays stuck to the top
    while a long category is read; "Show allergens" reveals them and the choice survives a
    reload.
14. Mobile action bar at 375 px: hidden over the hero, shown after it, Reserve only inside
    the menu, hidden at the booking form and the footer, never shown at 1280 px.
15. Private dining enquiry: opens as a dialog; a missing name blocks sending and moves
    focus to the field; the email link carries "Private dining enquiry: Celebration, 14
    guests" and a body with guests, name and message; the WhatsApp link carries the same
    message; the missing recipient is explained; Escape closes it.
16. Booking modes at 375 px: in request mode email and phone are optional, step 3 has no
    confirm button, the WhatsApp and email links carry the date, time, party size and name,
    the missing recipient is explained, and no demo booking is stored; provider mode hides
    the form and shows an inert link (no URL in the concept); demo mode starts again at
    step 1 with its demo notice.
17. Keyboard with motion on, at 1440 px: tabbing from the top reaches the menu's Reserve
    prompt, the private dining button and the larger-groups link before they have been
    revealed by scrolling (interactive blocks fade with opacity only and finish their reveal
    when focused), then the footer.
18. Booking at 375 px: empty-step error summary; date and time selection; three required
    field errors; invalid email and phone rejected; review shows the entries and the demo
    notice; switching to German on the review step keeps step and data; a **double click** on
    confirm creates exactly one booking; stored record has `name: "Ada E."` and no email;
    "View in demo dashboard" opens that booking; cancel changes it to Cancelled; reset
    clears the tab's demo data.
19. Dashboard: fictional-data banner, upcoming list, status filter, search with empty state,
    clear filters, four stats, and the direct link `/demo-dashboard` (no trailing slash).

Screenshots from each run are written to `tests/e2e/screenshots/`.

### Visual review

Screenshots at 320, 375, 390, 768, 1024 and 1440 px in English and German were checked by
eye: hero and wordmark, every section, mobile menu, booking steps 1–4, dashboard with the
details dialog, and the 404 page. After the commercial update: the hero's two actions at
375, 390, 768 and 1440 px in both languages; the header with five links at 1024, 1180 and
1280 px in German (no overlap); the menu with its sticky bar, allergen switch and closing
prompt; private dining and the enquiry dialog at 375, 768 and 1440 px; the mode switch and
all three booking modes, including the request message; the Visit footer at 375, 768 and
1440 px; the action bar on the light and the dark canvas; full-page views at 1440 px
(English) and 390 px (German).

### Motion

GSAP 3.13.0 and ScrollTrigger ship with the site (`assets/vendor/gsap/`). With every
request to another host blocked, the motion was filmed frame by frame at 1440 and 390 px in
three forms: the dev server, the built site opened straight from the file system
(`dist/index.html`), and the single-file preview page. In all six runs the hero intro played
(veil lifting, image settling, K A I rising out of its masks, then the statement and
button), the heading and image reveals ran on scroll, nothing was left hidden, shifted or
clipped, there were no script errors, and no request left the site.

An earlier round also filmed the intro, the line-by-line heading reveals and the image
reveals with the same GSAP files at desktop, phone and German desktop sizes.

The stand-in check from the first round still passes: desktop, phone, GSAP arriving 2.2 s
late, and a language switch mid-scroll.

After the commercial update, the reveals were checked again with motion allowed at 390 and
1440 px: the menu's sample line and closing prompt and every element of the private dining
section end fully visible, with no script errors and no request to another host.

Without GSAP the site is complete: every section is visible and every interaction works
(the smoke tests above run this way).

## Not covered

- **Lighthouse** scores were not measured (no network access to install it here). Measure on
  the deployed site: Chrome DevTools → Lighthouse → Mobile.
- **Safari and Firefox**: only Chromium was automated. The code avoids engine-specific
  features except registered custom properties (`@property`, for the dark-canvas
  cross-fade) and container queries, both supported in current Safari and Firefox. Variable
  WOFF2 fonts work in all current browsers.
- **Screen readers**: semantics and ARIA were checked in code, not with VoiceOver or NVDA.
- **Real hand-off apps**: the WhatsApp and email links were checked as URLs. Opening them in
  WhatsApp and in mail apps on real phones is left for the deployed site, with the
  restaurant's own number and address filled in.
- **Date field format**: the enquiry's date field uses the browser's own date picker, so
  its format follows the visitor's browser language rather than the site language.
- **Large screens**: the images are 1672 px masters, slightly soft as a full-screen hero on
  2560 px or Retina displays.

## Running the tests

```bash
npm install
npm test                         # unit tests
npm i -D playwright && npx playwright install chromium
npm run test:e2e                 # source
npm run build && npm run test:e2e -- dist   # production build
```
