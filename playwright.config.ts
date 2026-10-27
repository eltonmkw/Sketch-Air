import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: true,
  workers: process.env.CI ? 2 : undefined,
  retries: 0,
  use: { baseURL: 'http://127.0.0.1:4173', trace: 'retain-on-failure' },
  webServer: [
    {
      command: 'npm run dev -- --mode test --host 127.0.0.1 --port 4173 --strictPort',
      env: { ENV: 'TESTING', NODE_ENV: 'test', VERCEL_ENV: '', VERCEL_TARGET_ENV: '' },
      url: 'http://127.0.0.1:4173',
    },
    {
      // Deliberately set ENV=TESTING and mode=test during a real build. No mock may ship.
      command: 'npm run build -- --mode test && npm run preview -- --host 127.0.0.1 --port 4174 --strictPort',
      env: { ENV: 'TESTING', NODE_ENV: 'production', VERCEL_ENV: 'production', VERCEL_TARGET_ENV: 'production' },
      url: 'http://127.0.0.1:4174',
    },
    {
      command: 'npm run build -- --outDir dist-preview && npm run preview -- --outDir dist-preview --host 127.0.0.1 --port 4175 --strictPort',
      env: { ENV: 'TESTING', NODE_ENV: 'production', VERCEL_ENV: 'preview', VERCEL_TARGET_ENV: 'preview' },
      url: 'http://127.0.0.1:4175',
    },
  ],
});
