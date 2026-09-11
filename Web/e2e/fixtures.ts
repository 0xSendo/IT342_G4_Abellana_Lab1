import { test as base } from '@playwright/test';

export const test = base.extend<{ _blockNonLocalhost: void }>({
  _blockNonLocalhost: [
    async ({ page }, use) => {
      await page.route('**/*', async (route) => {
        const url = route.request().url();
        if (url.startsWith('http://localhost')) {
          await route.continue();
        } else {
          await route.abort();
        }
      });
      await use();
    },
    { auto: true },
  ],
});