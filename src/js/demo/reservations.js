/**
 * Demo reservation store — frontend only.
 *
 * Fictional bookings are generated deterministically per date (the same
 * date always yields the same guests). Bookings made by the visitor and
 * cancellations are kept in sessionStorage for the current tab only and
 * are never sent anywhere. Capacity rules are enforced on every write.
 */
import { RESTAURANT, ALL_TIMES } from '../../../content/restaurant.js';
import { GUEST_NAMES, NOTE_KEYS, COUNTRY_CODES } from '../data/guests.js';
import { toKey, fromKey, addDays, daysBetween, isValidKey, minutesOf } from '../core/dates.js';
import { createRandom, referenceCode } from '../core/random.js';
import { sessionStore } from '../core/storage.js';

export const STORAGE_KEY = 'kai-demo-reservations-v1';
export const SEATING_MINUTES = 120;

const OCCUPANCY_BY_WEEKDAY = Object.freeze({ 2: 0.42, 3: 0.5, 4: 0.62, 5: 0.84, 6: 0.92 });
const PARTY_SIZES = Object.freeze([[1, 4], [2, 50], [3, 11], [4, 20], [5, 5], [6, 6], [7, 2], [8, 2]]);

export const isOpenDay = (date) => RESTAURANT.openWeekdays.includes(date.getDay());

export const seatingOf = (time) => RESTAURANT.seatings.find((seating) => seating.times.includes(time))?.id ?? null;

const slug = (value) =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ß/g, 'ss')
    .toLowerCase()
    .replace(/[^a-z]/g, '');

const emailFor = (name) => {
  const [first, ...rest] = name.split(' ');
  return `${slug(first).charAt(0)}.${slug(rest.join(''))}@example.com`;
};

const maskedPhone = (random) => `+${random.pick(COUNTRY_CODES)} ••• ••• ${random.int(10, 99)}`;

/** "Mariam Kajaia" → "Mariam K." — the demo never keeps a full name. */
export const shortenName = (fullName) => {
  const parts = String(fullName).trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) return parts[0] ?? '';
  const last = parts[parts.length - 1];
  return `${parts[0]} ${last.charAt(0).toLocaleUpperCase()}.`;
};

const referenceFor = (dateKey, random) => `KAI-${dateKey.slice(5, 7)}${dateKey.slice(8, 10)}-${referenceCode(random)}`;

/**
 * Fictional bookings for one date. Busier towards the weekend and emptier
 * the further the date lies in the future, like a real reservation book.
 */
export const seedReservationsFor = (dateKey, today = new Date()) => {
  const date = fromKey(dateKey);
  if (!isOpenDay(date)) return [];

  const random = createRandom(`kai:${dateKey}`);
  const lead = daysBetween(today, date);
  const leadFactor = lead <= 7 ? 1 : Math.max(0.12, 1 - (lead - 7) / 40);
  const occupancy = OCCUPANCY_BY_WEEKDAY[date.getDay()] * random.between(0.85, 1.15) * leadFactor;
  const reservations = [];

  ALL_TIMES.forEach((time) => {
    const target = Math.min(
      RESTAURANT.seatsPerTime,
      Math.round(RESTAURANT.seatsPerTime * occupancy * random.between(0.55, 1.4)),
    );
    let booked = 0;
    let attempts = 0;
    while (booked < target && attempts < 12) {
      attempts += 1;
      const guests = Math.min(random.weighted(PARTY_SIZES), RESTAURANT.seatsPerTime - booked);
      const name = random.pick(GUEST_NAMES);
      const cancelled = random.next() < 0.06;
      reservations.push({
        id: `seed-${dateKey}-${reservations.length}`,
        ref: referenceFor(dateKey, random),
        date: dateKey,
        time,
        guests,
        name,
        email: emailFor(name),
        phone: maskedPhone(random),
        noteKey: random.next() < 0.22 ? random.pick(NOTE_KEYS) : null,
        hasRequest: false,
        createdAt: toKey(addDays(date, -random.int(1, 34))),
        status: cancelled ? 'cancelled' : 'confirmed',
        source: 'seed',
      });
      if (!cancelled) booked += guests;
    }
  });

  return reservations;
};

const emptyState = () => ({ created: [], cancelled: [], submissions: {} });

const readState = (storage) => {
  const saved = storage.get(STORAGE_KEY);
  if (!saved || !Array.isArray(saved.created)) return emptyState();
  return {
    created: saved.created.filter((entry) => entry && isValidKey(entry.date) && ALL_TIMES.includes(entry.time)),
    cancelled: Array.isArray(saved.cancelled) ? saved.cancelled : [],
    submissions: saved.submissions && typeof saved.submissions === 'object' ? saved.submissions : {},
  };
};

export const createReservationStore = ({ storage = sessionStore, now = () => new Date() } = {}) => {
  let state = readState(storage);
  const listeners = new Set();
  const seedCache = new Map();

  const todayKey = () => toKey(now());
  const nowMinutes = () => now().getHours() * 60 + now().getMinutes();

  const seedFor = (dateKey) => {
    const cacheKey = `${todayKey()}|${dateKey}`;
    if (!seedCache.has(cacheKey)) seedCache.set(cacheKey, seedReservationsFor(dateKey, now()));
    return seedCache.get(cacheKey);
  };

  const persist = () => {
    storage.set(STORAGE_KEY, state);
    listeners.forEach((listener) => listener());
  };

  const withStatus = (reservation) => {
    if (reservation.status === 'cancelled' || state.cancelled.includes(reservation.id)) {
      return { ...reservation, status: 'cancelled' };
    }
    const today = todayKey();
    const finished =
      reservation.date < today ||
      (reservation.date === today && minutesOf(reservation.time) + SEATING_MINUTES <= nowMinutes());
    return { ...reservation, status: finished ? 'completed' : 'confirmed' };
  };

  const reservationsOn = (dateKey) =>
    [...seedFor(dateKey), ...state.created.filter((entry) => entry.date === dateKey)].map(withStatus);

  const reservationsBetween = (fromKeyValue, toKeyValue) => {
    const result = [];
    const start = fromKey(fromKeyValue);
    const span = daysBetween(start, fromKey(toKeyValue));
    for (let offset = 0; offset <= span; offset += 1) result.push(...reservationsOn(toKey(addDays(start, offset))));
    return result;
  };

  /** Why a whole day cannot be booked, or null if it can. */
  const dayRestriction = (dateKey) => {
    if (!isValidKey(dateKey)) return 'invalid';
    const date = fromKey(dateKey);
    const lead = daysBetween(now(), date);
    if (lead < 0) return 'past';
    if (lead > RESTAURANT.bookingWindowDays) return 'beyond';
    if (!isOpenDay(date)) return 'closed';
    return null;
  };

  const availability = (dateKey, guests = 2) => {
    const restriction = dayRestriction(dateKey);
    const active = restriction ? [] : reservationsOn(dateKey).filter((entry) => entry.status !== 'cancelled');
    const isToday = dateKey === todayKey();

    const times = ALL_TIMES.map((time) => {
      const booked = active.filter((entry) => entry.time === time).reduce((sum, entry) => sum + entry.guests, 0);
      const remaining = Math.max(0, RESTAURANT.seatsPerTime - booked);
      let reason = restriction;
      if (!reason && isToday && minutesOf(time) - nowMinutes() < RESTAURANT.sameDayCutoffMinutes) reason = 'past';
      if (!reason && remaining === 0) reason = 'full';
      if (!reason && remaining < guests) reason = 'tooSmall';
      return { time, seating: seatingOf(time), booked, remaining, available: !reason, reason };
    });

    return { date: dateKey, guests, restriction, times, availableCount: times.filter((slot) => slot.available).length };
  };

  /** 'available' | 'full' | 'closed' | 'past' | 'beyond' | 'invalid' for the calendar. */
  const dayStatus = (dateKey, guests = 2) => {
    const restriction = dayRestriction(dateKey);
    if (restriction) return restriction;
    const { times, availableCount } = availability(dateKey, guests);
    if (availableCount > 0) return 'available';
    return times.every((slot) => slot.reason === 'past') ? 'past' : 'full';
  };

  const uniqueReference = (dateKey) => {
    const taken = new Set([...seedFor(dateKey), ...state.created].map((entry) => entry.ref));
    const random = createRandom(`${dateKey}:${Date.now()}:${Math.random()}`);
    let reference = referenceFor(dateKey, random);
    while (taken.has(reference)) reference = referenceFor(dateKey, random);
    return reference;
  };

  const findById = (id) => {
    const created = state.created.find((entry) => entry.id === id);
    if (created) return withStatus(created);
    const match = /^seed-(\d{4}-\d{2}-\d{2})-\d+$/.exec(id);
    if (!match) return null;
    const seeded = seedFor(match[1]).find((entry) => entry.id === id);
    return seeded ? withStatus(seeded) : null;
  };

  /**
   * Re-checks capacity at the moment of writing, so a time that filled up
   * since it was displayed is rejected. Repeated submissions with the same
   * submissionId return the first booking instead of creating a duplicate.
   */
  const createReservation = ({ date, time, guests, name, hasRequest = false, submissionId = null }) => {
    if (submissionId && state.submissions[submissionId]) {
      const existing = findById(state.submissions[submissionId]);
      if (existing) return { ok: true, duplicate: true, reservation: existing };
    }
    const partySize = Number(guests);
    if (!Number.isInteger(partySize) || partySize < 1 || partySize > RESTAURANT.maxPartySize) return { ok: false, code: 'guests' };
    if (!ALL_TIMES.includes(time)) return { ok: false, code: 'time' };
    const shortName = shortenName(name);
    if (!shortName) return { ok: false, code: 'name' };

    const slot = availability(date, partySize).times.find((entry) => entry.time === time);
    if (!slot.available) return { ok: false, code: slot.reason ?? 'unavailable' };

    const reservation = {
      id: `demo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      ref: uniqueReference(date),
      date,
      time,
      guests: partySize,
      name: shortName,
      email: null,
      phone: null,
      noteKey: null,
      hasRequest: Boolean(hasRequest),
      createdAt: todayKey(),
      status: 'confirmed',
      source: 'session',
    };
    state.created.push(reservation);
    if (submissionId) state.submissions[submissionId] = reservation.id;
    persist();
    return { ok: true, duplicate: false, reservation: withStatus(reservation) };
  };

  const cancelReservation = (id) => {
    const reservation = findById(id);
    if (!reservation) return { ok: false, code: 'missing' };
    if (reservation.status === 'completed') return { ok: false, code: 'past' };
    if (reservation.status === 'cancelled') return { ok: true, reservation };
    const created = state.created.find((entry) => entry.id === id);
    if (created) created.status = 'cancelled';
    else state.cancelled.push(id);
    persist();
    return { ok: true, reservation: findById(id) };
  };

  const reset = () => {
    state = emptyState();
    storage.remove(STORAGE_KEY);
    listeners.forEach((listener) => listener());
  };

  const subscribe = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  return {
    todayKey,
    availability,
    dayStatus,
    reservationsOn,
    reservationsBetween,
    findById,
    createReservation,
    cancelReservation,
    reset,
    subscribe,
    createdCount: () => state.created.length,
  };
};
