import { test, expect } from '@playwright/test';
import path from 'path';
import { getRunDir } from './run-dir';

const screenshotPath = (name: string) => path.join(getRunDir(), 'named-screenshots', name);

test.describe('Admin - Chief Engineer Workflow', () => {
  test.beforeEach(async ({ page }) => {
    page.on('dialog', (dialog) => dialog.accept());
    await page.goto('/login');
    await page.getByRole('button', { name: 'Admin' }).click();
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL('**/admin/dashboard');
  });

  test('has a working Back to Dashboard link', async ({ page }) => {
    await page.goto('/admin/prebid-queries/workflow');
    await expect(page.getByRole('heading', { name: 'Chief Engineer Workflow' })).toBeVisible();
    await page.screenshot({ path: screenshotPath('10-workflow-loaded.png'), fullPage: true });

    const backLink = page.getByRole('link', { name: 'Back to Dashboard' });
    await expect(backLink).toBeVisible();
    await backLink.click();
    await page.waitForURL('**/admin/dashboard');
  });
});
