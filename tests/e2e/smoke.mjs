/**
 * End-to-end smoke test (Playwright library + node:assert).
 *
 *   npm i -D playwright && npx playwright install chromium
 *   npm run test:e2e              → tests the source (project root)
 *   npm run test:e2e -- dist      → tests the production build
 *
 * Screenshots land in tests/e2e/screenshots/.
 */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = fileURLToPath(new URL('../../', import.meta.url));
const target = process.argv[2] ?? '.';
const port = 5199;
const base = `http://localhost:${port}/`;
const shots = fileURLToPath(new URL('./screenshots/', import.meta.url));
const results = [];

const step = async (name, run) => {
  const started = Date.now();
  try {
    await run();
    results.push({ name, ok: true, ms: Date.now() - started });
    console.log(`  ✓ ${name}`);
  } catch (error) {
    results.push({ name, ok: false, error });
    console.log(`  ✗ ${name}\n    ${error.message.split('\n').join('\n    ')}`);
  }
};

const server = spawn(process.execPath, ['scripts/serve.mjs', target], { cwd: root, env: { ...process.env, PORT: String(port) } });
await new Promise((resolve) => server.stdout.once('data', resolve));
await mkdir(shots, { recursive: true });

const browser = await chromium.launch();
const pageErrors = [];

const newPage = async ({ width = 1440, height = 900, reducedMotion = 'reduce' } = {}) => {
  const context = await browser.newContext({ viewport: { width, height }, reducedMotion });
  const page = await context.newPage();
  page.on('pageerror', (error) => pageErrors.push(`${width}px: ${error.message}`));
  return { context, page };
};

const scrollThrough = async (page) => {
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.6;
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo({ top: y, behavior: 'instant' });
      await new Promise((resolve) => setTimeout(resolve, 80));
    }
    await Promise.all(
      [...document.images].map((image) =>
        image.complete ? null : new Promise((resolve) => { image.onload = image.onerror = resolve; setTimeout(resolve, 4000); }),
      ),
    );
    window.scrollTo({ top: 0, behavior: 'instant' });
  });
};

/**
 * Typography audit, run in the page: every text element is set in Manrope (Noto Sans JP
 * KAI inside lang="ja"), upright, in one of the four weights; art-directed heading
 * lines do not wrap; and the self-hosted font files actually loaded.
 */
const typeAudit = () => {
  const allowed = new Set(['300', '400', '500', '600']);
  const report = { italic: [], family: [], weight: [], wrapped: [] };
  const name = (el) => el.tagName.toLowerCase() + (typeof el.className === 'string' && el.className.trim() ? `.${el.className.trim().split(/\s+/)[0]}` : '');
  for (const el of document.querySelectorAll('body, body *')) {
    for (const pseudo of [null, '::before', '::after']) {
      const style = getComputedStyle(el, pseudo);
      if (pseudo && (style.content === 'none' || style.content === 'normal')) continue;
      if (style.fontStyle !== 'normal') report.italic.push(name(el) + (pseudo ?? ''));
    }
    if (![...el.childNodes].some((node) => node.nodeType === 3 && node.textContent.trim())) continue;
    const style = getComputedStyle(el);
    const family = style.fontFamily.split(',')[0].replace(/["']/g, '').trim();
    const expected = el.closest('[lang="ja"]') ? 'Noto Sans JP KAI' : 'Manrope';
    if (family !== expected) report.family.push(`${name(el)}: ${family}`);
    if (!allowed.has(style.fontWeight)) report.weight.push(`${name(el)}: ${style.fontWeight}`);
  }
  for (const line of document.querySelectorAll('.line__inner')) {
    if (line.getBoundingClientRect().height > parseFloat(getComputedStyle(line).lineHeight) * 1.5) report.wrapped.push(line.textContent.trim());
  }
  const faces = (family) => [...document.fonts].filter((face) => face.family.replace(/["']/g, '') === family);
  report.manrope = faces('Manrope').length > 0 && faces('Manrope').every((face) => face.status === 'loaded');
  report.japanese = faces('Noto Sans JP KAI').every((face) => face.status === 'loaded');
  return report;
};

const assertTypography = (report, where) => {
  assert.ok(report.manrope, `${where}: Manrope did not load`);
  assert.ok(report.japanese, `${where}: Noto Sans JP did not load`);
  assert.deepEqual(report.italic, [], `${where}: italic text`);
  assert.deepEqual(report.family, [], `${where}: text not set in Manrope`);
  assert.deepEqual(report.weight, [], `${where}: weights outside 300–600`);
  assert.deepEqual(report.wrapped, [], `${where}: heading lines wrapped`);
};

/** The header hides while scrolling down; a small scroll up brings it back, as for a reader. */
const revealHeader = async (page) => {
  await page.mouse.wheel(0, -160);
  await page.waitForTimeout(500);
};

console.log(`\nKAI smoke test · ${target === '.' ? 'source' : target}\n`);

for (const width of [320, 375, 390, 768, 1024, 1440]) {
  await step(`layout at ${width}px: no horizontal overflow, images load, no script errors`, async () => {
    const height = width < 768 ? 760 : 900;
    const { context, page } = await newPage({ width, height, reducedMotion: 'no-preference' });
    await page.goto(base, { waitUntil: 'load' });
    await scrollThrough(page);
    await page.waitForTimeout(400);
    const report = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      broken: [...document.images].filter((image) => !image.complete || image.naturalWidth === 0).map((image) => image.currentSrc || image.src),
    }));
    assert.ok(report.overflow <= 0, `page is ${report.overflow}px wider than the viewport`);
    assert.deepEqual(report.broken, [], `broken images: ${report.broken.join(', ')}`);
    await page.screenshot({ path: `${shots}home-${width}.png` });
    await context.close();
  });
}

await step('typography: Manrope only, upright, four weights, on site, dashboard and 404 in EN and DE', async () => {
  const pages = [];
  for (const width of [320, 375, 1024, 1440]) for (const lang of ['en', 'de']) pages.push([`${lang === 'de' ? '?lang=de' : ''}`, width, `site ${lang} ${width}px`]);
  pages.push(['demo-dashboard/?lang=de', 375, 'dashboard de 375px'], ['demo-dashboard/', 1440, 'dashboard en 1440px'], ['404.html', 375, '404']);
  for (const [path, width, where] of pages) {
    const { context, page } = await newPage({ width, height: width < 768 ? 760 : 900 });
    await page.goto(`${base}${path}`, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    assertTypography(await page.evaluate(typeAudit), where);
    await context.close();
  }
});

await step('language switch: EN → DE → EN keeps place, formats prices and persists', async () => {
  const { context, page } = await newPage();
  await page.goto(base);
  await page.locator('#menu').scrollIntoViewIfNeeded();
  await revealHeader(page);
  await page.locator('.site-header [data-locale="de"]').click();
  assert.equal(await page.getAttribute('html', 'lang'), 'de');
  assert.equal((await page.locator('.hero__statement').textContent()).trim(), 'Die Kunst des Weglassens.');
  assert.match(await page.title(), /Zeitgenössische japanische Küche/);
  const price = (await page.locator('#menu-panel-omakase .set__price data').first().textContent()).replace(/\s/g, ' ');
  assert.equal(price, '185 €');
  assert.match(page.url(), /\?lang=de/);
  await page.reload();
  assert.equal(await page.getAttribute('html', 'lang'), 'de', 'choice persists after reload');
  await page.locator('.site-header [data-locale="en"]').click();
  assert.equal(await page.getAttribute('html', 'lang'), 'en');
  assert.equal((await page.locator('#menu-panel-omakase .set__price data').first().textContent()).trim(), '€185');
  await context.close();
});

await step('menu: tabs switch by click and arrow keys', async () => {
  const { context, page } = await newPage();
  await page.goto(base);
  await page.locator('#menu-tab-alacarte').click();
  assert.equal(await page.getAttribute('#menu-tab-alacarte', 'aria-selected'), 'true');
  assert.ok(await page.locator('#menu-panel-alacarte').isVisible());
  assert.ok(await page.locator('#menu-panel-alacarte', { hasText: 'Edamame' }).isVisible());
  await page.keyboard.press('ArrowRight');
  assert.equal(await page.getAttribute('#menu-tab-drinks', 'aria-selected'), 'true');
  assert.ok(await page.locator('#menu-panel-drinks', { hasText: 'Gyokuro' }).isVisible());
  await context.close();
});

await step('mobile navigation opens, traps the page and closes with Escape', async () => {
  const { context, page } = await newPage({ width: 375, height: 760 });
  await page.goto(base);
  await page.locator('[data-nav-toggle]').click();
  assert.equal(await page.getAttribute('[data-nav-toggle]', 'aria-expanded'), 'true');
  assert.ok(await page.locator('#mobile-nav').isVisible());
  assert.equal(await page.evaluate(() => document.querySelector('#main').inert), true);
  await page.keyboard.press('Escape');
  assert.equal(await page.getAttribute('[data-nav-toggle]', 'aria-expanded'), 'false');
  assert.equal(await page.evaluate(() => document.querySelector('#main').inert), false);
  await context.close();
});

await step('dark canvas turns on while "The Space" is in view', async () => {
  const { context, page } = await newPage();
  await page.goto(base);
  await page.evaluate(() => document.querySelector('#space .space__gallery').scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(300);
  assert.ok(await page.evaluate(() => document.documentElement.classList.contains('is-dark')));
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  assert.ok(!(await page.evaluate(() => document.documentElement.classList.contains('is-dark'))));
  await context.close();
});

const scrollToElement = (page, selector, offset = 0) =>
  page.evaluate(([target, extra]) => {
    const element = document.querySelector(target);
    window.scrollTo({ top: element.getBoundingClientRect().top + window.scrollY + extra, behavior: 'instant' });
  }, [selector, offset]);

await step('visit: opening hours written from the settings, placeholders instead of fake contact links', async () => {
  const { context, page } = await newPage();
  await page.goto(base);
  assert.equal(await page.getAttribute('.hero__menu-link', 'href'), '#menu', 'hero offers the menu');
  const text = (selector) => page.locator(selector).textContent().then((value) => value.trim());
  assert.equal(await text('#visit [data-hours="open"]'), 'Tue – Sat · 17:30 – 23:00');
  assert.equal(await text('#visit [data-hours="closed"]'), 'Sun and Mon · closed');
  assert.equal(await text('[data-hours="seatings"]'), '17:30 – 18:30 and 20:30 – 21:30');
  assert.equal(await page.locator('#visit a[href^="tel:"], #visit a[href^="mailto:"], #visit a[href*="wa.me"]').count(), 0, 'no contact links without real details');
  assert.equal(await page.locator('#visit .contact__link.is-placeholder').count(), 4, 'directions, call, WhatsApp and email are labelled placeholders');
  await page.goto(`${base}?lang=de`);
  assert.equal(await text('#visit [data-hours="open"]'), 'Di – Sa · 17:30 – 23:00 Uhr');
  assert.equal(await text('#visit [data-hours="closed"]'), 'So und Mo · Ruhetag');
  await context.close();
});

await step('menu: category bar stays in view, allergens on demand and remembered', async () => {
  const { context, page } = await newPage({ width: 375, height: 760 });
  await page.goto(base);
  const allergenLines = () =>
    page.locator('#menu-panel-omakase .dish__allergens').evaluateAll((nodes) => nodes.filter((node) => node.offsetParent !== null).length);
  assert.equal(await allergenLines(), 0, 'allergens hidden by default');
  await scrollToElement(page, '#menu-panels', 900);
  await page.waitForTimeout(700);
  const bar = await page.evaluate(() => {
    const tabs = document.querySelector('[data-menu-tabs]');
    return { top: tabs.getBoundingClientRect().top, offset: parseFloat(getComputedStyle(tabs).top) };
  });
  assert.ok(Math.abs(bar.top - bar.offset) <= 1, `category bar stuck to the top (at ${bar.top}px, expected ${bar.offset}px)`);
  await page.locator('[data-allergen-toggle]').evaluate((button) => button.click());
  assert.equal(await page.getAttribute('[data-allergen-toggle]', 'aria-pressed'), 'true');
  assert.ok((await allergenLines()) > 0, 'allergens shown after switching on');
  await page.reload();
  assert.equal(await page.getAttribute('[data-allergen-toggle]', 'aria-pressed'), 'true', 'choice remembered');
  await context.close();
});

await step('mobile action bar: appears after the hero, steps aside at booking and footer, absent on desktop', async () => {
  const { context, page } = await newPage({ width: 375, height: 760 });
  await page.goto(base);
  const state = () =>
    page.evaluate(() => {
      const bar = document.querySelector('[data-action-bar]');
      return { visible: bar.classList.contains('is-visible'), inert: bar.inert, inMenu: bar.classList.contains('is-in-menu') };
    });
  const at = async (selector, offset = 0) => {
    await scrollToElement(page, selector, offset);
    await page.waitForTimeout(350);
    return state();
  };
  assert.deepEqual(await state(), { visible: false, inert: true, inMenu: false }, 'hidden over the hero');
  assert.equal((await at('#philosophy', 200)).visible, true, 'shown once the hero buttons scroll away');
  assert.deepEqual(await at('#menu-panels', 300), { visible: true, inert: false, inMenu: true }, 'only Reserve inside the menu');
  assert.equal((await at('#reservations .reserve__panel')).visible, false, 'steps aside at the booking form');
  assert.equal((await at('#visit')).visible, false, 'steps aside at the footer');
  await page.setViewportSize({ width: 1280, height: 800 });
  await at('#philosophy', 200);
  assert.equal(await page.locator('[data-action-bar]').isVisible(), false, 'not shown on desktop');
  await context.close();
});

await step('private dining: the enquiry validates and prepares an email and a WhatsApp message', async () => {
  const { context, page } = await newPage({ width: 390, height: 844 });
  await page.goto(base);
  await page.locator('[data-enquiry-open]').click();
  assert.ok(await page.locator('[data-enquiry]').evaluate((dialog) => dialog.open), 'dialog opens');
  await page.locator('[data-enquiry-send="email"]').click();
  assert.ok(await page.locator('#enquiry-error-name').isVisible(), 'name is required');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'enquiry-name', 'focus moves to the field');
  await page.selectOption('#enquiry-occasion', 'celebration');
  await page.fill('#enquiry-guests', '14');
  await page.fill('#enquiry-name', 'Ada Example');
  await page.fill('#enquiry-message', 'A 40th birthday.');
  const mail = new URL(await page.getAttribute('[data-enquiry-send="email"]', 'href'));
  const params = new URLSearchParams(mail.search);
  assert.equal(mail.protocol, 'mailto:');
  assert.equal(params.get('subject'), 'Private dining enquiry: Celebration, 14 guests');
  assert.match(params.get('body'), /Guests: 14\nName: Ada Example\n\nA 40th birthday\./);
  const whatsapp = await page.getAttribute('[data-enquiry-send="whatsapp"]', 'href');
  assert.match(whatsapp, /^https:\/\/wa\.me\/\?text=/);
  assert.match(decodeURIComponent(whatsapp.split('text=')[1]), /Occasion: Celebration/);
  assert.ok(await page.locator('[data-enquiry] [data-recipient-note]').isVisible(), 'says that no recipient is set in the concept');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('[data-enquiry]').evaluate((dialog) => dialog.open), false, 'Escape closes it');
  await context.close();
});

await step('booking modes: request hands the message to WhatsApp or email; provider links out; nothing is stored', async () => {
  const { context, page } = await newPage({ width: 375, height: 760 });
  await page.goto(base);
  await page.locator('.booking-modes input[value="request"]').check();
  assert.equal(await page.getAttribute('[data-booking]', 'data-mode'), 'request');
  assert.match(await page.locator('.reserve__aside [data-mode-notice]').textContent(), /Booking request/);

  let day = page.locator('[data-calendar] button.day:not([aria-disabled])').first();
  if (!(await day.count())) {
    await page.locator('[data-calendar] .calendar__nav').nth(1).click();
    day = page.locator('[data-calendar] button.day:not([aria-disabled])').first();
  }
  await day.click();
  const slot = page.locator('[data-slots] input[name="time"]:not(:disabled)').first();
  await slot.waitFor({ state: 'attached' });
  await slot.evaluate((input) => input.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await slot.check();
  await page.locator('[data-action="next"]').click();
  await page.fill('#booking-name', 'Ada Example');
  await page.locator('[data-action="next"]').click();
  assert.ok(await page.locator('[data-step="3"]').isVisible(), 'email and phone are optional for a request');
  assert.equal((await page.locator('#booking-step-3-title').textContent()).trim(), 'Review your request');
  assert.ok(await page.locator('[data-action="next"]').isHidden(), 'no confirm button: the guest sends the message');

  const whatsapp = await page.getAttribute('[data-handoff-link="whatsapp"]', 'href');
  assert.match(whatsapp, /^https:\/\/wa\.me\/\?text=/);
  const message = decodeURIComponent(whatsapp.split('text=')[1]);
  assert.match(message, /Guests: 2/);
  assert.match(message, /Name: Ada Example/);
  const mail = new URL(await page.getAttribute('[data-handoff-link="email"]', 'href'));
  assert.match(new URLSearchParams(mail.search).get('subject'), /^Table request: .+, 2 guests$/);
  assert.ok(await page.locator('[data-handoff] [data-recipient-note]').isVisible(), 'concept: the missing recipient is explained');
  const stored = await page.evaluate(() => JSON.parse(sessionStorage.getItem('kai-demo-reservations-v1') ?? '{"created":[]}').created);
  assert.equal(stored.length, 0, 'a request creates no demo booking');

  await page.locator('.booking-modes input[value="provider"]').check();
  assert.ok(await page.locator('[data-booking-provider]').isVisible(), 'provider panel shown');
  assert.ok(await page.locator('[data-booking]').isHidden(), 'form hidden');
  assert.equal(await page.getAttribute('[data-provider-link]', 'aria-disabled'), 'true', 'no provider URL in the concept, so the link is inert');
  assert.equal(await page.getAttribute('[data-provider-link]', 'href'), null);

  await page.locator('.booking-modes input[value="demo"]').check();
  assert.ok(await page.locator('[data-step="1"]').isVisible(), 'demo starts again at step 1');
  assert.match(await page.locator('.reserve__aside [data-mode-notice]').textContent(), /Portfolio demo/);
  await context.close();
});

await step('keyboard: with motion on, Tab reaches every action, including ones not yet revealed', async () => {
  const { context, page } = await newPage({ reducedMotion: 'no-preference' });
  await page.goto(base);
  await page.waitForFunction(() => document.documentElement.classList.contains('hero-ready'));
  await page.waitForTimeout(2000);
  const reached = new Set();
  for (let i = 0; i < 200 && !reached.has('footer'); i += 1) {
    await page.keyboard.press('Tab');
    const where = await page.evaluate(() => {
      const element = document.activeElement;
      if (!element || element === document.body) return null;
      if (element.closest('.menu-cta')) return 'menu prompt';
      if (element.matches('[data-enquiry-open]')) return 'private dining enquiry';
      if (element.closest('.facts')) return 'larger groups link';
      if (element.closest('#visit')) return 'footer';
      return null;
    });
    if (where) reached.add(where);
  }
  assert.deepEqual([...reached].sort(), ['footer', 'larger groups link', 'menu prompt', 'private dining enquiry']);
  assert.equal(await page.locator('.private__actions').evaluate((element) => getComputedStyle(element).opacity), '1', 'focused block is fully shown');
  await context.close();
});

let reference = null;
await step('booking: validation, review, language switch mid-flow, single confirmation', async () => {
  const { context, page } = await newPage({ width: 375, height: 760 });
  await page.goto(base);
  await page.locator('#reservations').scrollIntoViewIfNeeded();

  await page.locator('[data-action="next"]').click();
  assert.ok(await page.locator('[data-error-summary]').isVisible(), 'empty step 1 shows an error summary');

  let day = page.locator('[data-calendar] button.day:not([aria-disabled])').first();
  if (!(await day.count())) {
    await page.locator('[data-calendar] .calendar__nav').nth(1).click();
    day = page.locator('[data-calendar] button.day:not([aria-disabled])').first();
  }
  await day.click();
  assert.equal(await day.getAttribute('aria-pressed'), 'true');
  const slot = page.locator('[data-slots] input[name="time"]:not(:disabled)').first();
  await slot.waitFor({ state: 'attached' });
  await slot.evaluate((input) => input.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await slot.check();
  await page.locator('[data-action="next"]').click();
  assert.ok(await page.locator('[data-step="2"]').isVisible(), 'step 2 visible');

  await page.locator('[data-action="next"]').click();
  assert.equal(await page.locator('[data-error-summary] li').count(), 3, 'three required fields reported');
  assert.equal(await page.getAttribute('#booking-email', 'aria-invalid'), 'true');

  await page.fill('#booking-name', 'Ada Example');
  await page.fill('#booking-email', 'ada@example');
  await page.fill('#booking-phone', '12');
  await page.locator('[data-action="next"]').click();
  assert.equal(await page.locator('[data-error-summary] li').count(), 2, 'invalid email and phone are rejected');
  await page.fill('#booking-email', 'ada@example.com');
  await page.fill('#booking-phone', '+49 30 1234 5678');
  await page.fill('#booking-requests', 'Window seat if possible');
  await page.locator('[data-action="next"]').click();
  assert.ok(await page.locator('[data-step="3"]').isVisible(), 'review visible');
  assert.ok(await page.locator('[data-review]', { hasText: 'ada@example.com' }).isVisible());
  assert.ok(await page.locator('[data-step="3"] .demo-notice').isVisible(), 'demo notice visible before confirming');

  await revealHeader(page);
  await page.locator('.site-header [data-locale="de"]').click();
  assert.ok(await page.locator('[data-step="3"]').isVisible(), 'still on review after switching language');
  assert.equal((await page.locator('#booking-step-3-title').textContent()).trim(), 'Buchung prüfen');
  assert.ok(await page.locator('[data-review]', { hasText: 'ada@example.com' }).isVisible(), 'entered data kept');
  await revealHeader(page);
  await page.locator('.site-header [data-locale="en"]').click();

  await page.locator('[data-action="next"]').dblclick();
  await page.locator('[data-step="4"]').waitFor({ state: 'visible', timeout: 5000 });
  reference = (await page.locator('.ticket__value--code').textContent()).trim();
  assert.match(reference, /^KAI-\d{4}-[A-Z0-9]{3}$/);
  const created = await page.evaluate(() => JSON.parse(sessionStorage.getItem('kai-demo-reservations-v1')).created);
  assert.equal(created.length, 1, 'double click created exactly one booking');
  assert.equal(created[0].email, null, 'email is not stored');
  assert.equal(created[0].name, 'Ada E.', 'only first name and initial are stored');

  await page.locator('[data-dashboard-link]').click();
  await page.waitForURL(/demo-dashboard/);
  await page.locator('[data-dialog][open]').waitFor();
  assert.ok(await page.locator('[data-dialog]', { hasText: reference }).isVisible(), 'dashboard opens the new booking');
  assert.ok(await page.locator('[data-dialog] .tag').isVisible(), 'marked as your demo booking');
  await page.locator('[data-dialog] [data-action="cancel"]').click();
  await page.locator('[data-dialog] [data-action="confirm-cancel"]').click();
  assert.ok(await page.locator('[data-dialog] .pill--cancelled').isVisible(), 'status changes to cancelled');
  await page.locator('[data-dialog] [data-action="close"]').click();
  await page.locator('[data-reset]').click();
  await page.locator('[data-reset-confirm]').click();
  const afterReset = await page.evaluate(() => sessionStorage.getItem('kai-demo-reservations-v1'));
  assert.equal(afterReset, null, 'reset clears demo state');
  await page.screenshot({ path: `${shots}dashboard-375.png`, fullPage: false });
  await context.close();
});

await step('dashboard: filters, search, empty state and direct /demo-dashboard link', async () => {
  const { context, page } = await newPage();
  await page.goto(`${base}demo-dashboard`);
  assert.ok(await page.locator('.dash-banner').isVisible(), 'fictional-data banner visible');
  await page.locator('[data-quick="all"]').click();
  const all = await page.locator('[data-rows] tr').count();
  assert.ok(all > 0, 'upcoming reservations listed');
  await page.selectOption('[data-filter-status]', 'cancelled');
  const cancelledPills = await page.locator('[data-rows] .pill--confirmed').count();
  assert.equal(cancelledPills, 0, 'status filter applied');
  await page.fill('[data-filter-search]', 'zzzz-no-match');
  assert.ok(await page.locator('[data-empty]').isVisible(), 'empty state shown');
  await page.locator('[data-empty] [data-clear]').click();
  assert.ok((await page.locator('[data-stats] .stat').count()) === 4);
  await page.screenshot({ path: `${shots}dashboard-1440.png` });
  await context.close();
});

await browser.close();
server.kill();

const failed = results.filter((result) => !result.ok);
if (pageErrors.length) console.log(`\nScript errors:\n  ${pageErrors.join('\n  ')}`);
console.log(`\n${results.length - failed.length}/${results.length} checks passed${pageErrors.length ? `, ${pageErrors.length} script errors` : ''}\n`);
process.exit(failed.length || pageErrors.length ? 1 : 0);
