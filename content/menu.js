/**
 * KAI · MENU — the only file to edit when dishes, prices or allergens change.
 *
 * Everything the website shows in the Menu section comes from here, in both
 * languages side by side. Save the file, run `npm test` (it checks this file
 * for mistakes), then `npm run build` or simply reload `npm run dev`.
 * Step-by-step guide: content/README.md.
 *
 * Structure
 *   MENU.omakase / MENU.alacarte / MENU.drinks   the three tabs (fixed)
 *     sets     set menus with a price per guest (Omakase only)
 *     groups   headed lists, e.g. "Small plates"; each holds `items`
 *
 * Every dish (item)
 *   id           short unique name in English, no spaces: 'blackCod'
 *   name         { en: '…', de: '…' }
 *   description  { en: '…', de: '…' }
 *   price        euros as a number (18 or 18.5). Leave it out for courses
 *                that are part of a set menu.
 *   allergens    codes from ALLERGENS below; [] if none apply
 *   diet         optional: codes from DIETS below
 *
 * KAI is a fictional restaurant: this is a sample menu with illustrative
 * prices, and the website labels it as such.
 */

/** The 14 allergens of EU Regulation 1169/2011. Names in both languages live in the locale files. */
export const ALLERGENS = Object.freeze([
  'gluten', 'crustaceans', 'egg', 'fish', 'peanuts', 'soy', 'milk',
  'nuts', 'celery', 'mustard', 'sesame', 'sulphites', 'lupin', 'molluscs',
]);

/** V = vegetarian, VG = vegan, GF = gluten-free. */
export const DIETS = Object.freeze(['V', 'VG', 'GF']);

export const MENU = {
  omakase: {
    // Set menus: price per guest.
    sets: [
      {
        id: 'counter',
        name: { en: 'Counter omakase', de: 'Omakase am Tresen' },
        note: {
          en: 'Served at the counter in two seatings',
          de: 'Am Tresen serviert, in zwei Sitzungen',
        },
        courses: 17,
        price: 185,
      },
      {
        id: 'vegetable',
        name: { en: 'Vegetable omakase', de: 'Gemüse-Omakase' },
        note: { en: 'On request when you book', de: 'Auf Anfrage bei der Reservierung' },
        courses: 12,
        price: 145,
        diet: ['V'],
      },
    ],
    groups: [
      {
        id: 'sequence',
        title: { en: 'From this week’s sequence', de: 'Aus der Folge dieser Woche' },
        note: {
          en: 'Eight of the seventeen courses. The full sequence changes with the market.',
          de: 'Acht der siebzehn Gänge. Die vollständige Folge ändert sich mit dem Markt.',
        },
        numbered: true, // shown as 01, 02, … because these are courses of a set
        items: [
          {
            id: 'dashi',
            name: { en: 'Ichiban dashi', de: 'Ichiban-Dashi' },
            description: {
              en: 'First dashi of Rishiri kombu and freshly shaved katsuobushi, served in a small cup.',
              de: 'Erster Dashi aus Rishiri-Kombu und frisch gehobeltem Katsuobushi, in einer kleinen Schale serviert.',
            },
            allergens: ['fish'],
          },
          {
            id: 'chawanmushi',
            name: { en: 'Chawanmushi', de: 'Chawanmushi' },
            description: {
              en: 'Silken egg custard with snow crab and a little yuzu zest.',
              de: 'Seidiger Eierstich mit Schneekrabbe und etwas Yuzu-Abrieb.',
            },
            allergens: ['egg', 'crustaceans', 'fish', 'soy'],
          },
          {
            id: 'kinmedai',
            name: { en: 'Kinmedai', de: 'Kinmedai' },
            description: {
              en: 'Golden-eye snapper, the skin seared over binchotan, with ponzu.',
              de: 'Goldaugen-Schnapper, die Haut über Binchotan geflämmt, mit Ponzu.',
            },
            allergens: ['fish', 'soy', 'gluten'],
          },
          {
            id: 'hotate',
            name: { en: 'Hotate', de: 'Hotate' },
            description: {
              en: 'Hokkaido scallop with sudachi and sea salt.',
              de: 'Jakobsmuschel aus Hokkaido mit Sudachi und Meersalz.',
            },
            allergens: ['molluscs'],
          },
          {
            id: 'chutoro',
            name: { en: 'Chūtoro', de: 'Chūtoro' },
            description: {
              en: 'Medium-fatty tuna, aged six days, brushed with nikiri.',
              de: 'Mittelfetter Thunfisch, sechs Tage gereift, mit Nikiri bestrichen.',
            },
            allergens: ['fish', 'soy', 'gluten'],
          },
          {
            id: 'anago',
            name: { en: 'Anago', de: 'Anago' },
            description: {
              en: 'Sea eel, gently simmered, then glazed with its own reduction.',
              de: 'Meeraal, sanft geschmort und mit der eigenen Reduktion glasiert.',
            },
            allergens: ['fish', 'soy', 'gluten'],
          },
          {
            id: 'tamago',
            name: { en: 'Tamago', de: 'Tamago' },
            description: {
              en: 'Layered omelette with shrimp and yamaimo, served warm.',
              de: 'Geschichtetes Omelett mit Garnele und Yamaimo, warm serviert.',
            },
            allergens: ['egg', 'crustaceans', 'soy'],
          },
          {
            id: 'monaka',
            name: { en: 'Monaka', de: 'Monaka' },
            description: {
              en: 'Hojicha ice cream between crisp wafers of rice.',
              de: 'Hojicha-Eis zwischen knusprigen Waffeln aus Reis.',
            },
            allergens: ['milk', 'egg'],
            diet: ['V'],
          },
        ],
      },
      {
        id: 'pairings',
        title: { en: 'Pairings', de: 'Begleitung' },
        items: [
          {
            id: 'sakePairing',
            name: { en: 'Sake pairing', de: 'Sake-Begleitung' },
            description: {
              en: 'Six sakes by the glass, chosen to follow the sequence.',
              de: 'Sechs Sake im Glas, abgestimmt auf die Folge der Gänge.',
            },
            price: 95,
            allergens: [],
          },
          {
            id: 'teaPairing',
            name: { en: 'Tea pairing', de: 'Tee-Begleitung' },
            description: {
              en: 'Five infusions, alcohol-free, from gyokuro to roasted hojicha.',
              de: 'Fünf Aufgüsse, alkoholfrei, von Gyokuro bis gerösteter Hojicha.',
            },
            price: 55,
            allergens: [],
            diet: ['VG'],
          },
        ],
      },
    ],
  },

  alacarte: {
    groups: [
      {
        id: 'small',
        title: { en: 'Small plates', de: 'Kleine Gerichte' },
        items: [
          {
            id: 'edamame',
            name: { en: 'Edamame', de: 'Edamame' },
            description: {
              en: 'Steamed young soybeans, smoked salt.',
              de: 'Gedämpfte junge Sojabohnen, Rauchsalz.',
            },
            price: 7,
            allergens: ['soy'],
            diet: ['VG', 'GF'],
          },
          {
            id: 'agedashi',
            name: { en: 'Agedashi tofu', de: 'Agedashi-Tofu' },
            description: {
              en: 'Crisp silken tofu in warm dashi, grated daikon, chive.',
              de: 'Knuspriger Seidentofu in warmem Dashi, geriebener Daikon, Schnittlauch.',
            },
            price: 14,
            allergens: ['soy', 'fish', 'gluten'],
          },
          {
            id: 'shiitake',
            name: { en: 'Shiitake', de: 'Shiitake' },
            description: {
              en: 'Grilled over binchotan, white miso, sansho.',
              de: 'Über Binchotan gegrillt, weißes Miso, Sansho.',
            },
            price: 16,
            allergens: ['soy'],
            diet: ['VG'],
          },
        ],
      },
      {
        id: 'counter',
        title: { en: 'From the counter', de: 'Vom Tresen' },
        items: [
          {
            id: 'sashimi',
            name: { en: 'Sashimi moriawase', de: 'Sashimi moriawase' },
            description: {
              en: 'Five cuts of the day, fresh wasabi, aged soy.',
              de: 'Fünf Schnitte des Tages, frischer Wasabi, gereifte Sojasauce.',
            },
            price: 38,
            allergens: ['fish', 'soy', 'gluten'],
          },
          {
            id: 'tataki',
            name: { en: 'Kinmedai tataki', de: 'Kinmedai-Tataki' },
            description: {
              en: 'Seared golden-eye snapper, ponzu, finger lime.',
              de: 'Kurz geflämmter Goldaugen-Schnapper, Ponzu, Fingerlimette.',
            },
            price: 26,
            allergens: ['fish', 'soy', 'gluten'],
          },
          {
            id: 'nigiri',
            name: { en: 'Chūtoro nigiri', de: 'Chūtoro-Nigiri' },
            description: {
              en: 'Two pieces of medium-fatty tuna, brushed with nikiri.',
              de: 'Zwei Stück mittelfetter Thunfisch, mit Nikiri bestrichen.',
            },
            price: 18,
            allergens: ['fish', 'soy', 'gluten'],
          },
        ],
      },
      {
        id: 'warm',
        title: { en: 'Warm', de: 'Warm' },
        items: [
          {
            id: 'blackCod',
            name: { en: 'Black cod saikyo-yaki', de: 'Black Cod Saikyo-yaki' },
            description: {
              en: 'Marinated for three days in sweet white miso, then grilled.',
              de: 'Drei Tage in süßem weißem Miso mariniert, dann gegrillt.',
            },
            price: 42,
            allergens: ['fish', 'soy'],
          },
          {
            id: 'wagyu',
            name: { en: 'Wagyu, Kagoshima A4', de: 'Wagyu, Kagoshima A4' },
            description: {
              en: 'Eighty grams over charcoal, sansho pepper, fresh wasabi.',
              de: 'Achtzig Gramm über Holzkohle, Sansho-Pfeffer, frischer Wasabi.',
            },
            price: 68,
            allergens: ['soy'],
          },
          {
            id: 'donabe',
            name: { en: 'Donabe gohan', de: 'Donabe Gohan' },
            description: {
              en: 'Rice cooked to order in a clay pot with seasonal vegetables and mitsuba. For two to share.',
              de: 'Reis, auf Bestellung im Tontopf gegart, mit Gemüse der Saison und Mitsuba. Für zwei zum Teilen.',
            },
            price: 28,
            allergens: ['soy'],
            diet: ['VG'],
          },
        ],
      },
      {
        id: 'sweet',
        title: { en: 'Sweet', de: 'Süßes' },
        items: [
          {
            id: 'sesameIce',
            name: { en: 'Black sesame ice cream', de: 'Eis von schwarzem Sesam' },
            description: {
              en: 'Kinako, warabi mochi, kuromitsu.',
              de: 'Kinako, Warabi-Mochi, Kuromitsu.',
            },
            price: 14,
            allergens: ['sesame', 'milk', 'soy'],
            diet: ['V'],
          },
          {
            id: 'fruit',
            name: { en: 'Seasonal fruit', de: 'Obst der Saison' },
            description: {
              en: 'Cut at the counter and served plain.',
              de: 'Am Tresen geschnitten und pur serviert.',
            },
            price: 12,
            allergens: [],
            diet: ['VG', 'GF'],
          },
        ],
      },
    ],
  },

  drinks: {
    groups: [
      {
        id: 'sake',
        title: { en: 'Sake · 100 ml', de: 'Sake · 100 ml' },
        items: [
          {
            id: 'daiginjo',
            name: { en: 'Junmai daiginjo', de: 'Junmai Daiginjo' },
            description: {
              en: 'Floral, precise, very dry. Served chilled.',
              de: 'Blumig, präzise, sehr trocken. Gekühlt serviert.',
            },
            price: 16,
            allergens: [],
          },
          {
            id: 'kimoto',
            name: { en: 'Kimoto junmai', de: 'Kimoto Junmai' },
            description: {
              en: 'Earthy and round. Served warm, at 45 °C.',
              de: 'Erdig und rund. Warm serviert, bei 45 °C.',
            },
            price: 12,
            allergens: [],
          },
          {
            id: 'nigori',
            name: { en: 'Nigori', de: 'Nigori' },
            description: {
              en: 'Unfiltered, soft, faintly sweet.',
              de: 'Ungefiltert, weich, leicht süß.',
            },
            price: 11,
            allergens: [],
          },
        ],
      },
      {
        id: 'wine',
        title: { en: 'Wine by the glass · 100 ml', de: 'Wein im Glas · 100 ml' },
        items: [
          {
            id: 'veltliner',
            name: { en: 'Grüner Veltliner, Wachau 2023', de: 'Grüner Veltliner, Wachau 2023' },
            description: { en: 'Peppery, mineral, bright.', de: 'Pfeffrig, mineralisch, frisch.' },
            price: 13,
            allergens: ['sulphites'],
          },
          {
            id: 'riesling',
            name: { en: 'Riesling Kabinett, Mosel 2022', de: 'Riesling Kabinett, Mosel 2022' },
            description: {
              en: 'Off-dry, with slate and green apple.',
              de: 'Feinherb, mit Schiefer und grünem Apfel.',
            },
            price: 12,
            allergens: ['sulphites'],
          },
          {
            id: 'champagne',
            name: { en: 'Champagne, blanc de blancs', de: 'Champagner, Blanc de Blancs' },
            description: {
              en: 'Fine bubbles, chalk, brioche.',
              de: 'Feine Perlage, Kreide, Brioche.',
            },
            price: 22,
            allergens: ['sulphites'],
          },
        ],
      },
      {
        id: 'tea',
        title: { en: 'Tea and alcohol-free', de: 'Tee und alkoholfrei' },
        items: [
          {
            id: 'gyokuro',
            name: { en: 'Gyokuro', de: 'Gyokuro' },
            description: {
              en: 'Shade-grown green tea, second infusion at 50 °C.',
              de: 'Beschatteter Grüntee, zweiter Aufguss bei 50 °C.',
            },
            price: 9,
            allergens: [],
            diet: ['VG'],
          },
          {
            id: 'hojicha',
            name: { en: 'Hojicha', de: 'Hojicha' },
            description: {
              en: 'Roasted green tea, low in caffeine.',
              de: 'Gerösteter Grüntee, koffeinarm.',
            },
            price: 6,
            allergens: [],
            diet: ['VG'],
          },
          {
            id: 'soda',
            name: { en: 'Yuzu and shiso soda', de: 'Yuzu-Shiso-Limonade' },
            description: {
              en: 'House-made and lightly sparkling.',
              de: 'Hausgemacht und leicht perlend.',
            },
            price: 8,
            allergens: [],
            diet: ['VG'],
          },
        ],
      },
    ],
  },
};
