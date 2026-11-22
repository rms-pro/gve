import assert from 'node:assert/strict';
import { resolve, sep } from 'node:path';
import { chromium, expect } from '@playwright/test';

export async function verifyConsumerBrowser(consumer) {
  const executablePath = process.env.GVE_CHROMIUM_EXECUTABLE;
  const browser = await chromium.launch(
    executablePath ? { executablePath, args: ['--single-process'] } : {},
  );
  try {
    const page = await browser.newPage({ baseURL: 'http://consumer.test' });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    const dist = resolve(consumer, 'dist');
    await page.route('http://consumer.test/**', async (route) => {
      const { pathname } = new URL(route.request().url());
      const file = resolve(
        dist,
        '.' + (pathname === '/' ? '/index.html' : pathname),
      );
      if (!file.startsWith(dist + sep)) return route.abort();
      await route.fulfill({ path: file });
    });
    await page.clock.install();
    await page.addInitScript(() => {
      const { setTimeout, clearTimeout } = window;
      const frames = new Set();
      window.gvePendingFrames = frames;
      window.setTimeout = (callback, delay, ...args) => {
        if (delay !== 420) return setTimeout(callback, delay, ...args);
        const id = setTimeout(() => {
          frames.delete(id);
          callback(...args);
        }, delay);
        frames.add(id);
        return id;
      };
      window.clearTimeout = (id) => {
        frames.delete(id);
        clearTimeout(id);
      };
    });
    await page.goto('/');
    const timeline = page.getByRole('slider', { name: 'Timeline' });
    await expect(timeline).toHaveAttribute('aria-valuetext', /^Step 0 of /);
    await expect(page.locator('.gve-canvas')).toHaveCSS('display', 'grid');
    await page.getByRole('button', { name: 'Next step' }).click();
    await expect(timeline).toHaveAttribute('aria-valuetext', /^Step 1 of /);
    await page.getByRole('button', { name: 'Previous step' }).click();
    await expect(timeline).toHaveAttribute('aria-valuetext', /^Step 0 of /);
    await page.clock.pauseAt(new Date(Date.now() + 60_000));
    await page
      .getByRole('button', { name: 'Play', exact: true })
      .dispatchEvent('click');
    await page.clock.runFor(430);
    await expect(timeline).toHaveAttribute('aria-valuetext', /^Step 1 of /);
    assert.equal(await page.evaluate(() => window.gvePendingFrames.size), 1);
    await page.evaluate(() => window.unmountGve());
    await expect(timeline).toHaveCount(0);
    assert.equal(await page.evaluate(() => window.gvePendingFrames.size), 0);
    await page.clock.runFor(1000);
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
}
