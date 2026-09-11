import { expect } from '@playwright/test';
import { test } from './fixtures';
import { mockAuth, mockStats, loginAs, ROLE_DASHBOARD } from './mocks';

test.describe('Access Control & Session Guard', () => {
  test('unauthenticated users are redirected to the login page', async ({ page }) => {
    await page.goto('/dashboard/student');
    await expect(page).toHaveURL(/\/login/);

    await page.goto('/feed');
    await expect(page).toHaveURL(/\/login/);

    await page.goto('/dashboard/employer');
    await expect(page).toHaveURL(/\/login/);
  });

  test('a student cannot access the employer dashboard', async ({ page }) => {
    await mockAuth(page, 'STUDENT');
    await mockStats(page);
    await loginAs(page, 'STUDENT');
    await expect(page).toHaveURL(/\/dashboard\/student/);

    await page.goto('/dashboard/employer');
    await expect(page).toHaveURL(/\/dashboard\/student/, { timeout: 15_000 });
  });

  test('logging out clears the session and re-protects private routes', async ({ page }) => {
    await mockAuth(page, 'STUDENT');
    await mockStats(page);
    await loginAs(page, 'STUDENT');

    page.on('dialog', (dialog) => dialog.accept());
    await page.click('.nav-logout');

    // Logout immediately bounces the user out of the protected dashboard.
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });

    // And the route stays protected afterwards.
    await page.goto('/feed');
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
  });

  test('home page redirects a logged-in student to their dashboard', async ({ page }) => {
    await mockAuth(page, 'STUDENT');
    await mockStats(page);
    await loginAs(page, 'STUDENT');

    await page.goto('/');
    await expect(page).toHaveURL(ROLE_DASHBOARD.STUDENT, { timeout: 15_000 });
  });
});