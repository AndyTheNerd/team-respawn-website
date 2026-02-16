// @ts-nocheck
import { defineConfig } from '@playwright/test';

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  retries: isCI ? 2 : 1,
  use: {
    baseURL: 'http://localhost:4321',
    headless: true,
  },
  webServer: {
    command: 'npm run dev',
    port: 4321,
    reuseExistingServer: !isCI,
    timeout: 30_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
});
