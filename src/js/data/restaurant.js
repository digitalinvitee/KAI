/**
 * KAI — fictional restaurant configuration.
 *
 * Everything the demo booking flow and the demo dashboard know about
 * opening hours and capacity lives here. Change a value once and both
 * pages follow. None of this describes a real business.
 */
export const RESTAURANT = Object.freeze({
  name: 'KAI',

  /** Weekdays with service, using Date#getDay(): 0 = Sunday … 6 = Saturday. */
  openWeekdays: Object.freeze([2, 3, 4, 5, 6]), // Tuesday – Saturday

  /** Display hours (used in copy only). */
  hours: Object.freeze({ open: '17:30', close: '23:00' }),

  /**
   * Two seatings per evening. Each start time accepts up to
   * `seatsPerTime` guests, so one evening holds 6 × 9 = 54 covers
   * across a 10-seat counter and an 18-seat dining room.
   */
  seatings: Object.freeze([
    Object.freeze({ id: 'early', times: Object.freeze(['17:30', '18:00', '18:30']) }),
    Object.freeze({ id: 'late', times: Object.freeze(['20:30', '21:00', '21:30']) }),
  ]),
  seatsPerTime: 9,
  maxPartySize: 8,

  /** How far ahead the calendar lets guests book. */
  bookingWindowDays: 60,

  /** Last moment a same-day booking is accepted, in minutes before the start time. */
  sameDayCutoffMinutes: 60,
});

export const ALL_TIMES = Object.freeze(RESTAURANT.seatings.flatMap((seating) => seating.times));
export const CAPACITY_PER_EVENING = ALL_TIMES.length * RESTAURANT.seatsPerTime;
