import { expect, Page } from '@playwright/test';
import { test } from './fixtures';
import { mockStudentDashboard, mockStats, mockFeed, loginAs } from './mocks';

async function setup(page: Page) {
  await mockStudentDashboard(page);
  await mockStats(page);
  await mockFeed(page);
  await loginAs(page, 'STUDENT');
}

test('student dashboard renders personalized insights from real API data', async ({ page }) => {
  await setup(page);

  // Hero greeting uses the logged-in student's first name.
  await expect(page.getByRole('heading', { name: /Welcome back, QA/i })).toBeVisible();

  // Summary stat tiles reflect the mocked applications state (1 total, 1 pending).
  await expect(page.locator('.summary-stat-glass').nth(0)).toContainText('1');
  await expect(page.locator('.summary-stat-glass').nth(0)).toContainText('Total Apps');
  await expect(page.locator('.summary-stat-glass').nth(1)).toContainText('Pending');

  // Profile completion computed from the user profile (name, email, program,
  // yearLevel, skills set => 5/7 fields = 71%).
  await expect(page.getByText('Career Readiness').first()).toBeVisible();
  await expect(page.getByText('Profile Completion').first()).toBeVisible();
  await expect(page.getByText('71%').first()).toBeVisible();

  // Pending connection request surfaced from the connections API.
  const requestCard = page.locator('.request-card-mini').filter({ hasText: 'ACME HR' });
  await expect(requestCard).toBeVisible();
  await expect(requestCard).toContainText('EMPLOYER');

  // Application card reflects the mocked application and its PENDING status.
  const appCard = page.locator('.bento-app-card').filter({ hasText: 'Software Engineering Intern' });
  await expect(appCard).toBeVisible();
  await expect(appCard).toContainText('PENDING');
});

test('student can accept an incoming connection request', async ({ page }) => {
  await setup(page);
  let respondUrl: string | null = null;
  await page.route('**/api/connections/respond/*', async (route) => {
    respondUrl = route.request().url();
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });

  await page.locator('.request-card-mini').filter({ hasText: 'ACME HR' }).getByRole('button', { name: 'Accept' }).click();

  await expect(page.getByText('Request accepted')).toBeVisible();
  expect(respondUrl).toContain('?status=ACCEPTED');
});

test('student can withdraw a pending application (client-side state only)', async ({ page }) => {
  await setup(page);

  const appCard = page.locator('.bento-app-card').filter({ hasText: 'Software Engineering Intern' });
  await appCard.getByRole('button', { name: 'Withdraw' }).click();

  await expect(page.locator('.toast').last()).toContainText('Application withdrawn');
  await expect(page.locator('.bento-app-card')).toHaveCount(0);
});

test('student dashboard shows empty states when no data is returned', async ({ page }) => {
  await mockStudentDashboard(page, { applications: [], friends: [], pending: [] });
  await mockStats(page);
  await mockFeed(page);
  await loginAs(page, 'STUDENT');

  await expect(page.getByText('No applications found.').first()).toBeVisible();
  await expect(page.getByText('No connections yet. Connect with employers to grow your network!').first()).toBeVisible();
});