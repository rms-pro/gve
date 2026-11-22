import { defineConfig, devices } from '@playwright/test';

const executablePath = process.env.GVE_CHROMIUM_EXECUTABLE;

export default defineConfig({
  forbidOnly: !!process.env.CI,
  testDir: './tests/browser',
  use: {
    trace: 'retain-on-failure',
    baseURL: 'http://gve.test',
    ...devices['Desktop Chrome'],
    launchOptions: executablePath
      ? { executablePath, args: ['--single-process'] }
      : undefined,
  },
  projects: process.env.GVE_CROSS_BROWSER
    ? [
        { name: 'Chromium' },
        {
          name: 'Firefox',
          use: { ...devices['Desktop Firefox'], browserName: 'firefox' },
        },
        {
          name: 'WebKit',
          use: { ...devices['Desktop Safari'], browserName: 'webkit' },
        },
      ]
    : [{ name: 'Chromium' }],
});
