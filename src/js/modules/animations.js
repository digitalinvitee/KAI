/**
 * Motion with GSAP + ScrollTrigger.
 *
 * One orchestrated moment (the hero), then quiet reveals: headings rise line
 * by line out of masks, images open like a shoji panel, and on large screens
 * photographs drift slightly inside their frames. Elements already on screen
 * are never hidden, so a slow network can't leave content invisible.
 */
import { $, $$ } from '../core/dom.js';
import { loadGsap, withTimeout } from '../core/gsap-loader.js';
import { onLocaleChange } from '../i18n/i18n.js';

const HERO_WAIT = 1600;
const FONT_WAIT = 1200;
const FOCUSABLE = 'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])';

const playHeroIntro = ({ gsap }) => {
  const root = document.documentElement;
  const hero = $('.hero');
  if (!hero) return null;

  const letters = $$('.wordmark__letter', hero);
  const items = $$('[data-hero-item]');
  const image = $('.hero__image', hero);
  const veil = $('[data-hero-veil]', hero);

  gsap.set(letters, { yPercent: 110 });
  gsap.set(items, { autoAlpha: 0, y: 14 });
  gsap.set(veil, { opacity: 0.88 });
  gsap.set(image, { scale: 1.12 });
  root.classList.add('hero-ready');

  return gsap
    .timeline({ defaults: { ease: 'expo.out' } })
    .to(veil, { opacity: 0, duration: 2.1, ease: 'power2.inOut' }, 0)
    .to(image, { scale: 1, duration: 2.8 }, 0)
    .to(letters, { yPercent: 0, duration: 1.6, stagger: 0.11 }, 0.3)
    .to(items, { autoAlpha: 1, y: 0, duration: 1.2, stagger: 0.07, clearProps: 'opacity,visibility,transform' }, 0.95);
};

const setupScrollMotion = ({ gsap, ScrollTrigger }) => {
  const isBelowFold = (element) => element.getBoundingClientRect().top > window.innerHeight * 0.92;
  const lineTweens = [];

  $$('[data-reveal-lines]').filter(isBelowFold).forEach((heading) => {
    lineTweens.push(
      gsap.from(heading.querySelectorAll('.line__inner'), {
        yPercent: 110,
        duration: 1.35,
        ease: 'expo.out',
        stagger: 0.11,
        scrollTrigger: { trigger: heading, start: 'top 88%', once: true },
      }),
    );
  });

  // Blocks with links or buttons fade with opacity only (never visibility), so the keyboard
  // can always reach them; focusing one finishes its reveal at once.
  const interactiveReveals = new Map();
  $$('[data-reveal]').filter(isBelowFold).forEach((element) => {
    const interactive = Boolean(element.querySelector(FOCUSABLE));
    const tween = gsap.from(element, {
      [interactive ? 'opacity' : 'autoAlpha']: 0,
      y: 28,
      duration: 1.2,
      ease: 'expo.out',
      clearProps: 'transform',
      scrollTrigger: { trigger: element, start: 'top 90%', once: true },
    });
    if (interactive) interactiveReveals.set(element, tween);
  });
  document.addEventListener('focusin', (event) => {
    interactiveReveals.forEach((tween, element) => {
      if (!element.contains(event.target)) return;
      // Finish first: killing a ScrollTrigger also kills its tween.
      tween.progress(1);
      tween.scrollTrigger?.kill();
      interactiveReveals.delete(element);
    });
  });

  $$('[data-reveal-stagger]').filter(isBelowFold).forEach((list) => {
    gsap.from(list.children, {
      autoAlpha: 0,
      y: 18,
      duration: 1.1,
      ease: 'expo.out',
      stagger: 0.09,
      clearProps: 'transform',
      scrollTrigger: { trigger: list, start: 'top 88%', once: true },
    });
  });

  $$('[data-reveal-media]').filter(isBelowFold).forEach((figure) => {
    const frame = $('.media__frame', figure);
    const image = $('.media__img', figure);
    const caption = $('.caption', figure);
    gsap
      .timeline({ scrollTrigger: { trigger: figure, start: 'top 86%', once: true } })
      .fromTo(frame, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'expo.inOut', clearProps: 'clipPath' })
      .from(image, { scale: 1.22, duration: 2, ease: 'expo.out' }, 0.15)
      .from(caption, { autoAlpha: 0, y: 8, duration: 0.9, ease: 'expo.out' }, 0.8);
  });

  const media = gsap.matchMedia();
  media.add('(min-width: 1024px)', () => {
    document.documentElement.classList.add('has-parallax');
    $$('[data-parallax]').forEach((image) => {
      gsap.fromTo(
        image,
        { yPercent: -6 },
        {
          yPercent: 6,
          ease: 'none',
          scrollTrigger: { trigger: image.closest('.media__frame'), start: 'top bottom', end: 'bottom top', scrub: true },
        },
      );
    });
    const hero = $('.hero');
    if (hero) {
      gsap.to('.hero__image', {
        yPercent: 9,
        ease: 'none',
        scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
      });
      gsap.to('.hero__content', {
        autoAlpha: 0.25,
        y: -40,
        ease: 'none',
        scrollTrigger: { trigger: hero, start: 'center center', end: 'bottom top', scrub: true },
      });
    }
    return () => document.documentElement.classList.remove('has-parallax');
  });

  // A language switch rewrites heading lines: finish pending reveals so new text is never left hidden.
  onLocaleChange(() => {
    lineTweens.forEach((tween) => {
      tween.progress(1);
      tween.scrollTrigger?.kill();
      tween.kill();
    });
    lineTweens.length = 0;
    window.requestAnimationFrame(() => ScrollTrigger.refresh());
  });

  document.fonts?.ready.then(() => ScrollTrigger.refresh());
  window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
};

export const initMotion = async () => {
  const root = document.documentElement;
  if (!root.classList.contains('motion-ok')) {
    root.classList.add('hero-ready');
    return;
  }

  const libraries = loadGsap();
  const fonts = withTimeout(document.fonts?.ready ?? Promise.resolve(), FONT_WAIT);
  const early = await withTimeout(Promise.all([libraries, fonts]).then(([loaded]) => loaded), HERO_WAIT);

  if (early && !root.classList.contains('motion-failsafe')) playHeroIntro(early);
  else root.classList.add('hero-ready');

  const loaded = early ?? (await libraries);
  if (loaded) setupScrollMotion(loaded);
  else root.classList.add('motion-unavailable');
};
