/**
 * Date helpers that work with local calendar days as `YYYY-MM-DD` keys.
 * Keys avoid time-zone drift: a key always means the same calendar day.
 */

const pad = (value) => String(value).padStart(2, '0');

export const toKey = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const fromKey = (key) => {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const isValidKey = (key) => {
  if (typeof key !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(key)) return false;
  return toKey(fromKey(key)) === key;
};

export const addDays = (date, days) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

export const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const daysBetween = (fromDate, toDate) =>
  Math.round((startOfDay(toDate) - startOfDay(fromDate)) / 86_400_000);

export const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);

export const addMonths = (date, months) => new Date(date.getFullYear(), date.getMonth() + months, 1);

/** Monday-first weekday index: Monday = 0 … Sunday = 6. */
export const mondayIndex = (date) => (date.getDay() + 6) % 7;

export const minutesOf = (time) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};
