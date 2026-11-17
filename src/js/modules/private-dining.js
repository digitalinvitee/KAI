/**
 * Private dining enquiry: a short form in a dialog that writes the enquiry
 * out as an email or a WhatsApp message. The guest sends it from their own
 * app; this site sends and stores nothing. The links update as the guest
 * types, so the message is always ready (and can be copied or long-pressed).
 */
import { $, $$ } from '../core/dom.js';
import { t, formatDate, onLocaleChange } from '../i18n/i18n.js';
import { fromKey, isValidKey, toKey } from '../core/dates.js';
import { RESTAURANT } from '../../../content/restaurant.js';
import { mailHref, whatsappHref } from '../core/handoff.js';
import { normaliseSpaces } from './booking/validation.js';

export const initPrivateDining = () => {
  const dialog = $('[data-enquiry]');
  const opener = $('[data-enquiry-open]');
  if (!dialog || !opener) return;

  const form = $('[data-enquiry-form]', dialog);
  const field = (name) => $(`[data-enquiry-field="${name}"]`, dialog);
  const links = { email: $('[data-enquiry-send="email"]', dialog), whatsapp: $('[data-enquiry-send="whatsapp"]', dialog) };
  const errors = Object.fromEntries($$('[data-enquiry-error]', dialog).map((node) => [node.dataset.enquiryError, node]));
  const { email, whatsapp } = RESTAURANT.contact;

  const recipientNote = $('[data-recipient-note]', dialog);
  if (recipientNote) recipientNote.hidden = Boolean(email && whatsapp);
  field('date').min = toKey(new Date());

  const values = () => ({
    occasion: field('occasion').value,
    guests: Number(field('guests').value),
    date: field('date').value,
    name: normaliseSpaces(field('name').value),
    message: field('message').value.trim(),
  });

  const compose = () => {
    const value = values();
    const occasion = t(`private.dialog.occasions.${value.occasion}`);
    const lines = [
      t('private.message.greeting'),
      '',
      t('private.message.intro'),
      '',
      `${t('private.message.occasion')}: ${occasion}`,
      `${t('private.message.guests')}: ${value.guests || '–'}`,
      isValidKey(value.date) ? `${t('private.message.date')}: ${formatDate(fromKey(value.date), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}` : null,
      value.name ? `${t('private.message.name')}: ${value.name}` : null,
      value.message ? `\n${value.message}` : null,
      '',
      t('private.message.thanks'),
    ].filter((line) => line !== null);
    return { subject: t('private.message.subject', { occasion, guests: value.guests || '–' }), body: lines.join('\n') };
  };

  const update = () => {
    const { subject, body } = compose();
    links.email.href = mailHref(email, subject, body);
    links.whatsapp.href = whatsappHref(whatsapp, body);
  };

  const validate = () => {
    const value = values();
    const found = {
      name: value.name.length >= 2 ? null : 'private.dialog.errors.name',
      guests: Number.isInteger(value.guests) && value.guests >= 2 ? null : 'private.dialog.errors.guests',
    };
    Object.entries(errors).forEach(([name, node]) => {
      node.hidden = !found[name];
      node.textContent = found[name] ? t(found[name]) : '';
      const input = field(name);
      if (found[name]) input.setAttribute('aria-invalid', 'true');
      else input.removeAttribute('aria-invalid');
    });
    const first = ['guests', 'name'].find((name) => found[name]);
    if (first) field(first).focus();
    return !first;
  };

  Object.values(links).forEach((link) =>
    link.addEventListener('click', (event) => {
      update();
      if (!validate()) event.preventDefault();
    }),
  );

  form.addEventListener('input', update);
  form.addEventListener('change', update);
  form.addEventListener('submit', (event) => event.preventDefault());

  opener.addEventListener('click', () => {
    update();
    dialog.showModal();
    field('occasion').focus();
  });
  $('[data-enquiry-close]', dialog).addEventListener('click', () => dialog.close());
  // A click on the dimmed backdrop (outside the form) closes the dialog.
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });

  onLocaleChange(update);
  update();
};
