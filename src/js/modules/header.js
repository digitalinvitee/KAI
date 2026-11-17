/**
 * Fixed header: adapts its colour to the section beneath it, turns solid
 * after the hero, hides while scrolling down and returns on the way up.
 * Also marks the navigation link of the section in view.
 */
import { $, $$ } from '../core/dom.js';

export const initHeader = () => {
  const header = $('[data-header]');
  if (!header) return;

  const root = document.documentElement;
  const hero = $('.hero');
  const themed = $$('[data-theme]').filter((element) => element !== header);
  let lastY = window.scrollY;
  let ticking = false;
  let stickyOffset = null;

  const update = () => {
    ticking = false;
    const y = window.scrollY;
    const height = header.offsetHeight;
    const heroEnd = hero ? hero.offsetTop + hero.offsetHeight : 0;

    const probe = height / 2;
    const beneath = themed.find((element) => {
      const rect = element.getBoundingClientRect();
      return rect.top <= probe && rect.bottom > probe;
    });
    const theme = root.classList.contains('is-dark') ? 'dark' : beneath?.dataset.theme ?? 'light';
    if (header.dataset.theme !== theme) header.dataset.theme = theme;

    header.classList.toggle('is-solid', y > heroEnd - height - 1);

    const pinned = root.classList.contains('nav-open') || header.contains(document.activeElement);
    const delta = y - lastY;
    if (pinned || y < heroEnd - height) header.classList.remove('is-hidden');
    else if (delta > 6) header.classList.add('is-hidden');
    else if (delta < -6) header.classList.remove('is-hidden');
    lastY = y;

    // Sticky elements (the menu tabs) sit just below the header while it is shown.
    const offset = header.classList.contains('is-hidden') ? 0 : height;
    if (offset !== stickyOffset) {
      stickyOffset = offset;
      root.style.setProperty('--sticky-offset', `${offset}px`);
    }
  };

  const schedule = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  };

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  document.addEventListener('kai:themechange', schedule);
  header.addEventListener('focusin', () => header.classList.remove('is-hidden'));
  update();

  const links = $$('[data-nav-link]', header);
  const sections = links.map((link) => document.getElementById(link.dataset.navLink)).filter(Boolean);
  if (!('IntersectionObserver' in window) || sections.length === 0) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries
        .filter((entry) => entry.isIntersecting)
        .forEach((entry) => {
          links.forEach((link) => {
            if (link.dataset.navLink === entry.target.id) link.setAttribute('aria-current', 'true');
            else link.removeAttribute('aria-current');
          });
        });
    },
    { rootMargin: '-45% 0px -54% 0px' },
  );
  sections.forEach((section) => observer.observe(section));
};
