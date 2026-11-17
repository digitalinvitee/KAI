/**
 * Month calendar for the booking flow.
 *
 * A real <table> keeps weekday columns meaningful to screen readers. One day
 * is in the tab order at a time; arrow keys move between days (Home/End for
 * the week, Page Up/Down for the month) and Enter or Space selects.
 */
import { h } from '../../core/dom.js';
import { t, formatDate } from '../../i18n/i18n.js';
import { toKey, fromKey, addDays, startOfMonth, addMonths, mondayIndex } from '../../core/dates.js';

const REFERENCE_MONDAY = new Date(2024, 0, 1);

export const createCalendar = ({ container, today, windowDays, getStatus, getSelected, onSelect }) => {
  const firstMonth = startOfMonth(today);
  const lastDay = addDays(today, windowDays);
  const lastMonth = startOfMonth(lastDay);
  let month = firstMonth;
  let focusKey = null;

  const monthId = `calendar-month-${Math.random().toString(36).slice(2, 7)}`;
  const title = h('p', { class: 'calendar__month', id: monthId, 'aria-live': 'polite' });
  const prev = h('button', { type: 'button', class: 'calendar__nav' }, h('span', { 'aria-hidden': 'true' }, '←'));
  const next = h('button', { type: 'button', class: 'calendar__nav' }, h('span', { 'aria-hidden': 'true' }, '→'));
  const table = h('table', { class: 'calendar__table', 'aria-labelledby': monthId });
  const legend = h('ul', { class: 'calendar__legend' });

  container.replaceChildren(
    h('div', { class: 'calendar__head' }, [title, h('div', { class: 'calendar__navs' }, [prev, next])]),
    table,
    legend,
  );

  const statusLabel = (status) => {
    if (status === 'closed') return t('booking.date.closed');
    if (status === 'full') return t('booking.date.full');
    if (status === 'past' || status === 'beyond') return t('booking.date.unavailable');
    return '';
  };

  const dayButtons = () => [...table.querySelectorAll('button.day')];

  const render = () => {
    const selected = getSelected();
    const todayKey = toKey(today);
    title.textContent = formatDate(month, { month: 'long', year: 'numeric' });
    prev.disabled = month <= firstMonth;
    next.disabled = month >= lastMonth;
    prev.setAttribute('aria-label', t('booking.date.prev'));
    next.setAttribute('aria-label', t('booking.date.next'));

    const headRow = h(
      'tr',
      {},
      Array.from({ length: 7 }, (_, index) => {
        const day = addDays(REFERENCE_MONDAY, index);
        return h('th', { scope: 'col', class: 'calendar__weekday', abbr: formatDate(day, { weekday: 'long' }) },
          formatDate(day, { weekday: 'short' }).replace('.', ''));
      }),
    );

    const offset = mondayIndex(month);
    const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const cells = Array.from({ length: offset }, () => h('td', { class: 'calendar__cell' }));
    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(month.getFullYear(), month.getMonth(), day);
      const key = toKey(date);
      const status = getStatus(key);
      const enabled = status === 'available';
      const classes = ['day', status === 'closed' && 'is-closed', status === 'full' && 'is-full', key === todayKey && 'is-today']
        .filter(Boolean)
        .join(' ');
      const label = [
        formatDate(date, { weekday: 'long', day: 'numeric', month: 'long' }),
        key === todayKey ? t('booking.date.today') : '',
        statusLabel(status),
      ].filter(Boolean).join(', ');
      cells.push(
        h('td', { class: 'calendar__cell' },
          h('button', {
            type: 'button',
            class: classes,
            'aria-pressed': String(key === selected),
            'aria-disabled': enabled ? null : 'true',
            'aria-label': label,
            tabindex: '-1',
            dataset: { key },
          }, String(day)),
        ),
      );
    }
    while (cells.length % 7) cells.push(h('td', { class: 'calendar__cell' }));

    const rows = [];
    for (let index = 0; index < cells.length; index += 7) rows.push(h('tr', {}, cells.slice(index, index + 7)));
    table.replaceChildren(h('thead', {}, headRow), h('tbody', {}, rows));

    const buttons = dayButtons();
    const target =
      buttons.find((button) => button.dataset.key === focusKey) ??
      buttons.find((button) => button.dataset.key === selected) ??
      buttons.find((button) => !button.hasAttribute('aria-disabled')) ??
      buttons[0];
    if (target) target.tabIndex = 0;

    legend.replaceChildren(
      h('li', {}, [h('span', { class: 'legend-mark legend-mark--today', 'aria-hidden': 'true' }), t('booking.date.legendToday')]),
      h('li', {}, [h('span', { class: 'legend-mark legend-mark--closed', 'aria-hidden': 'true' }), t('booking.date.legendClosed')]),
      h('li', {}, [h('span', { class: 'legend-mark legend-mark--full', 'aria-hidden': 'true' }), t('booking.date.legendFull')]),
    );
  };

  const focusDate = (date) => {
    const min = today;
    const clamped = date < min ? min : date > lastDay ? lastDay : date;
    const key = toKey(clamped);
    focusKey = key;
    const targetMonth = startOfMonth(clamped);
    if (targetMonth.getTime() !== month.getTime()) {
      month = targetMonth;
      render();
    }
    dayButtons().forEach((button) => { button.tabIndex = button.dataset.key === key ? 0 : -1; });
    table.querySelector(`[data-key="${key}"]`)?.focus();
  };

  const showMonth = (target) => {
    month = target < firstMonth ? firstMonth : target > lastMonth ? lastMonth : target;
    focusKey = null;
    render();
  };

  prev.addEventListener('click', () => showMonth(addMonths(month, -1)));
  next.addEventListener('click', () => showMonth(addMonths(month, 1)));

  table.addEventListener('click', (event) => {
    const button = event.target.closest('button.day');
    if (!button || button.getAttribute('aria-disabled') === 'true') return;
    focusKey = button.dataset.key;
    onSelect(button.dataset.key);
  });

  table.addEventListener('keydown', (event) => {
    const button = event.target.closest('button.day');
    if (!button) return;
    const date = fromKey(button.dataset.key);
    const sameDayIn = (months) => {
      const target = addMonths(date, months);
      const last = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
      return new Date(target.getFullYear(), target.getMonth(), Math.min(date.getDate(), last));
    };
    const moves = {
      ArrowRight: () => addDays(date, 1),
      ArrowLeft: () => addDays(date, -1),
      ArrowDown: () => addDays(date, 7),
      ArrowUp: () => addDays(date, -7),
      Home: () => addDays(date, -mondayIndex(date)),
      End: () => addDays(date, 6 - mondayIndex(date)),
      PageDown: () => sameDayIn(1),
      PageUp: () => sameDayIn(-1),
    };
    if (!moves[event.key]) return;
    event.preventDefault();
    focusDate(moves[event.key]());
  });

  return {
    render,
    /** Re-render and put focus back on the day the user just chose. */
    renderAndRefocus: () => {
      const active = document.activeElement?.closest?.('button.day')?.dataset.key;
      render();
      if (active) table.querySelector(`[data-key="${active}"]`)?.focus();
    },
  };
};
