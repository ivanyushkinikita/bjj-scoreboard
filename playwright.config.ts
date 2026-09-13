import { defineConfig } from '@playwright/test';
export default defineConfig({ testDir: './e2e', workers: 1, use: { baseURL: 'http://127.0.0.1:1420', channel: 'msedge', viewport: { width: 1366, height: 768 } }, webServer: { command: 'node node_modules/vite/bin/vite.js --host 127.0.0.1', url: 'http://127.0.0.1:1420', reuseExistingServer: true }, reporter: 'list' });
