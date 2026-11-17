/**
 * Menu structure. Copy (names, descriptions, group titles) lives in the
 * locale files under `menu.items.<id>` and `menu.groups.<id>`, so adding a
 * language never touches this file. Prices are euros.
 *
 * Allergen codes follow the 14 allergens of EU Regulation 1169/2011.
 * Diet codes: V = vegetarian, VG = vegan, GF = gluten-free.
 */

export const ALLERGENS = Object.freeze([
  'gluten', 'crustaceans', 'egg', 'fish', 'peanuts', 'soy', 'milk',
  'nuts', 'celery', 'mustard', 'sesame', 'sulphites', 'lupin', 'molluscs',
]);

export const DIETS = Object.freeze(['V', 'VG', 'GF']);

export const MENU = Object.freeze({
  omakase: {
    sets: [
      { id: 'counter', price: 185, courses: 17 },
      { id: 'vegetable', price: 145, courses: 12, diet: ['V'] },
    ],
    groups: [
      {
        id: 'sequence',
        numbered: true,
        items: [
          { id: 'dashi', allergens: ['fish'] },
          { id: 'chawanmushi', allergens: ['egg', 'crustaceans', 'fish', 'soy'] },
          { id: 'kinmedai', allergens: ['fish', 'soy', 'gluten'] },
          { id: 'hotate', allergens: ['molluscs'] },
          { id: 'chutoro', allergens: ['fish', 'soy', 'gluten'] },
          { id: 'anago', allergens: ['fish', 'soy', 'gluten'] },
          { id: 'tamago', allergens: ['egg', 'crustaceans', 'soy'] },
          { id: 'monaka', allergens: ['milk', 'egg'], diet: ['V'] },
        ],
      },
      {
        id: 'pairings',
        items: [
          { id: 'sakePairing', price: 95, allergens: [] },
          { id: 'teaPairing', price: 55, allergens: [], diet: ['VG'] },
        ],
      },
    ],
  },

  alacarte: {
    groups: [
      {
        id: 'small',
        items: [
          { id: 'edamame', price: 7, allergens: ['soy'], diet: ['VG', 'GF'] },
          { id: 'agedashi', price: 14, allergens: ['soy', 'fish', 'gluten'] },
          { id: 'shiitake', price: 16, allergens: ['soy'], diet: ['VG'] },
        ],
      },
      {
        id: 'counter',
        items: [
          { id: 'sashimi', price: 38, allergens: ['fish', 'soy', 'gluten'] },
          { id: 'tataki', price: 26, allergens: ['fish', 'soy', 'gluten'] },
          { id: 'nigiri', price: 18, allergens: ['fish', 'soy', 'gluten'] },
        ],
      },
      {
        id: 'warm',
        items: [
          { id: 'blackCod', price: 42, allergens: ['fish', 'soy'] },
          { id: 'wagyu', price: 68, allergens: ['soy'] },
          { id: 'donabe', price: 28, allergens: ['soy'], diet: ['VG'] },
        ],
      },
      {
        id: 'sweet',
        items: [
          { id: 'sesameIce', price: 14, allergens: ['sesame', 'milk', 'soy'], diet: ['V'] },
          { id: 'fruit', price: 12, allergens: [], diet: ['VG', 'GF'] },
        ],
      },
    ],
  },

  drinks: {
    groups: [
      {
        id: 'sake',
        items: [
          { id: 'daiginjo', price: 16, allergens: [] },
          { id: 'kimoto', price: 12, allergens: [] },
          { id: 'nigori', price: 11, allergens: [] },
        ],
      },
      {
        id: 'wine',
        items: [
          { id: 'veltliner', price: 13, allergens: ['sulphites'] },
          { id: 'riesling', price: 12, allergens: ['sulphites'] },
          { id: 'champagne', price: 22, allergens: ['sulphites'] },
        ],
      },
      {
        id: 'tea',
        items: [
          { id: 'gyokuro', price: 9, allergens: [], diet: ['VG'] },
          { id: 'hojicha', price: 6, allergens: [], diet: ['VG'] },
          { id: 'soda', price: 8, allergens: [], diet: ['VG'] },
        ],
      },
    ],
  },
});

export const MENU_CATEGORIES = Object.freeze(['omakase', 'alacarte', 'drinks']);
