/**
 * KAI · demo reservation dashboard (frontend only, fictional data).
 * Reads the same demo store as the booking flow, so bookings made on the
 * website in this tab appear here, and cancellations free their seats.
 */
import { $, $$, h, prefersReducedMotion } from './core/dom.js';
import { setLocale, resolveInitialLocale, onLocaleChange, t, plural, formatDate, formatNumber } from './i18n/i18n.js';
import { initLanguageSwitchers } from './modules/language-switcher.js';
import { createReservationStore } from './demo/reservations.js';
import { RESTAURANT, ALL_TIMES, CAPACITY_PER_EVENING } from '../../content/restaurant.js';
import { toKey, fromKey, addDays, isValidKey } from './core/dates.js';

const PAGE_SIZE = 40;
const PAST_DAYS = 30;

setLocale(resolveInitialLocale(), { persist: false, silent: true });
initLanguageSwitchers();
document.documentElement.classList.remove('i18n-pending');

const store = createReservationStore();
const today = new Date();
const todayKey = toKey(today);

const els = {
  date: $('[data-filter-date]'),
  status: $('[data-filter-status]'),
  search: $('[data-filter-search]'),
  filters: $('[data-filters]'),
  overviewTitle: $('[data-overview-title]'),
  stats: $('[data-stats]'),
  seatings: $('[data-seatings]'),
  rows: $('[data-rows]'),
  table: $('[data-table]'),
  results: $('[data-results]'),
  empty: $('[data-empty]'),
  more: $('[data-more]'),
  dialog: $('[data-dialog]'),
  dialogBody: $('[data-dialog-body]'),
  resetDialog: $('[data-reset-dialog]'),
  toast: $('[data-toast]'),
};

const state = { date: todayKey, status: 'all', search: '', limit: PAGE_SIZE, openId: null, confirmingCancel: false };

els.date.min = toKey(addDays(today, -PAST_DAYS));
els.date.max = toKey(addDays(today, RESTAURANT.bookingWindowDays));

/* ── Formatting ─────────────────────────────────────────── */

const shortDate = (key) => formatDate(fromKey(key), { weekday: 'short', day: 'numeric', month: 'short' });
const longDate = (key) => formatDate(fromKey(key), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const fold = (value) => value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const statusPill = (reservation) =>
  h('span', { class: `pill pill--${reservation.status}` }, t(`dashboard.status.${reservation.status}`));

/* ── Data selection ─────────────────────────────────────── */

const overviewKey = () => state.date || todayKey;

const filtered = () => {
  const range = state.date
    ? store.reservationsOn(state.date)
    : store.reservationsBetween(todayKey, toKey(addDays(today, RESTAURANT.bookingWindowDays)));
  const query = fold(state.search.trim());
  return range
    .filter((entry) => state.status === 'all' || entry.status === state.status)
    .filter((entry) => !query || fold(entry.name).includes(query) || fold(entry.ref).includes(query))
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time) || a.name.localeCompare(b.name));
};

/* ── Rendering ──────────────────────────────────────────── */

const renderOverview = () => {
  const key = overviewKey();
  els.overviewTitle.textContent = t('dashboard.overview', { date: longDate(key) });
  const open = RESTAURANT.openWeekdays.includes(fromKey(key).getDay());
  const active = store.reservationsOn(key).filter((entry) => entry.status !== 'cancelled');
  const guests = active.reduce((sum, entry) => sum + entry.guests, 0);
  const upcoming = store
    .reservationsBetween(todayKey, toKey(addDays(today, 6)))
    .filter((entry) => entry.status === 'confirmed');
  const upcomingGuests = upcoming.reduce((sum, entry) => sum + entry.guests, 0);

  const stat = (label, value, note = '') =>
    h('div', { class: 'stat' }, [
      h('dt', { class: 'stat__label' }, label),
      h('dd', { class: 'stat__value' }, value),
      note ? h('dd', { class: 'stat__note' }, note) : null,
    ]);

  els.stats.replaceChildren(
    stat(t('dashboard.stats.reservations'), open ? formatNumber(active.length) : '—', open ? '' : t('dashboard.stats.closedNote')),
    stat(t('dashboard.stats.guests'), open ? formatNumber(guests) : '—'),
    stat(
      t('dashboard.stats.available'),
      open ? formatNumber(Math.max(0, CAPACITY_PER_EVENING - guests)) : t('dashboard.stats.closed'),
      open ? t('dashboard.stats.capacityOf', { n: formatNumber(CAPACITY_PER_EVENING) }) : t('dashboard.stats.closedNote'),
    ),
    stat(t('dashboard.stats.upcoming'), formatNumber(upcoming.length), plural('dashboard.stats.upcomingNote', upcomingGuests)),
  );

  const availability = store.availability(key, 1);
  els.seatings.replaceChildren(
    ...ALL_TIMES.map((time) => {
      const booked = open ? availability.times.find((slot) => slot.time === time)?.booked ?? 0 : 0;
      const share = Math.min(1, booked / RESTAURANT.seatsPerTime);
      return h('li', { class: `seating-bar${share >= 1 ? ' is-full' : ''}` }, [
        h('span', { class: 'seating-bar__time' }, time),
        h('span', { class: 'seating-bar__track', 'aria-hidden': 'true' }, h('span', { class: 'seating-bar__fill', style: `--share: ${share}` })),
        h('span', { class: 'seating-bar__count' }, t('dashboard.seatingsBooked', { booked: formatNumber(booked), cap: formatNumber(RESTAURANT.seatsPerTime) })),
      ]);
    }),
  );
};

const renderTable = () => {
  const list = filtered();
  const visible = list.slice(0, state.limit);
  els.results.textContent = plural('dashboard.results', list.length);
  els.empty.hidden = list.length > 0;
  els.table.hidden = list.length === 0;
  els.more.hidden = list.length <= state.limit;

  els.rows.replaceChildren(
    ...visible.map((entry) => {
      const label = (key) => t(`dashboard.columns.${key}`);
      return h('tr', { role: 'row', class: `res-row res-row--${entry.status}`, dataset: { id: entry.id } }, [
        h('td', { role: 'cell', class: 'res-cell res-cell--guest', 'data-label': label('guest') },
          h('div', { class: 'res-guest' }, [
            h('button', { type: 'button', class: 'res-open', 'aria-label': t('dashboard.openDetails', { ref: entry.ref }), dataset: { open: entry.id } }, entry.name),
            entry.source === 'session' ? h('span', { class: 'tag' }, t('dashboard.yours')) : null,
          ]),
        ),
        h('td', { role: 'cell', class: 'res-cell', 'data-label': label('date') }, shortDate(entry.date)),
        h('td', { role: 'cell', class: 'res-cell res-cell--time', 'data-label': label('time') }, entry.time),
        h('td', { role: 'cell', class: 'res-cell num', 'data-label': label('party') }, formatNumber(entry.guests)),
        h('td', { role: 'cell', class: 'res-cell', 'data-label': label('status') }, statusPill(entry)),
        h('td', { role: 'cell', class: 'res-cell res-cell--ref', 'data-label': label('reference') }, entry.ref),
      ]);
    }),
  );
};

const detailRow = (label, value) => h('div', { class: 'detail' }, [h('dt', {}, label), h('dd', {}, value)]);

const renderDialog = () => {
  const entry = state.openId ? store.findById(state.openId) : null;
  if (!entry) return;
  const notStored = h('span', { class: 'muted' }, t('dashboard.details.notStored'));
  const canCancel = entry.status === 'confirmed';

  const actions = state.confirmingCancel
    ? h('div', { class: 'dash-dialog__confirm', role: 'group', 'aria-labelledby': 'cancel-question' }, [
        h('p', { id: 'cancel-question' }, t('dashboard.details.cancelConfirm')),
        h('div', { class: 'dash-dialog__actions' }, [
          h('button', { type: 'button', class: 'button button--ghost button--compact', dataset: { action: 'keep' } }, t('dashboard.details.cancelNo')),
          h('button', { type: 'button', class: 'button button--primary button--compact', dataset: { action: 'confirm-cancel' } }, t('dashboard.details.cancelYes')),
        ]),
      ])
    : h('div', { class: 'dash-dialog__actions' }, [
        h('button', { type: 'button', class: 'button button--ghost button--compact', dataset: { action: 'close' } }, t('dashboard.details.close')),
        canCancel
          ? h('button', { type: 'button', class: 'button button--primary button--compact', dataset: { action: 'cancel' } }, t('dashboard.details.cancel'))
          : entry.status === 'completed'
            ? h('p', { class: 'muted' }, t('dashboard.details.readOnly'))
            : null,
      ]);

  els.dialogBody.replaceChildren(
    h('div', { class: 'dash-dialog__head' }, [
      h('p', { class: 'dash-dialog__eyebrow' }, [t('dashboard.details.title'), ' · ', h('span', { class: 'ref-code' }, entry.ref)]),
      h('h2', { class: 'dash-dialog__title', id: 'dialog-title' }, entry.name),
      h('div', { class: 'dash-dialog__status' }, [statusPill(entry), entry.source === 'session' ? h('span', { class: 'tag' }, t('dashboard.yours')) : null]),
    ]),
    h('dl', { class: 'details' }, [
      detailRow(t('dashboard.columns.date'), longDate(entry.date)),
      detailRow(t('dashboard.columns.time'), entry.time),
      detailRow(t('dashboard.columns.party'), plural('booking.guests.count', entry.guests)),
      detailRow(t('dashboard.details.email'), entry.email ?? notStored.cloneNode(true)),
      detailRow(t('dashboard.details.phone'), entry.phone ?? notStored.cloneNode(true)),
      detailRow(
        t('dashboard.details.note'),
        entry.noteKey ? t(`seedNotes.${entry.noteKey}`) : entry.hasRequest ? notStored.cloneNode(true) : '—',
      ),
      detailRow(t('dashboard.details.source'), entry.source === 'session' ? t('dashboard.details.sourceSession') : t('dashboard.details.sourceSeed')),
      detailRow(t('dashboard.details.created'), longDate(entry.createdAt)),
    ]),
    actions,
  );
};

const render = () => {
  renderOverview();
  renderTable();
  if (els.dialog.open) renderDialog();
};

/* ── Feedback ───────────────────────────────────────────── */

let toastTimer = 0;
const toast = (message) => {
  window.clearTimeout(toastTimer);
  els.toast.textContent = message;
  els.toast.classList.add('is-visible');
  toastTimer = window.setTimeout(() => els.toast.classList.remove('is-visible'), 3200);
};

/* ── Dialog ─────────────────────────────────────────────── */

let returnFocus = null;

const openDialog = (id, focusAfterClose = document.activeElement) => {
  state.openId = id;
  state.confirmingCancel = false;
  returnFocus = focusAfterClose;
  renderDialog();
  if (typeof els.dialog.showModal === 'function') els.dialog.showModal();
  else els.dialog.setAttribute('open', '');
  $('[data-action="close"]', els.dialogBody)?.focus();
};

const closeDialog = () => {
  if (typeof els.dialog.close === 'function' && els.dialog.open) els.dialog.close();
  else els.dialog.removeAttribute('open');
};

els.dialog.addEventListener('close', () => {
  state.openId = null;
  state.confirmingCancel = false;
  const id = returnFocus?.dataset?.open;
  const target = id ? $(`[data-open="${id}"]`) : returnFocus;
  (target?.isConnected ? target : $('[data-filter-date]'))?.focus();
});

els.dialog.addEventListener('click', (event) => {
  if (event.target === els.dialog) {
    closeDialog();
    return;
  }
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (!action) return;
  if (action === 'close') closeDialog();
  if (action === 'cancel') {
    state.confirmingCancel = true;
    renderDialog();
    $('[data-action="keep"]', els.dialogBody)?.focus();
  }
  if (action === 'keep') {
    state.confirmingCancel = false;
    renderDialog();
    $('[data-action="cancel"]', els.dialogBody)?.focus();
  }
  if (action === 'confirm-cancel') {
    state.confirmingCancel = false;
    const result = store.cancelReservation(state.openId);
    if (result.ok) toast(t('dashboard.details.cancelled', { ref: result.reservation.ref }));
    $('[data-action="close"]', els.dialogBody)?.focus();
  }
});

/* ── Filters ────────────────────────────────────────────── */

const applyFilters = () => {
  state.date = isValidKey(els.date.value) ? els.date.value : '';
  state.status = els.status.value;
  state.search = els.search.value;
  state.limit = PAGE_SIZE;
  render();
};

els.filters.addEventListener('submit', (event) => event.preventDefault());
els.date.addEventListener('change', applyFilters);
els.status.addEventListener('change', applyFilters);
els.search.addEventListener('input', applyFilters);

$$('[data-quick]').forEach((button) =>
  button.addEventListener('click', () => {
    els.date.value = button.dataset.quick === 'today' ? todayKey : '';
    applyFilters();
  }),
);

$$('[data-clear]').forEach((button) =>
  button.addEventListener('click', () => {
    els.date.value = todayKey;
    els.status.value = 'all';
    els.search.value = '';
    applyFilters();
    els.date.focus();
  }),
);

els.more.addEventListener('click', () => {
  state.limit += PAGE_SIZE;
  renderTable();
});

els.rows.addEventListener('click', (event) => {
  const button = event.target.closest('[data-open]');
  if (button) {
    openDialog(button.dataset.open);
    return;
  }
  const row = event.target.closest('tr[data-id]');
  if (row && !window.getSelection()?.toString()) openDialog(row.dataset.id, $('[data-open]', row));
});

/* ── Reset ──────────────────────────────────────────────── */

$('[data-reset]').addEventListener('click', () => {
  if (typeof els.resetDialog.showModal === 'function') els.resetDialog.showModal();
  $('[data-reset-cancel]', els.resetDialog)?.focus();
});
$('[data-reset-cancel]', els.resetDialog).addEventListener('click', () => els.resetDialog.close());
$('[data-reset-confirm]', els.resetDialog).addEventListener('click', () => {
  store.reset();
  els.resetDialog.close();
  toast(t('dashboard.resetDone'));
  $('[data-reset]').focus();
});

/* ── Start ──────────────────────────────────────────────── */

store.subscribe(render);
onLocaleChange(render);

const params = new URLSearchParams(window.location.search);
const requestedRef = params.get('ref');
els.date.value = todayKey;
if (requestedRef) {
  const match = store
    .reservationsBetween(toKey(addDays(today, -PAST_DAYS)), toKey(addDays(today, RESTAURANT.bookingWindowDays)))
    .find((entry) => entry.ref === requestedRef);
  if (match) els.date.value = match.date;
  applyFilters();
  if (match) {
    const highlight = $(`tr[data-id="${match.id}"]`);
    highlight?.classList.add('is-highlighted');
    highlight?.scrollIntoView({ block: 'center', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    openDialog(match.id, $('[data-open]', highlight ?? document));
  }
} else {
  applyFilters();
}
