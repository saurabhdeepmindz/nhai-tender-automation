import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import { getRunDir } from './e2e/run-dir';

/**
 * Every test run gets its own timestamped folder under
 * ../tests/frontend/e2e-history/ - never overwritten, so past runs stay
 * available for defect investigation (videos, screenshots, traces).
 */
const runDir = getRunDir();

export default defineConfig({
  testDir: './e2e',
  outputDir: path.join(runDir, 'artifacts'),
  fullyParallel: false,
  retries: 0,
  reporter: [
    ['list'],
    ['html', { outputFolder: path.join(runDir, 'html-report'), open: 'never' }],
  ],
  use: {
    baseURL: 'http://localhost:3000',
    video: 'on',
    screenshot: 'on',
    trace: 'on',
    actionTimeout: 15000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
