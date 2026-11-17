/**
 * Interactive menu: accessible tabs (arrow keys, Home/End) that stay in view
 * while a long category is read, panels rendered from content/menu.js in the
 * reader's language, locale-aware prices, diet marks, and allergens on demand.
 */
import { $, $$, h, prefersReducedMotion, scrollToY } from '../core/dom.js';
import { t, plural, formatPrice, onLocaleChange, getLocale } from '../i18n/i18n.js';
import { localStore } from '../core/storage.js';
import { MENU, DIETS } from '../../../content/menu.js';

const ALLERGEN_KEY = 'kai-menu-allergens';

const pad = (value) => String(value).padStart(2, '0');

/** Picks the reader's language from a { en, de } field, falling back to English. */
const text = (field) => (field ? field[getLocale()] ?? field.en ?? '' : '');

const dietBadges = (codes = []) =>
  codes.length
    ? h(
        'span',
        { class: 'diets' },
        codes.map((code) =>
          h('span', { class: 'diet', title: t(`menu.diets.${code}`) }, [
            h('span', { 'aria-hidden': 'true' }, code),
            h('span', { class: 'sr-only' }, t(`menu.diets.${code}`)),
          ]),
        ),
      )
    : null;

const allergenText = (allergens = []) =>
  allergens.length
    ? `${t('menu.contains')} ${allergens.map((code) => t(`menu.allergens.${code}`)).join(' · ')}`
    : t('menu.noAllergens');

const renderSet = (set) =>
  h('article', { class: 'set', 'data-menu-anim': true }, [
    h('h3', { class: 'set__name' }, text(set.name)),
    h('p', { class: 'set__meta' }, [h('span', {}, plural('menu.courses', set.courses)), dietBadges(set.diet)]),
    h('p', { class: 'set__note' }, text(set.note)),
    h('p', { class: 'set__price' }, [
      h('data', { value: set.price }, formatPrice(set.price)),
      h('span', { class: 'set__per' }, t('menu.perGuest')),
    ]),
  ]);

const renderDish = (item, index, numbered) =>
  h('li', { class: `dish${numbered ? ' dish--numbered' : ''}`, 'data-menu-anim': true }, [
    numbered ? h('span', { class: 'dish__index', 'aria-hidden': 'true' }, pad(index + 1)) : null,
    h('div', { class: 'dish__body' }, [
      h('p', { class: 'dish__name' }, text(item.name)),
      h('p', { class: 'dish__desc' }, text(item.description)),
      h('p', { class: `dish__meta${item.diet?.length ? '' : ' dish__meta--allergens-only'}` }, [
        h('span', { class: 'dish__allergens' }, allergenText(item.allergens)),
        dietBadges(item.diet),
      ]),
    ]),
    item.price != null ? h('p', { class: 'dish__price' }, h('data', { value: item.price }, formatPrice(item.price))) : null,
  ]);

const renderGroup = (group) => {
  const titleId = `menu-group-${group.id}`;
  const list = h(
    group.numbered ? 'ol' : 'ul',
    { class: 'menu-list' },
    group.items.map((item, index) => renderDish(item, index, group.numbered)),
  );
  return h('section', { class: 'menu-group', 'aria-labelledby': titleId }, [
    h('header', { class: 'menu-group__head', 'data-menu-anim': true }, [
      h('h3', { class: 'label', id: titleId }, text(group.title)),
      group.note ? h('p', { class: 'menu-group__note' }, text(group.note)) : null,
    ]),
    list,
  ]);
};

const renderCategory = (category) => {
  const data = MENU[category];
  const fragment = document.createDocumentFragment();
  if (data.sets) fragment.append(h('div', { class: 'set-list' }, data.sets.map(renderSet)));
  data.groups.forEach((group) => fragment.append(renderGroup(group)));
  return fragment;
};

export const initMenu = () => {
  const tablist = $('[data-menu-tabs]');
  if (!tablist) return;

  const tabs = $$('[role="tab"]', tablist);
  const indicator = $('[data-menu-indicator]', tablist);
  const panels = new Map($$('[data-menu-panel]').map((panel) => [panel.dataset.menuPanel, panel]));
  const panelWrap = $('[data-menu-panels]');
  const allergenToggle = $('[data-allergen-toggle]');
  const legend = $('[data-diet-legend]');
  let active = tabs.find((tab) => tab.getAttribute('aria-selected') === 'true')?.dataset.category ?? 'omakase';

  const renderPanels = () => {
    panels.forEach((panel, category) => panel.replaceChildren(renderCategory(category)));
    legend?.replaceChildren(
      ...DIETS.map((code) =>
        h('li', {}, [h('span', { class: 'diet', 'aria-hidden': 'true' }, code), h('span', {}, t(`menu.diets.${code}`))]),
      ),
    );
  };

  /* Allergens are there for everyone who needs them, one switch away; the choice is remembered. */
  const showAllergens = (on) => {
    panelWrap?.classList.toggle('show-allergens', on);
    allergenToggle?.setAttribute('aria-pressed', String(on));
  };
  showAllergens(localStore.get(ALLERGEN_KEY) === true);
  allergenToggle?.addEventListener('click', () => {
    const on = allergenToggle.getAttribute('aria-pressed') !== 'true';
    showAllergens(on);
    localStore.set(ALLERGEN_KEY, on);
  });

  const moveIndicator = () => {
    const tab = tabs.find((item) => item.dataset.category === active);
    if (!tab || !indicator) return;
    indicator.style.setProperty('--indicator-x', `${tab.offsetLeft}px`);
    indicator.style.setProperty('--indicator-w', `${tab.offsetWidth}px`);
  };

  const animatePanel = (panel) => {
    const gsap = window.gsap;
    if (prefersReducedMotion()) return;
    if (gsap) {
      gsap.fromTo(
        panel.querySelectorAll('[data-menu-anim]'),
        { autoAlpha: 0, y: 14 },
        { autoAlpha: 1, y: 0, duration: 0.7, ease: 'expo.out', stagger: { each: 0.03, amount: 0.45 }, clearProps: 'opacity,visibility,transform' },
      );
      return;
    }
    panel.classList.remove('is-entering');
    void panel.offsetWidth;
    panel.classList.add('is-entering');
  };

  /* When the tabs are stuck to the top, a new category starts from its first line. */
  const revealPanelStart = () => {
    const offset = parseFloat(getComputedStyle(tablist).top) || 0;
    const stuck = tablist.getBoundingClientRect().top <= offset + 1;
    if (!stuck || !panelWrap) return;
    const target = window.scrollY + panelWrap.getBoundingClientRect().top - offset - tablist.offsetHeight - 24;
    scrollToY(target);
  };

  const select = (category, { focus = false } = {}) => {
    const tab = tabs.find((item) => item.dataset.category === category);
    if (!tab) return;
    if (focus) tab.focus({ preventScroll: true });
    if (category === active) return;

    tabs.forEach((item) => {
      const selected = item === tab;
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
    });
    panels.get(active).hidden = true;
    const next = panels.get(category);
    next.hidden = false;
    active = category;
    moveIndicator();
    tablist.scrollTo({ left: tab.offsetLeft - 16, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    revealPanelStart();
    animatePanel(next);
  };

  tablist.addEventListener('click', (event) => {
    const tab = event.target.closest('[role="tab"]');
    if (tab) select(tab.dataset.category);
  });

  tablist.addEventListener('keydown', (event) => {
    const index = tabs.findIndex((tab) => tab.dataset.category === active);
    const moves = {
      ArrowRight: (index + 1) % tabs.length,
      ArrowLeft: (index - 1 + tabs.length) % tabs.length,
      Home: 0,
      End: tabs.length - 1,
    };
    if (!(event.key in moves)) return;
    event.preventDefault();
    select(tabs[moves[event.key]].dataset.category, { focus: true });
  });

  renderPanels();
  moveIndicator();
  window.addEventListener('resize', moveIndicator);
  document.fonts?.ready.then(moveIndicator);
  onLocaleChange(() => {
    renderPanels();
    window.requestAnimationFrame(moveIndicator);
  });
};
