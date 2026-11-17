import test from 'node:test';
import assert from 'node:assert/strict';
import en from '../src/js/i18n/locales/en.js';
import de from '../src/js/i18n/locales/de.js';
import { readFileSync } from 'node:fs';
import { ALLERGENS, DIETS } from '../content/menu.js';

const keysOf = (node, prefix = '') =>
  Object.entries(node).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return value && typeof value === 'object' && !Array.isArray(value) ? keysOf(value, path) : [path];
  });

const lookup = (messages, path) => path.split('.').reduce((node, part) => node?.[part], messages);

test('English and German define exactly the same keys', () => {
  const enKeys = new Set(keysOf(en));
  const deKeys = new Set(keysOf(de));
  assert.deepEqual([...enKeys].filter((key) => !deKeys.has(key)), [], 'missing in German');
  assert.deepEqual([...deKeys].filter((key) => !enKeys.has(key)), [], 'missing in English');
});

test('placeholders match between languages', () => {
  const placeholders = (text) => [...String(text).matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();
  keysOf(en).forEach((key) => {
    assert.deepEqual(placeholders(lookup(de, key)), placeholders(lookup(en, key)), key);
  });
});

test('line arrays have the same shape in both languages', () => {
  ['philosophy.title', 'menu.title', 'space.title', 'private.title', 'booking.title', 'booking.steps', 'booking.stepTitles'].forEach((key) => {
    assert.equal(lookup(de, key).length, lookup(en, key).length, key);
  });
});

test('every allergen and diet mark has a name in both languages', () => {
  [en, de].forEach((messages) => {
    ALLERGENS.forEach((code) => assert.ok(messages.menu.allergens[code], code));
    DIETS.forEach((code) => assert.ok(messages.menu.diets[code], code));
  });
});

test('every text key used in the pages exists in both languages', () => {
  const pages = ['index.html', '404.html', 'demo-dashboard/index.html'].map((file) => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8'));
  const keys = new Set();
  pages.forEach((html) => {
    for (const [, key] of html.matchAll(/data-i18n(?:-html|-lines)?="([^"]+)"/g)) keys.add(key);
    for (const [, pairs] of html.matchAll(/data-i18n-attr="([^"]+)"/g)) pairs.split(/[;,]/).forEach((pair) => keys.add(pair.split(':')[1].trim()));
    // Texts that change with the booking mode: demo and request each need a version.
    for (const [, base] of html.matchAll(/data-mode-text="([^"]+)"/g)) ['demo', 'request'].forEach((mode) => keys.add(`${base}.${mode}`));
  });
  [en, de].forEach((messages, index) => {
    const missing = [...keys].filter((key) => lookup(messages, key) === undefined);
    assert.deepEqual(missing, [], `missing in ${index ? 'German' : 'English'}`);
  });
});

test('every booking mode has its notices and notes', () => {
  ['demo', 'request', 'provider'].forEach((mode) => {
    [en, de].forEach((messages) => {
      assert.ok(messages.booking.notices[mode].title && messages.booking.notices[mode].text, `notices.${mode}`);
      assert.ok(messages.booking.modes.notes[mode], `modes.notes.${mode}`);
    });
  });
});
