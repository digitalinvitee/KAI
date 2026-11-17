import test from 'node:test';
import assert from 'node:assert/strict';
import { createReservationStore, seedReservationsFor, shortenName } from '../src/js/demo/reservations.js';
import { createMemoryStore } from '../src/js/core/storage.js';
import { RESTAURANT } from '../content/restaurant.js';

// Wednesday 28 October 2026, 14:00 local time.
const now = () => new Date(2026, 9, 28, 14, 0);
const freshStore = () => createReservationStore({ storage: createMemoryStore(), now });
const FRIDAY = '2026-10-30';
const SUNDAY = '2026-11-01';

const freeSlot = (store, date, guests = 2) => store.availability(date, guests).times.find((slot) => slot.available);

test('seed data is deterministic per date', () => {
  assert.deepEqual(seedReservationsFor(FRIDAY, now()), seedReservationsFor(FRIDAY, now()));
});

test('seed data never exceeds the capacity of a start time', () => {
  for (let day = 0; day < 60; day += 1) {
    const date = new Date(2026, 9, 28 + day);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const totals = {};
    seedReservationsFor(key, now())
      .filter((entry) => entry.status !== 'cancelled')
      .forEach((entry) => { totals[entry.time] = (totals[entry.time] ?? 0) + entry.guests; });
    Object.values(totals).forEach((total) => assert.ok(total <= RESTAURANT.seatsPerTime, `${key}: ${total} seats`));
  }
});

test('closed days, past days and days beyond the window cannot be booked', () => {
  const store = freshStore();
  assert.equal(store.dayStatus(SUNDAY), 'closed');
  assert.equal(store.dayStatus('2026-10-27'), 'past');
  assert.equal(store.dayStatus('2027-03-01'), 'beyond');
  assert.equal(store.createReservation({ date: SUNDAY, time: '18:00', guests: 2, name: 'Ada Example' }).ok, false);
});

test('same-day times inside the cut-off are not offered', () => {
  const lateNow = () => new Date(2026, 9, 28, 20, 0);
  const store = createReservationStore({ storage: createMemoryStore(), now: lateNow });
  const times = store.availability('2026-10-28', 1).times;
  assert.equal(times.find((slot) => slot.time === '20:30').reason, 'past');
  assert.equal(times.find((slot) => slot.time === '17:30').reason, 'past');
});

test('a booking reduces availability and a full time is rejected', () => {
  const store = freshStore();
  const date = '2026-11-04';
  const slot = freeSlot(store, date, 1);
  assert.ok(slot, 'there is a free time to test with');
  let remaining = slot.remaining;
  while (remaining > 0) {
    const guests = Math.min(remaining, RESTAURANT.maxPartySize);
    const result = store.createReservation({ date, time: slot.time, guests, name: `Guest Number${remaining}` });
    assert.equal(result.ok, true);
    remaining -= guests;
  }
  const after = store.availability(date, 1).times.find((entry) => entry.time === slot.time);
  assert.equal(after.remaining, 0);
  const rejected = store.createReservation({ date, time: slot.time, guests: 1, name: 'Late Comer' });
  assert.deepEqual([rejected.ok, rejected.code], [false, 'full']);
});

test('party larger than the remaining seats is rejected with tooSmall', () => {
  const store = freshStore();
  const date = '2026-11-05';
  const slot = store.availability(date, 1).times.find((entry) => entry.available && entry.remaining < RESTAURANT.maxPartySize);
  assert.ok(slot, 'a partly booked time exists');
  const result = store.createReservation({ date, time: slot.time, guests: slot.remaining + 1, name: 'Big Party' });
  assert.deepEqual([result.ok, result.code], [false, 'tooSmall']);
});

test('repeated submissions with the same id create one booking', () => {
  const store = freshStore();
  const slot = freeSlot(store, FRIDAY);
  const first = store.createReservation({ date: FRIDAY, time: slot.time, guests: 2, name: 'Ada Example', submissionId: 'abc' });
  const second = store.createReservation({ date: FRIDAY, time: slot.time, guests: 2, name: 'Ada Example', submissionId: 'abc' });
  assert.equal(first.ok && second.ok, true);
  assert.equal(second.duplicate, true);
  assert.equal(second.reservation.ref, first.reservation.ref);
  assert.equal(store.createdCount(), 1);
});

test('rapid back-to-back bookings cannot oversell a time', () => {
  const store = freshStore();
  const date = '2026-11-11';
  const slot = freeSlot(store, date, 1);
  const attempts = Array.from({ length: 12 }, (_, index) =>
    store.createReservation({ date, time: slot.time, guests: 1, name: `Guest Rush${index}` }),
  );
  assert.equal(attempts.filter((result) => result.ok).length, slot.remaining);
  assert.equal(store.availability(date, 1).times.find((entry) => entry.time === slot.time).remaining, 0);
});

test('cancelling frees seats; completed bookings cannot be cancelled', () => {
  const store = freshStore();
  const slot = freeSlot(store, FRIDAY);
  const { reservation } = store.createReservation({ date: FRIDAY, time: slot.time, guests: 2, name: 'Ada Example' });
  const before = store.availability(FRIDAY, 1).times.find((entry) => entry.time === slot.time).remaining;
  assert.equal(store.cancelReservation(reservation.id).ok, true);
  const after = store.availability(FRIDAY, 1).times.find((entry) => entry.time === slot.time).remaining;
  assert.equal(after, before + 2);

  const past = seedReservationsFor('2026-10-23', now()).find((entry) => entry.status === 'confirmed');
  assert.deepEqual(store.cancelReservation(past.id), { ok: false, code: 'past' });
});

test('only a short name is kept, never contact details', () => {
  const store = freshStore();
  const slot = freeSlot(store, FRIDAY);
  const { reservation } = store.createReservation({ date: FRIDAY, time: slot.time, guests: 2, name: '  Mariam   Kajaia ' });
  assert.equal(reservation.name, 'Mariam K.');
  assert.equal(reservation.email, null);
  assert.equal(reservation.phone, null);
  assert.equal(shortenName('Élodie de la Tour'), 'Élodie T.');
});

test('reset clears demo bookings and cancellations', () => {
  const store = freshStore();
  const slot = freeSlot(store, FRIDAY);
  store.createReservation({ date: FRIDAY, time: slot.time, guests: 2, name: 'Ada Example' });
  store.reset();
  assert.equal(store.createdCount(), 0);
});
