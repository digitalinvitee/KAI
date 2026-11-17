/**
 * Opening days and times as text, in the reader's language, generated from
 * content/restaurant.js. Change the hours there and every mention follows.
 */
const WEEK = Object.freeze([1, 2, 3, 4, 5, 6, 0]); // Monday first

/**
 * Short weekday name. 7 January 2024 was a Sunday, so 7 + n falls on weekday n.
 * A trailing full stop is dropped ("Di." → "Di"), as German typesetting does for
 * two-letter weekday abbreviations.
 */
const dayName = (day, intl) =>
  new Intl.DateTimeFormat(intl, { weekday: 'short' }).format(new Date(2024, 0, 7 + day)).replace(/\.$/, '');

/** Groups weekdays into runs of consecutive days; the week wraps, so Sunday + Monday is one run. */
export const dayRuns = (days) => {
  const set = new Set(days);
  if (set.size === 7) return [[...WEEK]];
  return WEEK.filter((day) => set.has(day) && !set.has((day + 6) % 7)).map((start) => {
    const run = [start];
    for (let day = (start + 1) % 7; set.has(day) && run.length < 7; day = (day + 1) % 7) run.push(day);
    return run;
  });
};

/** [2, 3, 4, 5, 6] → "Tue – Sat"; [0, 1] → "Sun and Mon". */
export const formatDays = (days, intl) => {
  const list = new Intl.ListFormat(intl, { style: 'long', type: 'conjunction' });
  const parts = dayRuns(days).map((run) =>
    run.length > 2
      ? `${dayName(run[0], intl)} – ${dayName(run[run.length - 1], intl)}`
      : list.format(run.map((day) => dayName(day, intl))),
  );
  return list.format(parts);
};

export const closedDays = (openDays) => [0, 1, 2, 3, 4, 5, 6].filter((day) => !openDays.includes(day));

/** "17:30 – 18:30 and 20:30 – 21:30" for the seatings' first and last start times. */
export const formatSeatings = (seatings, intl) =>
  new Intl.ListFormat(intl, { style: 'long', type: 'conjunction' }).format(
    seatings.map((seating) => `${seating.times[0]} – ${seating.times[seating.times.length - 1]}`),
  );
