/**
 * Visit and contact: opening hours wherever [data-hours] appears, plus the
 * address, directions and contact actions in the footer. Everything comes from
 * content/restaurant.js. Details that are not filled in yet stay visible as
 * labelled placeholders, never as links that could dial or mail a stranger.
 */
import { $, $$, h } from '../core/dom.js';
import { t, getIntlLocale, onLocaleChange } from '../i18n/i18n.js';
import { RESTAURANT } from '../../../content/restaurant.js';
import { formatDays, closedDays, formatSeatings } from '../core/schedule.js';
import { telHref, whatsappHref, mailHref } from '../core/handoff.js';

export const hoursText = () => {
  const intl = getIntlLocale();
  const closed = closedDays(RESTAURANT.openWeekdays);
  return {
    open: t('hours.open', { days: formatDays(RESTAURANT.openWeekdays, intl), from: RESTAURANT.hours.open, to: RESTAURANT.hours.close }),
    closed: closed.length ? t('hours.closed', { days: formatDays(closed, intl) }) : '',
    seatings: formatSeatings(RESTAURANT.seatings, intl),
  };
};

const placeholder = (label) =>
  h('span', { class: 'contact__link is-placeholder' }, [h('span', {}, label), h('span', { class: 'contact__detail' }, t('visit.notSet'))]);

const renderHours = () => {
  const text = hoursText();
  $$('[data-hours]').forEach((element) => {
    element.textContent = text[element.dataset.hours] ?? '';
    element.hidden = !element.textContent;
  });
};

const renderVisit = () => {
  const { address, mapsUrl, phone, whatsapp, email } = RESTAURANT.contact;

  const addressBox = $('[data-visit-address]');
  if (addressBox && address.length) {
    addressBox.replaceChildren(...address.flatMap((line, index) => (index ? [h('br'), line] : [line])));
  }

  const directions = $('[data-visit-directions]');
  directions?.replaceChildren(
    mapsUrl
      ? h('a', { class: 'contact__link', href: mapsUrl, target: '_blank', rel: 'noopener' }, h('span', {}, [t('visit.directions'), h('span', { 'aria-hidden': 'true' }, ' ↗')]))
      : placeholder(t('visit.directions')),
  );

  const actions = [
    { key: 'call', href: phone && telHref(phone), detail: phone },
    { key: 'whatsapp', href: whatsapp && whatsappHref(whatsapp), detail: whatsapp && `+${whatsapp.replace(/\D/g, '')}`, external: true },
    { key: 'email', href: email && mailHref(email), detail: email },
  ];
  $('[data-contact-actions]')?.replaceChildren(
    ...actions.map((action) =>
      h(
        'li',
        {},
        action.href
          ? h('a', { class: 'contact__link', href: action.href, target: action.external ? '_blank' : null, rel: action.external ? 'noopener' : null }, [
              h('span', {}, t(`visit.${action.key}`)),
              h('span', { class: 'contact__detail' }, action.detail),
            ])
          : placeholder(t(`visit.${action.key}`)),
      ),
    ),
  );

  const note = $('[data-contact-note]');
  if (note) note.hidden = !(RESTAURANT.concept && (!phone || !whatsapp || !email || !mapsUrl || !address.length));
};

export const initVisit = () => {
  renderHours();
  renderVisit();
  onLocaleChange(() => {
    renderHours();
    renderVisit();
  });
};
