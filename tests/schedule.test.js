import test from 'node:test';
import assert from 'node:assert/strict';
import { dayRuns, formatDays, closedDays, formatSeatings } from '../src/js/core/schedule.js';

test('weekdays group into runs, and the week wraps from Sunday to Monday', () => {
  assert.deepEqual(dayRuns([2, 3, 4, 5, 6]), [[2, 3, 4, 5, 6]]);
  assert.deepEqual(dayRuns([0, 1]), [[0, 1]]);
  assert.deepEqual(dayRuns([5, 6, 0]), [[5, 6, 0]]);
  assert.deepEqual(dayRuns([1, 3, 5]), [[1], [3], [5]]);
  assert.deepEqual(dayRuns([0, 1, 2, 3, 4, 5, 6]), [[1, 2, 3, 4, 5, 6, 0]]);
});

test('opening days read naturally in English and German', () => {
  assert.equal(formatDays([2, 3, 4, 5, 6], 'en-GB'), 'Tue – Sat');
  assert.equal(formatDays([0, 1], 'en-GB'), 'Sun and Mon');
  assert.equal(formatDays([2, 3, 4, 5, 6], 'de-DE'), 'Di – Sa');
  assert.equal(formatDays([0, 1], 'de-DE'), 'So und Mo');
  assert.equal(formatDays([1, 3, 5], 'en-GB'), 'Mon, Wed and Fri');
});

test('closed days are the days that are not open', () => {
  assert.deepEqual(closedDays([2, 3, 4, 5, 6]), [0, 1]);
  assert.deepEqual(closedDays([0, 1, 2, 3, 4, 5, 6]), []);
});

test('seatings show the first and last start time of each', () => {
  const seatings = [{ times: ['17:30', '18:00', '18:30'] }, { times: ['20:30', '21:00', '21:30'] }];
  assert.equal(formatSeatings(seatings, 'en-GB'), '17:30 – 18:30 and 20:30 – 21:30');
  assert.equal(formatSeatings(seatings, 'de-DE'), '17:30 – 18:30 und 20:30 – 21:30');
});
