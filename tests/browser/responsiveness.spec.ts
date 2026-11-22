import { expect } from '@playwright/test';
import { test } from './fixture.js';

test('records interaction-to-next-frame latency on a larger visual state', async ({
  page,
}, info) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Merge Sort', exact: true }).click();
  await page
    .getByLabel('Input JSON')
    .fill(
      JSON.stringify(Array.from({ length: 200 }, (_, i) => (i * 31) % 203)),
    );
  await page.getByRole('button', { name: 'Apply input' }).click();
  await expect(page.locator('.gve-value')).toHaveCount(200);
  const samples = await page.evaluate(async () => {
    const button = document.querySelector<HTMLButtonElement>(
      'button[aria-label="Next step"]',
    );
    if (!button) throw new Error('Next step control is missing.');
    const samples: number[] = [];
    for (let i = 0; i < 20; i++) {
      const start = performance.now();
      button.click();
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );
      samples.push(performance.now() - start);
    }
    return samples.sort((a, b) => a - b);
  });
  await expect(page.getByRole('slider', { name: 'Timeline' })).toHaveAttribute(
    'aria-valuetext',
    /^Step 20 of /,
  );
  const summary = {
    points: samples.length,
    medianMs: samples[9],
    p95Ms: samples[18],
  };
  await info.attach('interaction-to-frame-timing', {
    body: JSON.stringify(summary),
    contentType: 'application/json',
  });
  console.log(info.project.name, summary);
});
