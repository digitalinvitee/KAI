/**
 * Quick actions for phones and tablets: Menu and Reserve, pinned to the bottom.
 *
 * Timing: hidden while the hero's own buttons are on screen, shown once they
 * scroll away, and out of the way wherever it would repeat or cover something:
 * the booking form (with its own action bar), private dining (with its own
 * enquiry), the menu's closing Reserve prompt, the footer and the open mobile
 * menu. Inside the menu, only Reserve is shown. Large screens keep the Reserve
 * button in the header instead.
 */
import { $ } from '../core/dom.js';

export const initActionBar = () => {
  const bar = $('[data-action-bar]');
  if (!bar || !('IntersectionObserver' in window)) return;

  const root = document.documentElement;
  const small = window.matchMedia('(max-width: 1023.98px)');
  const seen = { heroActions: true, menu: false, menuCta: false, reservations: false, privateDining: false, footer: false };

  const update = () => {
    const show =
      small.matches &&
      !seen.heroActions &&
      !seen.menuCta &&
      !seen.reservations &&
      !seen.privateDining &&
      !seen.footer &&
      !root.classList.contains('nav-open');
    bar.classList.toggle('is-visible', show);
    bar.classList.toggle('is-in-menu', seen.menu);
    bar.inert = !show;
  };

  const watch = (element, key, rootMargin) => {
    if (!element) return;
    new IntersectionObserver(([entry]) => {
      seen[key] = entry.isIntersecting;
      update();
    }, { rootMargin }).observe(element);
  };

  watch($('.hero__actions'), 'heroActions', '0px');
  watch($('#menu'), 'menu', '-30% 0px -30% 0px');
  watch($('.menu-cta'), 'menuCta', '0px');
  watch($('#reservations .reserve__panel'), 'reservations', '-15% 0px -15% 0px');
  watch($('#private-dining'), 'privateDining', '-35% 0px -35% 0px');
  watch($('#visit'), 'footer', '0px');

  new MutationObserver(update).observe(root, { attributes: true, attributeFilter: ['class'] });
  small.addEventListener('change', update);
  update();
};
