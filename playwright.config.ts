import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  reporter: 'list',
  workers: 1,
  timeout: 15000,
  use: {
    baseURL: 'http://localhost:4173',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
  webServer: [
    {
      command: 'node index.js',
      cwd: 'server',
      port: 3001,
      reuseExistingServer: false,
      env: {
        DATA_DIR: '.',
        ADMIN_USER: 'admin',
        ADMIN_PASS: 'ygg2026',
      },
    },
    {
      command: 'npx vite preview --port 4173',
      port: 4173,
      reuseExistingServer: true,
    },
  ],
});
