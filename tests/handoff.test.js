import test from 'node:test';
import assert from 'node:assert/strict';
import { whatsappHref, mailHref, telHref } from '../src/js/core/handoff.js';

test('WhatsApp links keep only the digits of the number and encode the message', () => {
  assert.equal(whatsappHref('+49 30 1234-5678'), 'https://wa.me/493012345678');
  assert.equal(whatsappHref('+49 30 123', 'Table for 2 & a cake?'), 'https://wa.me/4930123?text=Table%20for%202%20%26%20a%20cake%3F');
  assert.equal(whatsappHref('', 'Hi'), 'https://wa.me/?text=Hi', 'no number: WhatsApp asks the guest to pick a chat');
});

test('email links carry subject and body, with or without a recipient', () => {
  const href = mailHref('table@example.com', 'Table request', 'Line one\nLine two');
  assert.match(href, /^mailto:table@example\.com\?/);
  const params = new URLSearchParams(href.split('?')[1]);
  assert.equal(params.get('subject'), 'Table request');
  assert.equal(params.get('body'), 'Line one\nLine two');
  assert.ok(!href.includes('+'), 'spaces are %20, never +, so mail apps show them correctly');
  assert.match(mailHref('', 'Hello'), /^mailto:\?subject=Hello$/);
  assert.equal(mailHref('table@example.com'), 'mailto:table@example.com');
});

test('phone links keep the plus sign and digits only', () => {
  assert.equal(telHref('+49 (30) 1234-5678'), 'tel:+493012345678');
});
