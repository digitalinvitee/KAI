/**
 * KAI · RESTAURANT SETTINGS — opening times, seatings, contact details and how
 * bookings work. Change a value here and every part of the site follows: the
 * booking calendar, the demo dashboard, the opening hours shown on the page and
 * the contact buttons. Guide: content/README.md.
 *
 * KAI is a fictional restaurant. While `concept` is true, contact details that
 * are left empty appear as labelled placeholders, and nothing can be dialled,
 * messaged or mapped by accident.
 */
export const RESTAURANT = Object.freeze({
  name: 'KAI',
  concept: true,

  /** Weekdays with service, using Date#getDay(): 0 = Sunday … 6 = Saturday. */
  openWeekdays: Object.freeze([2, 3, 4, 5, 6]), // Tuesday – Saturday

  /** Opening hours, 24-hour clock. Shown wherever the site lists the hours. */
  hours: Object.freeze({ open: '17:30', close: '23:00' }),

  /**
   * Two seatings per evening. Each start time accepts up to `seatsPerTime`
   * guests, so one evening holds 6 × 9 = 54 covers across the ten-seat counter
   * and the eighteen-seat dining room.
   */
  seatings: Object.freeze([
    Object.freeze({ id: 'early', times: Object.freeze(['17:30', '18:00', '18:30']) }),
    Object.freeze({ id: 'late', times: Object.freeze(['20:30', '21:00', '21:30']) }),
  ]),
  seatsPerTime: 9,

  /** Largest party for an online booking. Larger groups are pointed to private dining. */
  maxPartySize: 8,

  /** How far ahead guests can book, in days. */
  bookingWindowDays: 60,

  /** Same-day bookings close this many minutes before the start time. */
  sameDayCutoffMinutes: 60,

  contact: Object.freeze({
    /** As it should be shown, with country code. Example: '+49 30 1234 5678' */
    phone: '',
    /** WhatsApp number, digits only with country code. Example: '493012345678' */
    whatsapp: '',
    /** Example: 'table@restaurant.example' */
    email: '',
    /** One line per entry. Example: ['Street 1', '12345 City'] */
    address: Object.freeze([]),
    /** Link for the Directions button: a Google Maps or Apple Maps place link. */
    mapsUrl: '',
  }),

  booking: Object.freeze({
    /**
     * How the Reservations section works:
     *   'demo'      portfolio demo with simulated availability; nothing is booked
     *   'request'   guests choose date, time and party size, then send the request
     *               by WhatsApp or email; the restaurant confirms by reply
     *   'provider'  a button opens the restaurant's booking provider (providerUrl)
     */
    mode: 'demo',

    /** Concept only: show a switch so visitors can compare the three modes. Set false for a live site. */
    showModeSwitch: true,

    /** For 'provider': the provider's name and the restaurant's booking page there. */
    providerName: '',
    providerUrl: '',
  }),
});

export const ALL_TIMES = Object.freeze(RESTAURANT.seatings.flatMap((seating) => seating.times));
export const CAPACITY_PER_EVENING = ALL_TIMES.length * RESTAURANT.seatsPerTime;
