/**
 * Tiny localisation engine.
 *
 * Markup opts in with data attributes:
 *   data-i18n="key"             → textContent
 *   data-i18n-html="key"        → innerHTML (trusted strings from locale files only)
 *   data-i18n-lines="key"       → one masked line per array item (used by text reveals)
 *   data-i18n-attr="alt:key; aria-label:key2"
 */
import { LOCALES, DEFAULT_LOCALE } from './config.js';
import { localStore } from '../core/storage.js';

const STORAGE_KEY = 'kai-locale';
let current = DEFAULT_LOCALE;
const listeners = new Set();

const lookup = (messages, key) =>
  key.split('.').reduce((node, part) => (node == null ? undefined : node[part]), messages);

const interpolate = (text, vars) =>
  text.replace(/\{(\w+)\}/g, (match, name) => (vars && name in vars ? String(vars[name]) : match));

export const getLocale = () => current;
export const getIntlLocale = () => LOCALES[current].intl;
export const getLocales = () => Object.values(LOCALES);

export const t = (key, vars) => {
  let value = lookup(LOCALES[current].messages, key);
  if (value === undefined) value = lookup(LOCALES[DEFAULT_LOCALE].messages, key);
  if (value === undefined) return key;
  return typeof value === 'string' ? interpolate(value, vars) : value;
};

export const formatNumber = (value, options) => new Intl.NumberFormat(getIntlLocale(), options).format(value);

export const plural = (key, count, vars = {}) => {
  const forms = t(key);
  const rule = new Intl.PluralRules(getIntlLocale()).select(count);
  const template = typeof forms === 'object' ? forms[rule] ?? forms.other : String(forms);
  return interpolate(template, { n: formatNumber(count), ...vars });
};

/** Whole euros print without cents (€18); other amounts keep both digits (€18.50). */
export const formatPrice = (amount) => {
  const digits = Number.isInteger(amount) ? 0 : 2;
  return new Intl.NumberFormat(getIntlLocale(), {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(amount);
};

export const formatDate = (date, options) => new Intl.DateTimeFormat(getIntlLocale(), options).format(date);

export const renderLines = (element, lines) => {
  const list = Array.isArray(lines) ? lines : [String(lines)];
  element.replaceChildren();
  list.forEach((line, index) => {
    const outer = document.createElement('span');
    const inner = document.createElement('span');
    outer.className = 'line';
    inner.className = 'line__inner';
    inner.textContent = line;
    outer.append(inner);
    element.append(outer);
    if (index < list.length - 1) element.append(' ');
  });
};

export const translateDom = (root = document) => {
  root.querySelectorAll('[data-i18n]').forEach((element) => {
    element.textContent = t(element.dataset.i18n);
  });
  root.querySelectorAll('[data-i18n-html]').forEach((element) => {
    element.innerHTML = t(element.dataset.i18nHtml);
  });
  root.querySelectorAll('[data-i18n-lines]').forEach((element) => {
    renderLines(element, t(element.dataset.i18nLines));
  });
  root.querySelectorAll('[data-i18n-attr]').forEach((element) => {
    element.dataset.i18nAttr.split(';').forEach((pair) => {
      const [attribute, key] = pair.split(':').map((part) => part.trim());
      if (attribute && key) element.setAttribute(attribute, t(key));
    });
  });
};

const syncUrl = (code) => {
  try {
    const url = new URL(window.location.href);
    if (code === DEFAULT_LOCALE) url.searchParams.delete('lang');
    else url.searchParams.set('lang', code);
    window.history.replaceState(window.history.state, '', url);
  } catch {
    /* sandboxed frames may refuse history changes */
  }
};

const syncMeta = (code) => {
  const config = LOCALES[code];
  document.querySelector('meta[property="og:locale"]')?.setAttribute('content', config.og);
  document.querySelectorAll('meta[property="og:locale:alternate"]').forEach((meta, index) => {
    const alternates = Object.values(LOCALES).filter((entry) => entry.code !== code);
    if (alternates[index]) meta.setAttribute('content', alternates[index].og);
  });
};

export const resolveInitialLocale = () => {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('lang');
    if (fromUrl && LOCALES[fromUrl]) return fromUrl;
  } catch {
    /* ignore */
  }
  const stored = localStore.get(STORAGE_KEY);
  return stored && LOCALES[stored] ? stored : DEFAULT_LOCALE;
};

export const setLocale = (code, { persist = true, silent = false } = {}) => {
  const next = LOCALES[code] ? code : DEFAULT_LOCALE;
  const previous = current;
  current = next;
  document.documentElement.lang = next;
  translateDom(document);
  syncMeta(next);
  syncUrl(next);
  if (persist) localStore.set(STORAGE_KEY, next);
  if (!silent) listeners.forEach((listener) => listener(next, previous));
};

export const onLocaleChange = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
