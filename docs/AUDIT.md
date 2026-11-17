# KAI — Experience and conversion audit

29 October 2026 · Reviewed by INVITÉ Studio before the commercial update.

**Scope.** All code (HTML, CSS, JavaScript modules, data and locale files, tests), the site at
320, 375, 390, 768, 1024 and 1440 px in English and German, the demo booking flow and the
demo dashboard. Page structure was measured in headless Chromium.

**Question asked.** Would the owner of a premium restaurant pay for this website, and
would it bring them bookings? The brand experience says yes. The practical side did not
yet.

## Baseline

| Measure | Before |
| --- | --- |
| Page length, phone (375 px) | 10,618 px, about 13 screens |
| Page length, desktop (1440 px) | 8,613 px |
| Distance to the booking form, phone | 7,980 px from the top |
| Menu panel length, phone | 1,260–1,819 px per category, tabs scroll away |
| Allergen lines shown at once | 30 |
| Address, phone, email, WhatsApp, directions | none on the site |
| Actions in the first screen | one (Reserve a table) |
| Places to edit to change one dish | three files (structure, English, German) |
| Live booking path for a real restaurant | none (demo only) |
| Weight | JS 25 KB, CSS 9 KB (gzipped), fonts 29 KB, GSAP 46 KB (gzipped, after first paint), photos 700 KB lazy-loaded |

## What already works (keep)

- **Art direction:** Japanese minimalism, Manrope typography, warm photography, a dark
  "Space" chapter. It is a distinctive brand, not a template.
- **Bilingual from day one:** complete German, formal "Sie", locale-aware prices and dates.
- **A booking UX that respects the guest:** real calendar, live availability, clear errors,
  keyboard and screen-reader support. Demo labelling is honest and visible before confirming.
- **Fast and private:** self-hosted fonts and GSAP, no third-party requests, reduced-motion
  support.

## Findings

Priority: **1** = costs bookings or credibility now, **2** = weakens the pitch, **3** = polish.

| # | Area | Issue | Commercial impact | P |
| --- | --- | --- | --- | --- |
| 1 | Contact | No address, phone, email, WhatsApp or directions anywhere. Hours appear only deep in the page. | On a phone, "call" and "directions" are among the most common reasons to visit a restaurant site. Here they are impossible, and an owner notices at once. | 1 |
| 2 | Booking | The only booking path is a demo with simulated availability. A real restaurant would need a backend to use it. | The owner cannot picture launching it. No bridge to the booking system or the phone and WhatsApp habits they already have. | 1 |
| 3 | Mobile | The header hides while scrolling down, so the Reserve button disappears for most of the page. The booking form is 8,000 px down. | Intent is lost between reading and acting; guests have to scroll back up to book. | 1 |
| 4 | Hero | One action only. No path to the menu, and no opening times, in the first screen. | Most first visits are about the menu, price level and whether they are open. These guests must scroll about 2,700 px to find out. | 1 |
| 5 | Menu (mobile) | Category tabs scroll out of view. Switching from Omakase to Drinks means scrolling back up as far as 1,800 px. | Exploring the menu becomes tedious, so fewer guests reach the reservation step. | 2 |
| 6 | Menu | 30 allergen lines are always visible. Prices are not labelled as sample prices. | The carte reads like a spec sheet, not an invitation. Unlabelled fictional prices undermine the concept's honesty. | 2 |
| 7 | Menu data | Changing one dish means editing three files in two formats. | The owner cannot maintain it without the agency. Risk of English and German drifting apart. | 2 |
| 8 | Groups | No route for private dining or events. Online bookings stop at eight guests with no next step. | Group dinners are usually the highest-value enquiries, and here they have nowhere to go. | 2 |
| 9 | Navigation | "Home" duplicates the logo and "Reservations" duplicates the Reserve button. There is no way to reach contact details. | Two navigation slots are spent on nothing, and there is no route to "Visit". | 2 |
| 10 | Content | "Ten seats" or "nine metres" appears four times. "Kai means a meeting" appears twice. The Space intro repeats its own materials index. Hours appear in three places. | A longer page, slower scanning and diluted key messages. | 3 |
| 11 | Spacing | Section padding reaches 168 px, and empty bands appear between sections on desktop. | The page feels longer than its content, and booking is pushed further down. | 3 |
| 12 | Hours | Opening hours are typed in by hand in several places. | When the owner changes hours, the text goes out of date. | 3 |

Accessibility, internationalisation and performance had no blocking issues. They are listed
here because every change must keep them intact.

## What changed

| Finding | Change |
| --- | --- |
| 1, 12 | A **Visit** hub in the footer (address, directions, hours, call, WhatsApp, email) is driven by one settings file. The opening hours and seatings are written out from the opening days and times, in both languages. The two sentences that still name days in words are listed in `content/README.md`. Until real details are entered, the fields are labelled as concept placeholders, and nothing fake can be dialled or mailed. |
| 2 | **Three booking modes** in one component, set in `content/restaurant.js`. **Demo** is the portfolio showcase, unchanged and clearly labelled. **Booking request** uses the same three steps and then hands the request to WhatsApp or email, with the message written out; the restaurant confirms by reply. It needs no backend and no fees. **Booking provider** links to the system the restaurant already uses. In the concept, a switch lets owners compare all three. |
| 3 | A **mobile action bar** (Menu · Reserve). It appears after the hero, shows only Reserve inside the menu, steps aside at the booking form, private dining, the menu's own Reserve prompt and the footer, and respects safe areas and reduced motion. |
| 4 | **Hero:** "Reserve a table" stays the one button, now joined by a quieter "View the menu" link, and the essentials line includes the opening time. |
| 5, 6 | **Menu:** the category bar stays visible while scrolling; switching category returns to its top. Allergens are shown on demand, and the choice is remembered. The menu is labelled as a sample. A reservation prompt follows the menu. |
| 7 | **One menu file** (`content/menu.js`) holds every dish, price, allergen and diet mark, with both languages side by side. `npm test` checks it, and `content/README.md` explains how to edit it. |
| 8 | **Private dining** section with an enquiry that prepares an email or WhatsApp message. It is concept-labelled and promises no services the fictional restaurant has not defined. Parties above eight are pointed to it from the booking form. |
| 9 | **Navigation:** Philosophy · Menu · The Space · Private dining · Visit, plus the Reserve button. |
| 10, 11 | Repetition removed: "Kai means a meeting" now appears once (the kanji card), the Space intro is shorter and leaves the materials to their index, and the seat counts moved from the Space section to private dining, where they help a decision. The reservations aside lost its hours and capacity block to the Visit hub and a single seatings line; the footer's Hours and Index columns became Visit and Contact. Section spacing is tightened (at most 144 px instead of 168 px). |

## After the update

Measured the same way as the baseline (headless Chromium, reduced motion).

| Measure | Before | After |
| --- | --- | --- |
| Actions in the first screen | one | two: Reserve a table, View the menu, with the opening time beside them |
| Reserve within reach on a phone | only at the top and at the end of the page | from anywhere below the hero (action bar) |
| Menu panel length, phone | 1,260–1,819 px, tabs scroll away | 1,098–1,606 px, category bar stays in view |
| Allergen lines shown at once | 30 | none until "Show allergens", then all of them; the choice is remembered |
| Address, phone, email, WhatsApp, directions | none on the site | a Visit hub, with labelled placeholders in the concept |
| Places to edit to change one dish | three files | one (`content/menu.js`), checked by `npm test` |
| Live booking path for a real restaurant | none | request by WhatsApp or email, or a link to the restaurant's booking provider |
| Route for groups and private events | none | private dining enquiry, linked from the booking form |
| Page length, phone (375 px) | 10,618 px | 11,916 px |
| Page length, desktop (1440 px) | 8,613 px | 9,582 px |
| Reservations section, phone | 7,980 px from the top | 8,836 px from the top |
| Weight (gzipped) | JS 25 KB, CSS 9 KB | JS 31 KB, CSS 11 KB, plus one 82 KB image (lazy-loaded) |

The page is longer because private dining, the Visit hub and the mode switch are new.
Tighter spacing and the shorter menu absorb part of that. On phones the distance to the
booking form matters less now that Reserve stays within reach.

## Not changed, and why

- **Brand identity, photography and the demo dashboard** are already strong, so they are untouched.
- **No new dependencies.** Everything new is plain HTML, CSS and JavaScript.
- **Pre-rendered German pages, analytics and Lighthouse** remain launch tasks (below); they
  depend on the real domain and hosting.
- **No reviews, awards, credentials or results.** KAI is fictional; inventing proof would
  undermine the pitch.

## Before launch with a real restaurant

1. Fill in `content/restaurant.js` (address, phone, WhatsApp, email, booking mode, provider
   URL), set `concept: false` and `showModeSwitch: false`, and remove the concept labels.
   The full checklist is in `content/README.md`.
2. Add an Impressum and a privacy policy (mandatory in Germany).
3. Commission or supply photography at full resolution (at least 2400 px for the hero).
4. Add Restaurant structured data (schema.org) with the real address and hours.
5. Optionally, privacy-friendly analytics on the main actions (reserve, call, directions).
6. Run Lighthouse on the deployed site.
