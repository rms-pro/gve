import { expect } from "@playwright/test";
import axe from "axe-core";
import { test } from "./fixture.js";

test("serves indexable pages and working navigation", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("GVE | Generic Visualizer Engine");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Make algorithms come alive.",
  );
  await page.getByRole("button", { name: "Next step" }).click();
  await expect(page.getByRole("slider", { name: "Timeline" })).toHaveAttribute(
    "aria-valuetext",
    /^Step 1 of /,
  );
  await page
    .getByRole("combobox", { name: "Theme", exact: true })
    .selectOption("dark");
  await page.getByRole("link", { name: "Get started" }).click();
  await expect(page).toHaveURL(/\/docs\/#quick-start$/);
  await expect(
    page.getByRole("combobox", { name: "Theme", exact: true }),
  ).toHaveValue("dark");
  await expect(
    page.getByRole("heading", { name: "Quick Start" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Examples", exact: true }).click();
  await expect(page.getByRole("main").locator("pre")).toHaveCount(5);
  await page.getByRole("link", { name: "Playground", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Bubble Sort",
  );
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("static documentation remains readable", async ({ page }) => {
    await page.goto("/docs/");
    await expect(
      page.getByRole("heading", { name: "Troubleshooting" }),
    ).toBeVisible();
  });
});

for (const path of ["/", "/docs/", "/examples/"]) {
  test(`checks responsive layout and accessibility on ${path}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto(path);
    await page.addScriptTag({ content: axe.source });
    for (const theme of ["light", "dark"]) {
      await page
        .getByRole("combobox", { name: "Theme", exact: true })
        .selectOption(theme);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBe(320);
      const violations = await page.evaluate(async () =>
        (
          await (window as unknown as { axe: typeof axe }).axe.run(document, {
            runOnly: {
              type: "tag",
              values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"],
            },
          })
        ).violations.map(({ id, nodes }) => ({
          id,
          targets: nodes.map((node) => node.target),
        })),
      );
      expect(violations).toEqual([]);
    }
  });
}
