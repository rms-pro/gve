import { expect, test as base } from '@playwright/test';
import { resolve, sep } from 'node:path';

export const test = base.extend({
  page: async ({ page }, use) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    const root = resolve('apps/playground/dist');
    await page.route('http://gve.test/**', async (route) => {
      const path = new URL(route.request().url()).pathname;
      const file = resolve(root, '.' + (path === '/' ? '/index.html' : path));
      if (!file.startsWith(root + sep)) {
        await route.abort();
        return;
      }
      await route.fulfill({ path: file });
    });
    await use(page);
    expect(errors, 'browser console errors and unhandled exceptions').toEqual(
      [],
    );
  },
});
