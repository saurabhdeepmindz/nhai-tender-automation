import path from 'path';

/**
 * A single, stable timestamped folder for this Playwright invocation, shared
 * between playwright.config.ts and the test files themselves (so named
 * screenshots land next to the auto-captured video/trace for the same run).
 * Computed once and cached in an env var so config re-evaluation and worker
 * processes all agree on the same folder.
 */
export function getRunDir(): string {
  if (!process.env.PW_RUN_ID) {
    process.env.PW_RUN_ID = new Date().toISOString().replace(/[:.]/g, '-');
  }
  return path.join(__dirname, '..', '..', 'tests', 'frontend', 'e2e-history', process.env.PW_RUN_ID);
}
