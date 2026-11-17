import { defineConfig } from '@playwright/test';

const externalUrl = process.env.ERP_E2E_WEB_URL;
const baseURL = externalUrl || 'http://127.0.0.1:4173';

export default defineConfig({
  testDir: process.env.ERP_E2E_TEST_DIR || './e2e',
  timeout: 60_000,
  use: { baseURL, browserName: 'chromium', trace: 'retain-on-failure' },
  webServer: externalUrl
    ? undefined
    : {
        command: 'npm run dev -- --host 127.0.0.1 --port 4173 --strictPort',
        url: `${baseURL}/login`,
        timeout: 60_000,
        reuseExistingServer: false,
      },
});
