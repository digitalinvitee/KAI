/**
 * EN / DE switch. Renders one button per registered locale into every
 * [data-lang-switch] container and keeps the reader's place on the page
 * while the text around them changes length.
 */
import { $$, h, headerOffset } from '../core/dom.js';
import { getLocale, getLocales, setLocale, t, onLocaleChange } from '../i18n/i18n.js';

const keepScrollPosition = (change) => {
  const probe = document.elementFromPoint(window.innerWidth / 2, headerOffset() + 24);
  const chain = [];
  for (let node = probe; node && node !== document.body; node = node.parentElement) chain.push(node);
  const before = chain.map((node) => node.getBoundingClientRect().top);

  change();

  const index = chain.findIndex((node) => node.isConnected);
  if (index === -1) return;
  const delta = chain[index].getBoundingClientRect().top - before[index];
  if (Math.abs(delta) > 1) window.scrollTo({ top: window.scrollY + delta, behavior: 'instant' });
};

export const initLanguageSwitchers = () => {
  const containers = $$('[data-lang-switch]');

  const render = () => {
    containers.forEach((container) => {
      const nodes = getLocales().flatMap((locale, index) => {
        const button = h(
          'button',
          {
            type: 'button',
            class: 'lang-switch__btn',
            lang: locale.code,
            'aria-pressed': String(locale.code === getLocale()),
            'aria-label': t(`common.langNames.${locale.code}`),
            dataset: { locale: locale.code },
          },
          locale.label,
        );
        return index === 0 ? [button] : [h('span', { class: 'lang-switch__sep', 'aria-hidden': 'true' }, '/'), button];
      });
      container.replaceChildren(...nodes);
    });
  };

  containers.forEach((container) => {
    container.addEventListener('click', (event) => {
      const button = event.target.closest('[data-locale]');
      if (!button || button.dataset.locale === getLocale()) return;
      const code = button.dataset.locale;
      keepScrollPosition(() => setLocale(code));
      container.querySelector(`[data-locale="${code}"]`)?.focus({ preventScroll: true });
    });
  });

  render();
  onLocaleChange(render);
};
