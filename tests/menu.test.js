/**
 * Checks content/menu.js, the file restaurant staff edit, so a typo shows up
 * in `npm test` instead of on the website.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { MENU, ALLERGENS, DIETS } from '../content/menu.js';

const CATEGORIES = ['omakase', 'alacarte', 'drinks'];
const LANGUAGES = ['en', 'de'];

const groups = () => CATEGORIES.flatMap((category) => MENU[category].groups.map((group) => ({ category, group })));
const items = () => groups().flatMap(({ category, group }) => group.items.map((item) => ({ category, group, item })));
const sets = () => MENU.omakase.sets ?? [];

const assertBilingual = (field, where) => {
  LANGUAGES.forEach((lang) => {
    assert.equal(typeof field?.[lang], 'string', `${where}: ${lang} text missing`);
    assert.ok(field[lang].trim().length > 0, `${where}: ${lang} text is empty`);
  });
};

test('the menu has its three tabs, each with at least one group', () => {
  assert.deepEqual(Object.keys(MENU).sort(), [...CATEGORIES].sort());
  CATEGORIES.forEach((category) => assert.ok(MENU[category].groups.length > 0, category));
});

test('every id is unique', () => {
  const ids = [...sets().map((set) => `set:${set.id}`), ...groups().map(({ group }) => `group:${group.id}`), ...items().map(({ item }) => `item:${item.id}`)];
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  assert.deepEqual(duplicates, []);
  ids.forEach((id) => assert.match(id, /^\w+:[a-zA-Z][a-zA-Z0-9]*$/, `${id}: use letters and digits only`));
});

test('set menus have names, notes, a whole number of courses and a price in both languages', () => {
  sets().forEach((set) => {
    assertBilingual(set.name, `set ${set.id} name`);
    assertBilingual(set.note, `set ${set.id} note`);
    assert.ok(Number.isInteger(set.courses) && set.courses > 0, `set ${set.id}: courses`);
    assert.ok(Number.isFinite(set.price) && set.price > 0, `set ${set.id}: price`);
  });
});

test('every group and dish has its text in English and German', () => {
  groups().forEach(({ group }) => {
    assertBilingual(group.title, `group ${group.id} title`);
    if (group.note) assertBilingual(group.note, `group ${group.id} note`);
  });
  items().forEach(({ item }) => {
    assertBilingual(item.name, `${item.id} name`);
    assertBilingual(item.description, `${item.id} description`);
  });
});

test('prices are positive numbers in euros', () => {
  items().forEach(({ item, group }) => {
    if (item.price === undefined) {
      assert.ok(group.numbered, `${item.id}: only courses of a set menu may leave out the price`);
      return;
    }
    assert.ok(Number.isFinite(item.price) && item.price > 0, `${item.id}: price must be a number such as 18 or 18.5`);
  });
});

test('allergens and diet marks use the listed codes', () => {
  items().forEach(({ item }) => {
    assert.ok(Array.isArray(item.allergens), `${item.id}: allergens must be a list, [] if none apply`);
    item.allergens.forEach((code) => assert.ok(ALLERGENS.includes(code), `${item.id}: unknown allergen "${code}"`));
    assert.equal(new Set(item.allergens).size, item.allergens.length, `${item.id}: allergen listed twice`);
    (item.diet ?? []).forEach((code) => assert.ok(DIETS.includes(code), `${item.id}: unknown diet mark "${code}"`));
  });
  sets().forEach((set) => (set.diet ?? []).forEach((code) => assert.ok(DIETS.includes(code), `set ${set.id}: unknown diet mark "${code}"`)));
});
