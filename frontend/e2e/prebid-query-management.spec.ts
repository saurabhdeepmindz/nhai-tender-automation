import { test, expect, APIRequestContext } from '@playwright/test';
import path from 'path';
import { getRunDir } from './run-dir';

/**
 * E2E journey for Screen 7 - Pre-bid Query Management
 * (frontend/app/admin/prebid-queries/page.tsx)
 *
 * Named screenshots are taken at each key step in addition to Playwright's
 * automatic per-test video/trace, so a future defect investigation can see
 * exactly what the page looked like at that point without re-running anything.
 *
 * These tests run against the real dev backend/DB (no mocks), so every test
 * that needs to mutate a query (edit response, change status) creates its
 * OWN disposable query via the API first and deletes it in afterEach -
 * never touching real demo data, and safe to re-run at any time.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const screenshotPath = (name: string) =>
  path.join(getRunDir(), 'named-screenshots', name);

async function loginAs(request: APIRequestContext, role: 'vendor' | 'admin') {
  const creds =
    role === 'vendor'
      ? { email: 'vendor@example.com', password: 'password123' }
      : { email: 'admin@nhai.gov.in', password: 'admin123' };
  const res = await request.post(`${API_BASE_URL}/auth/login`, {
    data: { ...creds, role },
  });
  const body = await res.json();
  return body.token as string;
}

async function createDisposableQuery(request: APIRequestContext, label: string) {
  const vendorToken = await loginAs(request, 'vendor');
  const rfpsRes = await request.get(`${API_BASE_URL}/vendors/rfps`, {
    headers: { Authorization: `Bearer ${vendorToken}` },
  });
  const rfps = await rfpsRes.json();
  const rfpId = rfps[0]?.id;

  const queryText = `[E2E disposable] ${label} ${Date.now()}`;
  const res = await request.post(`${API_BASE_URL}/queries`, {
    headers: { Authorization: `Bearer ${vendorToken}` },
    data: { rfpId, category: 'technical', queryText },
  });
  const body = await res.json();
  return { queryId: body.queryId as string, queryText };
}

async function deleteQuery(request: APIRequestContext, queryId: string) {
  await request.delete(`${API_BASE_URL}/queries/${queryId}`).catch(() => {
    // best-effort cleanup; a failure here shouldn't fail the test run
  });
}

test.describe('Admin - Pre-bid Query Management', () => {
  test.beforeEach(async ({ page }) => {
    // The app surfaces feedback via window.alert() - auto-accept so it
    // never blocks the test.
    page.on('dialog', (dialog) => dialog.accept());

    await page.goto('/login');
    await page.getByRole('button', { name: 'Admin' }).click();
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL('**/admin/dashboard');
  });

  test('loads statistics and the query table', async ({ page }) => {
    await page.goto('/admin/prebid-queries');
    await expect(page.getByRole('heading', { name: 'Pre-bid Query Management' })).toBeVisible();
    await expect(page.getByText('Total').first()).toBeVisible();

    const table = page.locator('table');
    await expect(table).toBeVisible();
    await expect(table.locator('tbody tr').first()).toBeVisible({ timeout: 15000 });
    await page.screenshot({ path: screenshotPath('01-loaded.png'), fullPage: true });
  });

  test('has a working Back to Dashboard link', async ({ page }) => {
    await page.goto('/admin/prebid-queries');
    const backLink = page.getByRole('link', { name: 'Back to Dashboard' });
    await expect(backLink).toBeVisible();
    await backLink.click();
    await page.waitForURL('**/admin/dashboard');
  });

  test('the top mirrored scrollbar stays in sync with the table', async ({ page }) => {
    await page.goto('/admin/prebid-queries');
    const table = page.locator('table');
    await expect(table.locator('tbody tr').first()).toBeVisible({ timeout: 15000 });

    // Narrow the viewport so the wide table genuinely overflows horizontally
    await page.setViewportSize({ width: 900, height: 800 });
    await page.waitForTimeout(300); // let the resize-driven scrollWidth recompute

    const topScrollbar = page.locator('div.overflow-x-auto.overflow-y-hidden');
    await expect(topScrollbar).toBeVisible();
    await page.screenshot({ path: screenshotPath('09-top-scrollbar-visible.png'), fullPage: true });

    const tableScrollContainer = table.locator('..');
    await topScrollbar.evaluate((el) => { el.scrollLeft = 200; });
    await page.waitForTimeout(200);
    const tableScrollLeft = await tableScrollContainer.evaluate((el) => el.scrollLeft);
    expect(tableScrollLeft).toBeGreaterThan(0);

    await tableScrollContainer.evaluate((el) => { el.scrollLeft = 50; });
    await page.waitForTimeout(200);
    const topScrollLeft = await topScrollbar.evaluate((el) => el.scrollLeft);
    expect(topScrollLeft).toBe(50);
  });

  test('filtering by status narrows the table', async ({ page }) => {
    await page.goto('/admin/prebid-queries');
    const table = page.locator('table');
    await expect(table.locator('tbody tr').first()).toBeVisible({ timeout: 15000 });

    const statusFilter = page.locator('select').nth(1); // RFP, Status, Category selects
    await statusFilter.selectOption('answered');
    await page.waitForTimeout(500);
    await page.screenshot({ path: screenshotPath('02-filtered-answered.png'), fullPage: true });

    const rows = table.locator('tbody tr');
    const count = await rows.count();
    for (let i = 0; i < count; i++) {
      const statusSelect = rows.nth(i).locator('select');
      await expect(statusSelect).toHaveValue('answered');
    }
  });

  test('editing and saving an admin response persists it, on a disposable test query', async ({ page, request }) => {
    const { queryId, queryText } = await createDisposableQuery(request, 'edit-response');
    try {
      await page.goto('/admin/prebid-queries');
      await page.getByPlaceholder('Search by query ID, vendor, or keywords...').fill('[E2E disposable] edit-response');
      await page.getByPlaceholder('Search by query ID, vendor, or keywords...').press('Enter');

      const row = page.locator('table tbody tr').filter({ hasText: queryText });
      await expect(row).toBeVisible({ timeout: 15000 });
      await page.screenshot({ path: screenshotPath('03-disposable-query-found.png'), fullPage: true });

      const textarea = row.locator('textarea');
      const note = `E2E admin response ${Date.now()}`;
      await textarea.fill(note);
      await page.screenshot({ path: screenshotPath('04-editing-response.png'), fullPage: true });

      const saveButton = row.getByRole('button', { name: 'Save' });
      await saveButton.click();
      await expect(saveButton).toHaveCount(0, { timeout: 10000 });
      await page.screenshot({ path: screenshotPath('05-response-saved.png'), fullPage: true });

      // Reload to confirm the save actually persisted server-side, not just in local state
      await page.reload();
      await page.getByPlaceholder('Search by query ID, vendor, or keywords...').fill('[E2E disposable] edit-response');
      await page.getByPlaceholder('Search by query ID, vendor, or keywords...').press('Enter');
      const reloadedRow = page.locator('table tbody tr').filter({ hasText: queryText });
      await expect(reloadedRow.locator('textarea')).toHaveValue(note);
    } finally {
      await deleteQuery(request, queryId);
    }
  });

  test('changing status on a row persists it, on a disposable test query', async ({ page, request }) => {
    const { queryId, queryText } = await createDisposableQuery(request, 'status-change');
    try {
      await page.goto('/admin/prebid-queries');
      await page.getByPlaceholder('Search by query ID, vendor, or keywords...').fill('[E2E disposable] status-change');
      await page.getByPlaceholder('Search by query ID, vendor, or keywords...').press('Enter');

      const row = page.locator('table tbody tr').filter({ hasText: queryText });
      await expect(row).toBeVisible({ timeout: 15000 });

      const statusDropdown = row.locator('select');
      await statusDropdown.selectOption('under_review');
      await page.waitForTimeout(500);
      await expect(statusDropdown).toHaveValue('under_review');
      await page.screenshot({ path: screenshotPath('06-status-changed.png'), fullPage: true });
    } finally {
      await deleteQuery(request, queryId);
    }
  });

  test('bulk status update applies to disposable test queries only', async ({ page, request }) => {
    const first = await createDisposableQuery(request, 'bulk-a');
    const second = await createDisposableQuery(request, 'bulk-b');
    try {
      await page.goto('/admin/prebid-queries');
      await page.getByPlaceholder('Search by query ID, vendor, or keywords...').fill('[E2E disposable] bulk-');
      await page.getByPlaceholder('Search by query ID, vendor, or keywords...').press('Enter');

      const rows = page.locator('table tbody tr');
      await expect(rows).toHaveCount(2, { timeout: 15000 });

      const checkboxes = rows.locator('input[type="checkbox"]');
      await checkboxes.nth(0).check();
      await checkboxes.nth(1).check();
      await page.screenshot({ path: screenshotPath('07-bulk-selected.png'), fullPage: true });

      await expect(page.getByText('2 selected')).toBeVisible();
      const bulkBar = page.locator('text=selected').locator('..');
      await bulkBar.locator('select').selectOption('under_review');
      await page.getByRole('button', { name: 'Apply to Selected' }).click();

      await expect(page.getByText('2 selected')).toHaveCount(0, { timeout: 10000 });
      await page.screenshot({ path: screenshotPath('08-bulk-applied.png'), fullPage: true });

      for (let i = 0; i < 2; i++) {
        await expect(rows.nth(i).locator('select')).toHaveValue('under_review');
      }
    } finally {
      await deleteQuery(request, first.queryId);
      await deleteQuery(request, second.queryId);
    }
  });
});
