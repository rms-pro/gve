import { expect } from '@playwright/test';
import axe from 'axe-core';
import { test } from './fixture.js';

test('plays, rewinds, seeks and applies validated input', async ({
  page,
  browserName,
}) => {
  await page.goto('/playground/');
  // WebKit defaults to Option+Tab for keyboard navigation to links.
  await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
  const skipLink = page.getByRole('link', { name: 'Skip to visualization' });
  await expect(skipLink).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Bubble Sort',
  );
  const values = page.locator('.gve-value');
  await page.locator('.gve-canvas').press('ArrowRight');
  await expect(page.getByRole('slider', { name: 'Timeline' })).toHaveAttribute(
    'aria-valuetext',
    /^Step 1 of /,
  );
  await page.locator('.gve-canvas').press('ArrowLeft');
  await expect(values).toHaveText(['8', '3', '5', '1', '9', '4', '7', '2']);
  await page.getByRole('button', { name: 'Next step' }).click();
  await page.getByRole('button', { name: 'Next step' }).click();
  await expect(values.first()).toHaveText('3');
  await page.getByRole('button', { name: 'Previous step' }).click();
  await expect(values.first()).toHaveText('8');
  const timeline = page.getByRole('slider', { name: 'Timeline' });
  await timeline.focus();
  await timeline.press('End');
  await expect(values).toHaveText(['1', '2', '3', '4', '5', '7', '8', '9']);
  const input = page.getByLabel('Input JSON');
  await input.fill('[');
  await page.getByRole('button', { name: 'Apply input' }).click();
  await expect(input).toHaveAttribute('aria-invalid', 'true');
  await expect(input).toHaveAccessibleDescription(
    await page.getByRole('alert').innerText(),
  );
  await input.fill('null');
  await expect(input).not.toHaveAttribute('aria-invalid');
  await expect(page.getByRole('alert')).toHaveCount(0);
  await page.getByRole('button', { name: 'Apply input' }).click();
  await expect(page.getByRole('alert')).toContainText('schema');
  await input.fill('[2,1]');
  await page.getByRole('button', { name: 'Apply input' }).click();
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(values).toHaveText(['1', '2']);
});

test('selects a graph algorithm and switches themes on a narrow screen', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/playground/');
  await page.getByRole('button', { name: 'Breadth-first Search' }).click();
  await expect(
    page.getByRole('img', { name: 'graph with 5 nodes' }),
  ).toBeVisible();
  await page.getByLabel('Theme').selectOption('light');
  await expect(page.locator('.gve')).toHaveAttribute('data-theme', 'light');
  const fits = await page.evaluate(
    () => document.documentElement.scrollWidth === innerWidth,
  );
  expect(fits).toBe(true);
  const canvas = page.getByRole('region', { name: 'Visualization canvas' });
  await expect(canvas).toHaveAccessibleDescription(/Shift/);
  await canvas.press('Shift+ArrowRight');
  await expect.poll(() => canvas.evaluate((element) => element.scrollLeft))
    .toBeGreaterThan(0);
  await expect(page.getByRole('slider', { name: 'Timeline' }))
    .toHaveAttribute('aria-valuetext', /^Step 0 of /);
  await canvas.press('Shift+ArrowLeft');
  await expect.poll(() => canvas.evaluate((element) => element.scrollLeft))
    .toBe(0);
});

test('pauses, changes speed, resets and disposes the running view on selection', async ({
  page,
}) => {
  await page.clock.install();
  await page.goto('/playground/');
  const timeline = page.getByRole('slider', { name: 'Timeline' });
  await expect(
    page.getByRole('button', { name: 'Stop and reset' }),
  ).toBeDisabled();
  await page.getByLabel('Speed').selectOption('2');
  await page.clock.pauseAt(new Date(Date.now() + 60_000));
  await page
    .getByRole('button', { name: 'Play', exact: true })
    .dispatchEvent('click');
  await page.clock.runFor(230);
  await expect(timeline).toHaveAttribute('aria-valuetext', /^Step 1 of /);
  await page
    .getByRole('button', { name: 'Pause', exact: true })
    .dispatchEvent('click');
  await page.clock.runFor(500);
  await expect(timeline).toHaveAttribute('aria-valuetext', /^Step 1 of /);
  await page
    .getByRole('button', { name: 'Play', exact: true })
    .dispatchEvent('click');
  await page.clock.runFor(230);
  await expect(timeline).toHaveAttribute('aria-valuetext', /^Step 2 of /);
  await page
    .getByRole('button', { name: 'Stop and reset' })
    .dispatchEvent('click');
  await expect(timeline).toHaveAttribute('aria-valuetext', /^Step 0 of /);
  await page
    .getByRole('button', { name: 'Play', exact: true })
    .dispatchEvent('click');
  await page
    .getByRole('button', { name: 'Depth-first Search' })
    .dispatchEvent('click');
  await page.clock.runFor(500);
  await expect(timeline).toHaveAttribute('aria-valuetext', /^Step 0 of /);
});

test('axe scans both themes and reduced motion removes cell transitions', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/playground/');
  await page.addScriptTag({ content: axe.source });
  for (const theme of ['dark', 'light']) {
    await page.getByLabel('Theme').selectOption(theme);
    await expect(page.locator('.gve')).toHaveAttribute('data-theme', theme);
    const violations = await page.evaluate(async () =>
      (
        await (window as unknown as { axe: typeof axe }).axe.run(document, {
          runOnly: {
            type: 'tag',
            values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
          },
        })
      ).violations.map(({ id, nodes }) => ({
        id,
        targets: nodes.map((node) => node.target),
      })),
    );
    expect(violations).toEqual([]);
  }
  await page.getByRole('button', { name: 'Next step' }).click();
  await expect(
    page.getByRole('group', { name: 'Highlighted: 8' }),
  ).toBeVisible();
  await expect(page.locator('.gve-value').first()).toHaveCSS(
    'transition-duration',
    '0s',
  );
});
