import { test } from '@playwright/test';

test.describe('CI probe (temporary diagnostic)', () => {
  test('dump what /login renders on this machine', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' || msg.type() === 'warning') errors.push(`[console.${msg.type()}] ${msg.text()}`);
    });
    page.on('pageerror', (err) => errors.push(`[pageerror] ${err.message}`));
    page.on('requestfailed', (req) =>
      errors.push(`[requestfailed] ${req.url()} :: ${req.failure()?.errorText ?? 'unknown'}`),
    );
    page.on('response', (res) => {
      if (res.status() >= 400 && !res.url().startsWith('http://localhost')) {
        errors.push(`[http ${res.status()}] ${res.url()}`);
      }
    });

    await page.route('**/*', async (route) => {
      const u = route.request().url();
      if (u.startsWith('http://localhost')) return route.continue();
      await route.abort();
    });

    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(30_000);

    const html = await page.content();
    console.log('=== PROBE HTML HEAD ===');
    console.log(html.slice(0, 2500));
    console.log('=== PROBE DIAG ===');
    const emailCount = await page.locator('input[type="email"]').count().catch(() => -1);
    const rootChildren = await page.locator('#root > *').count().catch(() => -1);
    console.log('emailInputCount=' + emailCount);
    console.log('rootChildren=' + rootChildren);
    console.log('diag lines (' + errors.length + '):');
    errors.forEach((e) => console.log('  ' + e.slice(0, 400)));
    console.log('=== PROBE END ===');
  });
});