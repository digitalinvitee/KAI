/**
 * Full-screen navigation for small screens. Content behind it is made
 * inert while open; Escape, the toggle or any link closes it.
 */
import { $, $$ } from '../core/dom.js';
import { t, onLocaleChange } from '../i18n/i18n.js';

export const initMobileNav = () => {
  const toggle = $('[data-nav-toggle]');
  const panel = $('[data-mobile-nav]');
  if (!toggle || !panel) return;

  const root = document.documentElement;
  const label = $('[data-nav-toggle-label]', toggle);
  const background = [$('#main'), $('.site-footer')].filter(Boolean);
  let open = false;
  let hideTimer = 0;

  $$('.mobile-nav__link', panel).forEach((link, index) => link.style.setProperty('--i', index));

  const syncLabel = () => {
    const key = open ? 'common.closeNav' : 'common.openNav';
    label.dataset.i18n = key;
    label.textContent = t(key);
  };

  const openNav = () => {
    window.clearTimeout(hideTimer);
    open = true;
    panel.hidden = false;
    window.requestAnimationFrame(() => panel.classList.add('is-open'));
    root.classList.add('nav-open');
    toggle.setAttribute('aria-expanded', 'true');
    background.forEach((element) => { element.inert = true; });
    syncLabel();
    $('a', panel)?.focus({ preventScroll: true });
  };

  const closeNav = ({ restoreFocus = true } = {}) => {
    open = false;
    panel.classList.remove('is-open');
    root.classList.remove('nav-open');
    toggle.setAttribute('aria-expanded', 'false');
    background.forEach((element) => { element.inert = false; });
    syncLabel();
    hideTimer = window.setTimeout(() => { if (!open) panel.hidden = true; }, 750);
    if (restoreFocus) toggle.focus({ preventScroll: true });
  };

  toggle.addEventListener('click', () => (open ? closeNav() : openNav()));
  panel.addEventListener('click', (event) => {
    if (event.target.closest('a')) closeNav({ restoreFocus: false });
  });
  document.addEventListener('keydown', (event) => {
    if (open && event.key === 'Escape') closeNav();
  });
  window.matchMedia('(min-width: 1024px)').addEventListener('change', (query) => {
    if (query.matches && open) closeNav({ restoreFocus: false });
  });
  onLocaleChange(syncLabel);
};
