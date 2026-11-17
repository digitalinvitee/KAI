import test from 'node:test';
import assert from 'node:assert/strict';
import { validateName, validateEmail, validatePhone, validateRequests, validateTable, countErrors } from '../src/js/modules/booking/validation.js';

test('names need a first and a last name and allow accents, hyphens and apostrophes', () => {
  assert.equal(validateName(''), 'nameRequired');
  assert.equal(validateName('Mariam'), 'nameInvalid');
  assert.equal(validateName('Mariam Kajaia'), null);
  assert.equal(validateName('Zoë O’Neill-Brandt'), null);
  assert.equal(validateName('Jürgen Müller'), null);
  assert.equal(validateName('<b>x</b> y'), 'nameInvalid');
});

test('email addresses are checked for a usable format', () => {
  assert.equal(validateEmail(''), 'emailRequired');
  assert.equal(validateEmail('ada@example'), 'emailInvalid');
  assert.equal(validateEmail('ada example@x.com'), 'emailInvalid');
  assert.equal(validateEmail('ada@example.com'), null);
  assert.equal(validateEmail('a.b+c@studio.co.uk'), null);
});

test('phone numbers need 7 to 15 digits', () => {
  assert.equal(validatePhone(''), 'phoneRequired');
  assert.equal(validatePhone('12345'), 'phoneInvalid');
  assert.equal(validatePhone('+49 (0)30 1234-5678'), null);
  assert.equal(validatePhone('+995 599 00 00 00'), null);
  assert.equal(validatePhone('call me'), 'phoneInvalid');
  assert.equal(validatePhone('+1 234 567 890 123 456 7'), 'phoneInvalid');
});

test('requests are optional but limited in length', () => {
  assert.equal(validateRequests(''), null);
  assert.equal(validateRequests('x'.repeat(300)), null);
  assert.equal(validateRequests('x'.repeat(301)), 'requestsLong');
});

test('table step requires a date and a time', () => {
  assert.equal(countErrors(validateTable({ date: null, time: null })), 2);
  assert.equal(countErrors(validateTable({ date: '2026-10-30', time: '18:00' })), 0);
});
