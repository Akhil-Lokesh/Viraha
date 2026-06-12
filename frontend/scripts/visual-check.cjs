/**
 * Dark Cinematic visual gate — drives the real app in headless Chromium,
 * screenshots every page at desktop + mobile widths, and logs console errors
 * and 5xx responses per page. Run from frontend/:
 *
 *   node scripts/visual-check.cjs
 *
 * Env (defaults match the demo seed):
 *   BASE_URL=http://localhost:3002  SEED_EMAIL=anya@viraha.com  SEED_PASSWORD=password123
 */
const { chromium } = require('@playwright/test');
const { mkdirSync } = require('fs');

const BASE = process.env.BASE_URL || 'http://localhost:3002';
const OUT = process.env.OUT_DIR || '/tmp/viraha-cinema';
const EMAIL = process.env.SEED_EMAIL || 'anya@viraha.com';
const PASSWORD = process.env.SEED_PASSWORD || 'password123';

const PUBLIC_PAGES = ['/', '/sign-in', '/sign-up'];
const APP_PAGES = [
  '/home',
  '/explore',
  '/map',
  '/albums',
  '/journals',
  '/atlas',
  '/saved',
  '/activity',
  '/settings',
  '/create/post',
  '/profile/anya',
];

(async () => {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    // Software WebGL so MapLibre renders in headless captures.
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });

  for (const vp of [
    { w: 1280, h: 900, tag: 'desktop' },
    { w: 390, h: 844, tag: 'mobile' },
  ]) {
    const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h } });
    const page = await ctx.newPage();
    const errs = [];
    page.on('console', (m) => m.type() === 'error' && errs.push(m.text().slice(0, 160)));
    page.on('response', (r) => r.status() >= 500 && errs.push(`${r.status()} ${r.url().slice(0, 70)}`));

    const shoot = async (path, name) => {
      try {
        await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
        // Wait for real content (hydration + data), not just the document.
        await page
          .waitForFunction(() => (document.body?.innerText || '').trim().length > 30, null, {
            timeout: 25000,
          })
          .catch(() => {});
        await page.waitForTimeout(2200);
        const file = `${OUT}/${vp.tag}${name.replace(/\//g, '_') || '_root'}.png`;
        await page.screenshot({ path: file, timeout: 45000 });
        const txt = (await page.locator('body').innerText().catch(() => '')).replace(/\s+/g, ' ').slice(0, 110);
        console.log(`[${vp.tag}${name}] ${page.url()} :: ${txt || 'EMPTY'}`);
      } catch (e) {
        console.log(`[${vp.tag}${name}] FAILED: ${String(e).split('\n')[0].slice(0, 140)}`);
      }
    };

    for (const p of PUBLIC_PAGES) await shoot(p, p === '/' ? '/landing' : p);

    // login as the content-rich seeded user
    try {
      await page.goto(`${BASE}/sign-in`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.getByLabel('Email').fill(EMAIL, { timeout: 20000 });
      await page.getByLabel('Password', { exact: false }).first().fill(PASSWORD);
      await page.getByRole('button', { name: /sign in|log in/i }).first().click();
      await page.waitForURL('**/home', { timeout: 25000 }).catch(() => {});
      await page.waitForTimeout(2000);
      // Dismiss the one-time FirstRun welcome so it doesn't occlude captures
      // (its dismissal persists in localStorage for the rest of the context).
      await page
        .getByRole('button', { name: /skip for now/i })
        .click({ timeout: 5000 })
        .catch(() => {});
      await page.waitForTimeout(600);
      console.log(`[${vp.tag}] post-login url: ${page.url()}`);
    } catch (e) {
      console.log(`[${vp.tag}] LOGIN FAILED: ${String(e).split('\n')[0].slice(0, 140)}`);
    }

    for (const p of APP_PAGES) await shoot(p, p);

    // post detail: open the first post link found on explore
    try {
      await page.goto(`${BASE}/explore`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(2500);
      const postHref = await page.locator('a[href^="/post/"]').first().getAttribute('href', { timeout: 10000 });
      if (postHref) await shoot(postHref, '/post-detail');
      else console.log(`[${vp.tag}] WARN: no /post/ link found on explore`);
    } catch {
      console.log(`[${vp.tag}] WARN: post-detail capture failed`);
    }

    console.log(`-- ${vp.tag} console/5xx errors (${errs.length}) --`);
    [...new Set(errs)].slice(0, 20).forEach((e) => console.log('  •', e));
    await ctx.close();
  }

  await browser.close();
  console.log(`DONE — screenshots in ${OUT}`);
})();
