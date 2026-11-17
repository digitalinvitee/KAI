/**
 * Turns the page canvas dark while the dark section ("The Space") fills the
 * middle of the viewport. The colour change itself is a CSS transition on
 * registered custom properties (see tokens.css).
 */
import { $ } from '../core/dom.js';

export const initThemeCanvas = () => {
  const section = $('[data-dark-section]');
  if (!section || !('IntersectionObserver' in window)) return;

  const root = document.documentElement;
  const observer = new IntersectionObserver(
    ([entry]) => {
      const dark = entry.isIntersecting;
      if (root.classList.contains('is-dark') === dark) return;
      root.classList.toggle('is-dark', dark);
      document.dispatchEvent(new CustomEvent('kai:themechange', { detail: { dark } }));
    },
    { rootMargin: '-42% 0px -42% 0px' },
  );
  observer.observe(section);
};
