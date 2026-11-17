# Editing KAI's content

Two files in this folder hold everything a restaurant changes week to week. You don't need to touch the design or code to edit them.

| File | What it controls |
| --- | --- |
| `menu.js` | Every dish, set menu, price, allergen and diet mark, in English and German |
| `restaurant.js` | Opening days and hours, seatings, party size, contact details and how bookings work |

The page text (headlines, buttons, notes) is in the language files: `src/js/i18n/locales/en.js` and `de.js`.

## Workflow

1. Edit and save the file.
2. Run `npm test`. It checks the menu for missing translations, unknown allergen codes, duplicate ids and prices that aren't numbers, and tells you the exact dish if anything is wrong.
3. Look at the result with `npm run dev`, which serves the site at http://localhost:5173.
4. Publish with `npm run build` and upload the `dist/` folder.

## The menu (`menu.js`)

The three tabs, Omakase, À la carte and Drinks, are fixed. Inside each tab, `groups` are the headed lists, and each group holds `items`.

### Change a price

Find the dish and change the number. Write `18` or `18.5`, with no euro sign and no quotes. The site formats prices for each language: €18.50 in English, 18,50 € in German.

### Add a dish

Copy an existing dish from its opening `{` to its closing `},`, paste it where the new dish should appear, then change each value:

```js
{
  id: 'yuzuSorbet',                       // unique, letters and digits only
  name: { en: 'Yuzu sorbet', de: 'Yuzu-Sorbet' },
  description: {
    en: 'Yuzu juice and zest, frozen to order.',
    de: 'Yuzusaft und -abrieb, frisch gefroren.',
  },
  price: 9,
  allergens: [],                          // [] when none apply
  diet: ['VG', 'GF'],                     // optional
},
```

To remove a dish, delete its whole block, from `{` to `},`.

### Allergens and diet marks

Allergens use the 14 codes of EU Regulation 1169/2011. The site shows them in the reader's language when the guest turns on "Show allergens".

| Code | English | German |
| --- | --- | --- |
| `gluten` | Gluten | Gluten |
| `crustaceans` | Crustaceans | Krebstiere |
| `egg` | Egg | Ei |
| `fish` | Fish | Fisch |
| `peanuts` | Peanuts | Erdnüsse |
| `soy` | Soy | Soja |
| `milk` | Milk | Milch |
| `nuts` | Tree nuts | Schalenfrüchte |
| `celery` | Celery | Sellerie |
| `mustard` | Mustard | Senf |
| `sesame` | Sesame | Sesam |
| `sulphites` | Sulphites | Sulfite |
| `lupin` | Lupin | Lupinen |
| `molluscs` | Molluscs | Weichtiere |

Diet marks: `V` vegetarian, `VG` vegan, `GF` gluten-free.

Allergen information is a legal duty. The kitchen should check every entry before a menu goes live.

### Set menus and courses

Set menus (`sets`, Omakase tab only) have a price per guest and a number of courses. Courses inside a set are listed in a group marked `numbered: true`. They show as 01, 02, 03 and need no price.

## Restaurant settings (`restaurant.js`)

| Setting | What it does |
| --- | --- |
| `openWeekdays` | Days with service. 0 = Sunday, 1 = Monday … 6 = Saturday |
| `hours` | Opening and closing time, shown in the footer as "Tue – Sat · 17:30 – 23:00" and translated automatically |
| `seatings` | Start times guests can book, grouped into seatings |
| `seatsPerTime` | Demo mode only: simulated seats for each start time |
| `maxPartySize` | Largest party for an online booking. Larger groups are pointed to private dining |
| `bookingWindowDays` | How many days ahead guests can book |
| `sameDayCutoffMinutes` | Same-day times close this many minutes before they start |
| `contact` | Phone, WhatsApp, email, address lines and a maps link |
| `booking` | How the Reservations section works (see below) |

Opening days and hours are written out from these settings wherever the site lists them, so you only change them here.

### Contact details

Fill in what the restaurant uses. Each detail you add becomes a working button. A phone number becomes "Call", a WhatsApp number becomes a chat link, an email address becomes "Email" and `mapsUrl` becomes "Directions". Details left empty appear as labelled placeholders, never as a link to a wrong number.

```js
contact: Object.freeze({
  phone: '+49 30 1234 5678',
  whatsapp: '493012345678',               // digits only, with country code
  email: 'table@restaurant.example',
  address: Object.freeze(['Street 1', '10115 Berlin']),
  mapsUrl: 'https://maps.app.goo.gl/…',
}),
```

### How bookings work

Set `booking.mode` to one of three options. None of them needs a server or a database.

| Mode | For | What the guest does |
| --- | --- | --- |
| `'demo'` | The portfolio concept | Books against simulated availability and sees the demo dashboard. Nothing is booked. |
| `'request'` | Restaurants without a booking system | Picks a date, time and party size, then sends the request as a ready-written WhatsApp message or email. The restaurant confirms by reply. Needs `contact.whatsapp` and/or `contact.email`. |
| `'provider'` | Restaurants that already use OpenTable, SevenRooms, TheFork, Quandoo or similar | Continues to the restaurant's page on that system, which handles availability and confirmation. Set `providerName` and `providerUrl`. |

`showModeSwitch: true` shows a switch above the form so visitors to the concept can compare the three modes. Set it to `false` on a live site.

## Text that repeats a setting

A few sentences mention numbers or days in words. If you change the matching setting, update these in both `en.js` and `de.js`:

| Text key | Mentions |
| --- | --- |
| `hero.detail` | Opening days and first start time |
| `booking.lead` | Two seatings, opening days |
| `booking.guests.note`, `booking.facts.groupsText` | Maximum party size (8) |
| `private.lead` | Counter and dining room seats (10 and 18) |
| `philosophy.principles.hospitality.text` | Ten seats at the counter |
| `menu.sample` | Currency and service charge |

## Before a real restaurant goes live

- Set `concept: false` and fill in every contact detail.
- Choose the booking mode and set `showModeSwitch: false`.
- Remove the concept labels: search `index.html` for `concept-tag` and `concept-note`, and edit the sample-menu line, the footer "About this site" text and the portfolio wording in the hero.
- Remove the demo dashboard link and the `demo-dashboard/` folder if the demo mode is no longer used.
- Add the legally required pages for Germany: Impressum and Datenschutzerklärung.
- Replace the concept images with the restaurant's own photographs.
- Add `Restaurant` structured data with the real address and hours.
