import { expect, Page } from '@playwright/test';
import { test } from './fixtures';
import { mockAdminDashboard, mockStats, loginAs } from './mocks';

async function setup(page: Page) {
  await mockAdminDashboard(page);
  await mockStats(page);
  await loginAs(page, 'ADMIN');
}

test('admin command center renders system stats from real API data', async ({ page }) => {
  await setup(page);

  await expect(page.getByRole('heading', { name: 'Admin Command Center' })).toBeVisible();
  await expect(page.getByText('Welcome back, QA Admin.', { exact: false })).toBeVisible();

  // Stat cards derive from the mocked users list; internship/community/app lists
  // are only loaded once their tabs are opened, so Content Load starts at 0.
  await expect(page.getByText('Active Nodes')).toBeVisible();
  await expect(page.getByText('2 Users')).toBeVisible();
  await expect(page.getByText('Content Load')).toBeVisible();
  await expect(page.getByText('0 Items')).toBeVisible();
  await expect(page.getByText('Pending Apps')).toBeVisible();
  await expect(page.locator('.admin-stat-card').filter({ hasText: 'Pending Apps' })).toContainText('0');

  // Default DIRECTORY tab lists user rows with role badges.
  const directoryTable = page.locator('.admin-table');
  await expect(directoryTable).toContainText('Maria Santos');
  await expect(directoryTable).toContainText('maria@internmatch.com');
  await expect(directoryTable.locator('.status-badge.student')).toContainText('STUDENT');
});

test('admin tab switching fetches the matching dataset', async ({ page }) => {
  await setup(page);

  const internshipsRequest = page.waitForRequest((r) => r.url().includes('/api/admin/internships') && !r.url().includes('/internships/'));
  await page.getByRole('button', { name: 'Postings' }).click();
  await internshipsRequest;

  await expect(page.locator('.admin-table')).toContainText('Backend Intern');
  await expect(page.locator('.admin-table')).toContainText('ACME Corp');

  const appsRequest = page.waitForRequest((r) => r.url().includes('/api/admin/applications'));
  await page.getByRole('button', { name: 'Apps' }).click();
  await appsRequest;
  await expect(page.locator('.admin-table')).toContainText('Maria Santos');
});

test('admin can terminate a non-self user after confirming', async ({ page }) => {
  await setup(page);
  const requests: string[] = [];
  await page.route('**/api/auth/users/*', async (route) => {
    if (route.request().method() === 'DELETE') {
      requests.push(route.request().url());
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    } else {
      await route.continue();
    }
  });

  page.on('dialog', (dialog) => dialog.accept());
  await page.locator('.admin-table').getByRole('button', { name: 'Terminate' }).click();

  await expect(page.locator('.toast').last()).toContainText('User access terminated successfully.');
  expect(requests).toHaveLength(1);
  expect(requests[0]).toContain('/api/auth/users/1');

  await expect(page.locator('.admin-table').getByText('Maria Santos')).toHaveCount(0);
  // The acting admin cannot be terminated; no Terminate button remains.
  await expect(page.locator('.admin-table').getByRole('button', { name: 'Terminate' })).toHaveCount(0);
});

test('admin dashboard surfaces backend load errors as system error toasts', async ({ page }) => {
  await mockAdminDashboard(page);
  await page.route('**/api/admin/community', async (route) => {
    await route.fulfill({ status: 500, contentType: 'application/json', body: '{}' });
  });
  await mockStats(page);
  await loginAs(page, 'ADMIN');

  await page.getByRole('button', { name: 'Community' }).click();

  await expect(page.getByText('System Error: Failed to retrieve COMMUNITY data.')).toBeVisible();
});