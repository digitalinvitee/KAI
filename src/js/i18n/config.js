import en from './locales/en.js';
import de from './locales/de.js';

/**
 * Registered languages. To add one: create locales/<code>.js with the same
 * keys as en.js, import it here and add an entry. The language switcher
 * renders a button for every entry automatically.
 */
export const LOCALES = Object.freeze({
  en: { code: 'en', label: 'EN', intl: 'en-GB', og: 'en_GB', messages: en },
  de: { code: 'de', label: 'DE', intl: 'de-DE', og: 'de_DE', messages: de },
});

export const DEFAULT_LOCALE = 'en';
