/**
 * Booking flow: table → details → review, in one of three modes set in
 * content/restaurant.js (the concept also offers a switch to compare them):
 *
 *   demo      Portfolio demo. Availability comes from the demo store, is
 *             re-checked when the guest count changes and again on confirming;
 *             repeated clicks cannot create a second booking. Ends in a demo
 *             confirmation and the demo dashboard. Nothing leaves the browser.
 *   request   For restaurants without a booking system. Same three steps, no
 *             simulated availability; the review step writes the request out
 *             as a WhatsApp or email message the guest sends themselves, and
 *             the restaurant confirms by reply.
 *   provider  For restaurants with a booking provider: the form gives way to
 *             a link to the restaurant's page on that provider.
 */
import { $, $$, h, wait, prefersReducedMotion, headerOffset, scrollToY } from '../../core/dom.js';
import { t, plural, formatDate, formatNumber, onLocaleChange } from '../../i18n/i18n.js';
import { RESTAURANT } from '../../../../content/restaurant.js';
import { fromKey } from '../../core/dates.js';
import { whatsappHref, mailHref, telHref } from '../../core/handoff.js';
import { createCalendar } from './calendar.js';
import { validateTable, validateDetails, validateName, validateEmail, validatePhone, validateRequests, countErrors, LIMITS, normaliseSpaces } from './validation.js';

const CHECK_DELAY = 360;
const CONFIRM_DELAY = 800;
const TOTAL_STEPS = 3;
const MODES = ['demo', 'request', 'provider'];
const FIELD_VALIDATORS = { name: validateName, email: validateEmail, phone: validatePhone, requests: validateRequests };
const FIELD_ORDER = ['date', 'time', 'name', 'email', 'phone', 'requests'];
/** In request mode, the guest's own WhatsApp or email already identifies them. */
const OPTIONAL_IN_REQUEST = ['email', 'phone'];
const UNREQUESTABLE = ['past', 'closed', 'beyond', 'invalid'];

export const initBooking = ({ store }) => {
  const form = $('[data-booking]');
  if (!form) return;

  const els = {
    markers: $$('[data-step-marker]', form),
    sections: $$('[data-step]', form),
    live: $('[data-booking-live]', form),
    summary: $('[data-error-summary]', form),
    guestPicker: $('[data-guest-picker]', form),
    slots: $('[data-slots]', form),
    slotsStatus: $('[data-slots-status]', form),
    review: $('[data-review]', form),
    confirmation: $('[data-confirmation]', form),
    actions: $('[data-booking-actions]', form),
    back: $('[data-action="back"]', form),
    next: $('[data-action="next"]', form),
    nextLabel: $('[data-next-label]', form),
    dashboardLink: $('[data-dashboard-link]', form),
    count: $('[data-requests-count]', form),
    fields: Object.fromEntries($$('[data-field]', form).map((input) => [input.dataset.field, input])),
    errors: Object.fromEntries($$('[data-error-for]', form).map((node) => [node.dataset.errorFor, node])),
    handoff: $('[data-handoff]', form),
    handoffMessage: $('[data-handoff-message]', form),
    handoffLinks: Object.fromEntries($$('[data-handoff-link]', form).map((link) => [link.dataset.handoffLink, link])),
    handoffCall: $('[data-handoff-call]', form),
    handoffStatus: $('[data-handoff-status]', form),
    modes: $('[data-booking-modes]'),
    modeNote: $('[data-booking-mode-note]'),
    notices: $$('[data-mode-notice]'),
    modeTexts: $$('[data-mode-text]', form),
    provider: $('[data-booking-provider]'),
  };

  const dashboardBase = els.dashboardLink.getAttribute('href');
  const { contact } = RESTAURANT;

  const state = {
    mode: MODES.includes(RESTAURANT.booking.mode) ? RESTAURANT.booking.mode : 'demo',
    step: 1,
    date: null,
    guests: 2,
    time: null,
    checking: false,
    availability: null,
    errors: {},
    touched: {},
    submitting: false,
    submissionId: null,
    reservation: null,
  };

  const isRequest = () => state.mode === 'request';
  const guestsText = (count = state.guests) => plural('booking.guests.count', count);

  const announce = (message) => {
    els.live.textContent = '';
    window.setTimeout(() => { els.live.textContent = message; }, 60);
  };

  /* ── Errors ────────────────────────────────────────────── */

  const errorMessage = (key) => t(`booking.errors.${key}`, { guests: guestsText(), max: LIMITS.requestsMax });

  const renderFieldErrors = () => {
    Object.entries(els.errors).forEach(([field, node]) => {
      const key = state.errors[field];
      node.hidden = !key;
      node.textContent = key ? errorMessage(key) : '';
      const input = els.fields[field];
      if (input) {
        if (key) input.setAttribute('aria-invalid', 'true');
        else input.removeAttribute('aria-invalid');
      }
    });
  };

  const hideSummary = () => {
    els.summary.hidden = true;
    els.summary.replaceChildren();
  };

  const targetFor = (field) => {
    if (field === 'date') return $('[data-calendar] button.day[tabindex="0"]', form);
    if (field === 'time') return $('[data-slots] input:not(:disabled)', form) ?? $('[data-calendar] button.day[tabindex="0"]', form);
    return els.fields[field];
  };

  const showErrors = (errors, { focus = true } = {}) => {
    state.errors = { ...state.errors, ...errors };
    renderFieldErrors();
    const invalid = FIELD_ORDER.filter((field) => errors[field]);
    if (!invalid.length) return;
    els.summary.replaceChildren(
      h('p', {}, plural('booking.errors.summary', invalid.length)),
      h('ul', {}, invalid.map((field) => h('li', {}, h('a', { href: `#booking-error-${field}`, dataset: { focusField: field } }, errorMessage(errors[field]))))),
    );
    els.summary.hidden = false;
    if (!focus) return;
    els.summary.focus({ preventScroll: true });
    const top = els.summary.getBoundingClientRect().top;
    if (top < headerOffset() || top > window.innerHeight * 0.7) scrollToY(window.scrollY + top - headerOffset() - 24);
  };

  const clearError = (field) => {
    if (!state.errors[field]) return;
    state.errors = { ...state.errors, [field]: null };
    renderFieldErrors();
    if (!countErrors(state.errors)) hideSummary();
  };

  els.summary.addEventListener('click', (event) => {
    const link = event.target.closest('[data-focus-field]');
    if (!link) return;
    event.preventDefault();
    targetFor(link.dataset.focusField)?.focus();
  });

  /* ── Step 1 · table ───────────────────────────────────── */

  /** In request mode only the schedule matters: the restaurant confirms availability itself. */
  const dayStatus = (key) => {
    const status = store.dayStatus(key, state.guests);
    return isRequest() && status === 'full' ? 'available' : status;
  };

  const availabilityFor = (key) => {
    const result = store.availability(key, state.guests);
    if (!isRequest()) return result;
    const times = result.times.map((slot) => {
      const blocked = UNREQUESTABLE.includes(slot.reason);
      return { ...slot, available: !blocked, reason: blocked ? slot.reason : null };
    });
    return { ...result, times, availableCount: times.filter((slot) => slot.available).length };
  };

  const calendar = createCalendar({
    container: $('[data-calendar]', form),
    today: new Date(),
    windowDays: RESTAURANT.bookingWindowDays,
    getStatus: (key) => dayStatus(key),
    getSelected: () => state.date,
    onSelect: (key) => selectDate(key),
  });

  const renderGuests = () => {
    els.guestPicker.replaceChildren(
      ...Array.from({ length: RESTAURANT.maxPartySize }, (_, index) => {
        const count = index + 1;
        return h('label', { class: 'guest-option' }, [
          h('input', { type: 'radio', name: 'guests', value: count, checked: count === state.guests, 'aria-label': guestsText(count) }),
          h('span', { class: 'guest-option__box', 'aria-hidden': 'true' }, formatNumber(count)),
        ]);
      }),
    );
  };

  const slotMeta = (slot) => {
    if (isRequest()) return slot.available ? t('booking.request.slot') : t('booking.time.past');
    if (slot.available) return slot.remaining <= 3 ? plural('booking.time.seatsLeft', slot.remaining) : t('booking.time.available');
    if (slot.reason === 'full') return t('booking.time.full');
    if (slot.reason === 'tooSmall') return t('booking.time.tooSmall');
    if (slot.reason === 'past') return t('booking.time.past');
    return t('booking.date.unavailable');
  };

  const renderSlots = ({ fresh = false } = {}) => {
    els.slots.classList.toggle('is-fresh', fresh);
    if (!state.date) {
      els.slots.replaceChildren();
      els.slots.removeAttribute('aria-busy');
      els.slotsStatus.textContent = t('booking.time.pickDate');
      return;
    }

    const seatingLabel = (seating) => t(`booking.time.seatings.${seating.id}`);

    if (state.checking || !state.availability) {
      els.slots.setAttribute('aria-busy', 'true');
      els.slotsStatus.textContent = t('booking.time.checking');
      els.slots.replaceChildren(
        ...RESTAURANT.seatings.map((seating) =>
          h('div', { class: 'seating', 'aria-hidden': 'true' }, [
            h('span', { class: 'seating__label' }, seatingLabel(seating)),
            h('div', { class: 'seating__row' }, seating.times.map(() => h('div', { class: 'slot-skeleton' }))),
          ]),
        ),
      );
      return;
    }

    els.slots.removeAttribute('aria-busy');
    const { times, availableCount } = state.availability;
    if (isRequest()) els.slotsStatus.textContent = availableCount ? t('booking.request.timesHint') : t('booking.request.noTimes');
    else {
      els.slotsStatus.textContent = availableCount
        ? plural('booking.time.summary', availableCount, { total: times.length })
        : t('booking.time.none', { guests: guestsText() });
    }

    let index = 0;
    els.slots.replaceChildren(
      ...RESTAURANT.seatings.map((seating) =>
        h('fieldset', { class: 'seating' }, [
          h('legend', { class: 'seating__label' }, seatingLabel(seating)),
          h(
            'div',
            { class: 'seating__row' },
            seating.times.map((time) => {
              const slot = times.find((entry) => entry.time === time);
              const meta = slotMeta(slot);
              const low = !isRequest() && slot.available && slot.remaining <= 3;
              return h('label', { class: `slot${low ? ' is-low' : ''}`, style: `--i: ${index++}` }, [
                h('input', {
                  type: 'radio',
                  name: 'time',
                  value: time,
                  checked: state.time === time,
                  disabled: !slot.available,
                  'aria-label': `${time}, ${meta}`,
                }),
                h('span', { class: 'slot__box', 'aria-hidden': 'true' }, [
                  h('span', { class: 'slot__time' }, time),
                  h('span', { class: 'slot__meta' }, meta),
                ]),
              ]);
            }),
          ),
        ]),
      ),
    );
  };

  let checkToken = 0;
  const checkAvailability = ({ keepTime = true } = {}) => {
    if (!state.date) return;
    const token = ++checkToken;
    state.checking = true;
    renderSlots();
    // The demo pauses as a real availability check would; a request needs no check.
    window.setTimeout(() => {
      if (token !== checkToken) return;
      state.checking = false;
      state.availability = availabilityFor(state.date);
      if (state.time) {
        const slot = state.availability.times.find((entry) => entry.time === state.time);
        if (!slot?.available) {
          state.time = null;
          if (keepTime) showFieldError('time', 'timeCleared');
        }
      }
      renderSlots({ fresh: true });
      announce(els.slotsStatus.textContent);
    }, prefersReducedMotion() || isRequest() ? 0 : CHECK_DELAY);
  };

  const selectDate = (key) => {
    clearError('date');
    if (state.date === key) return;
    state.date = key;
    state.availability = null;
    calendar.renderAndRefocus();
    checkAvailability();
  };

  els.guestPicker.addEventListener('change', (event) => {
    if (event.target.name !== 'guests') return;
    state.guests = Number(event.target.value);
    calendar.render();
    checkAvailability();
  });

  els.slots.addEventListener('change', (event) => {
    if (event.target.name !== 'time') return;
    state.time = event.target.value;
    clearError('time');
  });

  /* ── Step 2 · details ─────────────────────────────────── */

  const readFields = () => ({
    name: els.fields.name.value,
    email: els.fields.email.value,
    phone: els.fields.phone.value,
    requests: els.fields.requests.value,
  });

  const validateField = (field, value) =>
    isRequest() && OPTIONAL_IN_REQUEST.includes(field) && !String(value).trim() ? null : FIELD_VALIDATORS[field](value);

  const validateAllDetails = (values) =>
    isRequest() ? Object.fromEntries(Object.keys(FIELD_VALIDATORS).map((field) => [field, validateField(field, values[field])])) : validateDetails(values);

  const updateCount = () => {
    const length = els.fields.requests.value.length;
    els.count.textContent = t('booking.fields.counter', { n: formatNumber(length), max: formatNumber(LIMITS.requestsMax) });
    els.count.classList.toggle('is-over', length > LIMITS.requestsMax);
  };

  Object.entries(els.fields).forEach(([field, input]) => {
    input.addEventListener('blur', () => {
      if (!input.value && !state.touched[field]) return;
      state.touched[field] = true;
      const error = validateField(field, input.value);
      if (error) showFieldError(field, error);
      else clearError(field);
    });
    input.addEventListener('input', () => {
      if (field === 'requests') updateCount();
      if (state.errors[field] && !validateField(field, input.value)) clearError(field);
    });
  });

  const showFieldError = (field, key) => {
    state.errors = { ...state.errors, [field]: key };
    renderFieldErrors();
  };

  /* ── Step 3 · review ──────────────────────────────────── */

  const longDate = (key) => formatDate(fromKey(key), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const renderReview = () => {
    const values = readFields();
    const optional = (value) => value.trim() || t('booking.review.none');
    const rows = [
      { label: t('booking.review.date'), value: longDate(state.date), step: 1, field: 'date', key: true },
      { label: t('booking.review.time'), value: state.time, step: 1, field: 'time', key: true },
      { label: t('booking.review.guests'), value: guestsText(), step: 1, field: 'guests', key: true },
      { label: t('booking.review.name'), value: normaliseSpaces(values.name), step: 2, field: 'name' },
      { label: t('booking.review.email'), value: optional(values.email), step: 2, field: 'email' },
      { label: t('booking.review.phone'), value: optional(values.phone), step: 2, field: 'phone' },
      { label: t('booking.review.requests'), value: optional(values.requests), step: 2, field: 'requests' },
    ];
    els.review.replaceChildren(
      ...rows.map((row) =>
        h('div', { class: `review__row${row.key ? ' review__row--key' : ''}` }, [
          h('dt', {}, row.label),
          h('dd', {}, [
            h('span', { class: 'review__value' }, row.value),
            h('button', {
              type: 'button',
              class: 'review__edit',
              'aria-label': t('booking.review.editLabel', { field: row.label }),
              dataset: { edit: row.step, field: row.field },
            }, t('booking.review.edit')),
          ]),
        ]),
      ),
    );
    if (isRequest()) renderHandoff();
  };

  /* Request mode: the request written out, ready for the guest's WhatsApp or email. */
  const requestMessage = () => {
    const values = readFields();
    const line = (key, value) => (value ? `${t(`booking.request.message.${key}`)}: ${value}` : null);
    const lines = [
      t('booking.request.message.greeting'),
      '',
      t('booking.request.message.intro'),
      '',
      line('date', longDate(state.date)),
      line('time', state.time),
      line('guests', formatNumber(state.guests)),
      line('name', normaliseSpaces(values.name)),
      line('phone', values.phone.trim()),
      line('email', values.email.trim()),
      line('requests', values.requests.trim()),
      '',
      t('booking.request.message.thanks'),
    ].filter((entry) => entry !== null);
    return {
      subject: t('booking.request.message.subject', { date: longDate(state.date), time: state.time, guests: guestsText() }),
      body: lines.join('\n'),
    };
  };

  const renderHandoff = () => {
    const { subject, body } = requestMessage();
    els.handoffMessage.textContent = body;
    els.handoffLinks.whatsapp.href = whatsappHref(contact.whatsapp, body);
    els.handoffLinks.email.href = mailHref(contact.email, subject, body);
    const note = $('[data-recipient-note]', els.handoff);
    if (note) note.hidden = Boolean(contact.whatsapp && contact.email);
    els.handoffCall.replaceChildren(
      ...(contact.phone
        ? [t('booking.request.callPrefix'), ' ', h('a', { href: telHref(contact.phone) }, contact.phone)]
        : [t('booking.request.callPlaceholder')]),
    );
  };

  els.handoff.addEventListener('click', (event) => {
    const link = event.target.closest('[data-handoff-link]');
    if (!link) return;
    renderHandoff();
    els.handoffStatus.textContent = t(`booking.request.opened.${link.dataset.handoffLink}`);
  });

  /* ── Step 4 · confirmation (demo) ─────────────────────── */

  const ticketCell = (label, value, modifier = '') =>
    h('div', { class: `ticket__cell${modifier}` }, [
      h('span', { class: 'ticket__label' }, label),
      h('span', { class: `ticket__value${modifier.includes('wide') ? ' ticket__value--code' : ''}` }, value),
    ]);

  const renderConfirmation = () => {
    const reservation = state.reservation;
    if (!reservation) return;
    els.confirmation.replaceChildren(
      h('div', { class: 'ticket' }, [
        ticketCell(t('booking.confirmation.reference'), reservation.ref, ' ticket__cell--wide'),
        ticketCell(t('booking.review.date'), formatDate(fromKey(reservation.date), { weekday: 'short', day: 'numeric', month: 'short' })),
        ticketCell(t('booking.review.time'), reservation.time),
        ticketCell(t('booking.review.guests'), guestsText(reservation.guests)),
        ticketCell(t('booking.review.name'), reservation.name),
      ]),
    );
    els.dashboardLink.href = `${dashboardBase}?ref=${encodeURIComponent(reservation.ref)}`;
  };

  /* ── Navigation between steps ─────────────────────────── */

  const renderStepper = () => {
    els.markers.forEach((marker) => {
      const number = Number(marker.dataset.stepMarker);
      marker.classList.toggle('is-current', number === state.step);
      marker.classList.toggle('is-done', number < state.step);
      if (number === state.step) marker.setAttribute('aria-current', 'step');
      else marker.removeAttribute('aria-current');
    });
  };

  const renderActions = () => {
    els.actions.hidden = state.step > TOTAL_STEPS;
    els.back.hidden = state.step === 1;
    const handoffStep = isRequest() && state.step === TOTAL_STEPS;
    els.next.hidden = handoffStep;
    els.handoff.hidden = !handoffStep;
    let labelKey = state.step === 1 ? 'continue' : state.step === 2 ? 'review' : state.submitting ? 'confirming' : 'confirm';
    if (isRequest() && state.step === 2) labelKey = 'reviewRequest';
    els.nextLabel.dataset.i18n = `booking.actions.${labelKey}`;
    els.nextLabel.textContent = t(`booking.actions.${labelKey}`);
    els.next.disabled = state.submitting;
    if (state.submitting) els.next.setAttribute('aria-busy', 'true');
    else els.next.removeAttribute('aria-busy');
  };

  const stepTitle = (step) => (step === 3 ? t(`booking.reviewTitle.${state.mode}`) : t(`booking.stepTitles.${step - 1}`));

  const showStep = (step) => {
    state.step = step;
    hideSummary();
    els.sections.forEach((section) => {
      const active = Number(section.dataset.step) === step;
      section.hidden = !active;
      section.classList.remove('is-entering');
      if (active) {
        void section.offsetWidth;
        section.classList.add('is-entering');
      }
    });
    if (step === 3) {
      state.submissionId = `submission-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
      els.handoffStatus.textContent = '';
      renderReview();
    }
    renderStepper();
    renderActions();
  };

  const goTo = (step, { focusField = null } = {}) => {
    showStep(step);
    const top = form.getBoundingClientRect().top;
    if (top < headerOffset() || top > window.innerHeight * 0.5) scrollToY(window.scrollY + top - headerOffset() - 16);

    const target = focusField ? targetFor(focusField) ?? $(`[data-step="${step}"] input`, form) : $(`#booking-step-${step}-title`, form);
    target?.focus({ preventScroll: true });
    if (step <= TOTAL_STEPS) announce(`${t('booking.stepOf', { n: step, total: TOTAL_STEPS })}: ${stepTitle(step)}`);
  };

  const confirmReservation = async () => {
    if (state.submitting) return;
    state.submitting = true;
    renderActions();
    announce(t('booking.actions.confirming'));
    await wait(prefersReducedMotion() ? 120 : CONFIRM_DELAY);

    const values = readFields();
    const result = store.createReservation({
      date: state.date,
      time: state.time,
      guests: state.guests,
      name: normaliseSpaces(values.name),
      hasRequest: Boolean(values.requests.trim()),
      submissionId: state.submissionId,
    });
    state.submitting = false;

    if (!result.ok) {
      state.availability = null;
      state.time = null;
      goTo(1);
      calendar.render();
      checkAvailability({ keepTime: false });
      showErrors({ time: ['full', 'tooSmall', 'past'].includes(result.code) ? 'slotTaken' : 'generic' });
      return;
    }

    state.reservation = result.reservation;
    Object.values(els.fields).forEach((input) => { input.value = ''; });
    state.touched = {};
    updateCount();
    renderConfirmation();
    calendar.render();
    goTo(4);
  };

  const advance = () => {
    if (state.submitting) return;
    if (state.step === 1) {
      if (state.checking) return;
      const errors = validateTable(state);
      if (countErrors(errors)) return showErrors(errors);
      goTo(2);
      return;
    }
    if (state.step === 2) {
      const errors = validateAllDetails(readFields());
      Object.keys(FIELD_VALIDATORS).forEach((field) => { state.touched[field] = true; });
      state.errors = { ...state.errors, name: null, email: null, phone: null, requests: null };
      if (countErrors(errors)) return showErrors(errors);
      renderFieldErrors();
      goTo(3);
      return;
    }
    if (state.step === 3 && !isRequest()) confirmReservation();
  };

  const restart = () => {
    Object.assign(state, { step: 1, date: null, time: null, availability: null, errors: {}, touched: {}, reservation: null, submissionId: null });
    renderFieldErrors();
    calendar.render();
    renderSlots();
    goTo(1);
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    advance();
  });
  els.back.addEventListener('click', () => goTo(Math.max(1, state.step - 1)));
  form.addEventListener('click', (event) => {
    const edit = event.target.closest('[data-edit]');
    if (edit) goTo(Number(edit.dataset.edit), { focusField: edit.dataset.field === 'guests' ? null : edit.dataset.field });
    if (event.target.closest('[data-action="restart"]')) restart();
  });

  /* ── Modes ────────────────────────────────────────────── */

  const setText = (element, key) => {
    element.dataset.i18n = key;
    element.textContent = t(key);
  };

  const renderProvider = () => {
    if (!els.provider) return;
    const link = $('[data-provider-link]', els.provider);
    const label = $('[data-provider-label]', els.provider);
    const { providerUrl, providerName } = RESTAURANT.booking;
    if (providerUrl) {
      link.href = providerUrl;
      link.removeAttribute('aria-disabled');
    } else {
      link.removeAttribute('href');
      link.setAttribute('aria-disabled', 'true');
    }
    if (providerUrl && providerName) {
      delete label.dataset.i18n;
      label.textContent = t('booking.provider.buttonNamed', { provider: providerName });
    } else setText(label, 'booking.provider.button');
    $('[data-provider-call]', els.provider).replaceChildren(
      ...(contact.phone
        ? [t('booking.request.callPrefix'), ' ', h('a', { href: telHref(contact.phone) }, contact.phone)]
        : [t('booking.request.callPlaceholder')]),
    );
  };

  const applyMode = () => {
    const mode = state.mode;
    form.dataset.mode = mode;
    form.hidden = mode === 'provider';
    if (els.provider) els.provider.hidden = mode !== 'provider';
    form.dataset.i18nAttr = `aria-label:booking.formLabel.${mode === 'provider' ? 'demo' : mode}`;
    form.setAttribute('aria-label', t(`booking.formLabel.${mode === 'provider' ? 'demo' : mode}`));
    els.modeTexts.forEach((element) => setText(element, `${element.dataset.modeText}.${mode === 'provider' ? 'demo' : mode}`));
    els.notices.forEach((notice) => {
      const [title, text] = $$('[data-i18n]', notice);
      setText(title, `booking.notices.${mode}.title`);
      setText(text, `booking.notices.${mode}.text`);
    });
    if (els.modeNote) setText(els.modeNote, `booking.modes.notes.${mode}`);
    OPTIONAL_IN_REQUEST.forEach((field) => {
      els.fields[field].required = mode !== 'request';
    });
    renderProvider();
  };

  const setMode = (mode) => {
    if (!MODES.includes(mode) || mode === state.mode) return;
    state.mode = mode;
    state.errors = {};
    state.reservation = null;
    renderFieldErrors();
    applyMode();
    showStep(1);
    calendar.render();
    if (state.date) {
      state.availability = null;
      checkAvailability();
    } else renderSlots();
    announce(t(`booking.modes.notes.${mode}`));
  };

  if (els.modes) {
    els.modes.hidden = !RESTAURANT.booking.showModeSwitch;
    const current = $(`input[value="${state.mode}"]`, els.modes);
    if (current) current.checked = true;
    els.modes.addEventListener('change', (event) => {
      if (event.target.name === 'booking-mode') setMode(event.target.value);
    });
  }

  /* ── Language changes keep every selection ────────────── */

  onLocaleChange(() => {
    renderGuests();
    calendar.render();
    renderSlots();
    renderFieldErrors();
    if (!els.summary.hidden) {
      const errors = Object.fromEntries(Object.entries(state.errors).filter(([, key]) => key));
      showErrors(errors, { focus: false });
    }
    updateCount();
    renderActions();
    renderProvider();
    if (state.step === 3) renderReview();
    if (state.step === 4) renderConfirmation();
  });

  applyMode();
  renderGuests();
  calendar.render();
  renderSlots();
  updateCount();
  renderStepper();
  renderActions();
};
