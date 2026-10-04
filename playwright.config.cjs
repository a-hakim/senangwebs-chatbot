const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: './tests/browser', fullyParallel: true, workers: process.env.CI ? 2 : 4,
  globalTimeout: 120000, retries: process.env.CI ? 1 : 0,
  use: { baseURL: 'http://127.0.0.1:8777', trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }, { name: 'firefox', use: { browserName: 'firefox' } }, { name: 'webkit', use: { browserName: 'webkit' } }],
  webServer: { command: 'node scripts/serve-examples.cjs', url: 'http://127.0.0.1:8777/tests/fixtures/browser.html', reuseExistingServer: !process.env.CI },
});
