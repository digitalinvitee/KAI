/**
 * KAI · site entry.
 * Order matters: the locale is applied first so every module renders its
 * dynamic content in the reader's language; motion is layered on last.
 */
import { setLocale, resolveInitialLocale } from './i18n/i18n.js';
import { createReservationStore } from './demo/reservations.js';
import { initLanguageSwitchers } from './modules/language-switcher.js';
import { initHeader } from './modules/header.js';
import { initMobileNav } from './modules/mobile-nav.js';
import { initThemeCanvas } from './modules/theme.js';
import { initMenu } from './modules/menu.js';
import { initBooking } from './modules/booking/booking.js';
import { initVisit } from './modules/visit.js';
import { initPrivateDining } from './modules/private-dining.js';
import { initActionBar } from './modules/action-bar.js';
import { initMotion } from './modules/animations.js';

const root = document.documentElement;

setLocale(resolveInitialLocale(), { persist: false, silent: true });

const store = createReservationStore();

initLanguageSwitchers();
initHeader();
initMobileNav();
initThemeCanvas();
initMenu();
initBooking({ store });
initVisit();
initPrivateDining();
initActionBar();

root.classList.remove('i18n-pending');
initMotion();
