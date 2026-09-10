import { test, expect } from '@playwright/test';
import { mockAuth, mockStats, mockFeed, loginAs } from './mocks';

test.describe('Student Opportunity Feed', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'STUDENT');
    await mockStats(page);
    await mockFeed(page);
  });

  test('renders internship postings, community activity and the trends chart', async ({ page }) => {
    await loginAs(page, 'STUDENT');
    await page.goto('/feed');

    // Internship recommendation cards render mocked backend postings.
    await expect(page.getByRole('heading', { name: 'Software Engineering Intern' })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('heading', { name: 'QA Automation Intern' })).toBeVisible();
    await expect(page.getByText('ACME Corp').first()).toBeVisible();
    await expect(page.getByText('Globex').first()).toBeVisible();

    // The JobTrendsWidget renders its Recharts visualization.
    await expect(page.locator('.recharts-responsive-container').first()).toBeVisible({ timeout: 15_000 });

    // Community activity from the mocked feed is shown.
    await expect(page.getByText('Maria Santos')).toBeVisible();
    await expect(page.getByText('Just landed my first internship interview!')).toBeVisible();
  });

  test('rejects a community post that contains an obfuscated external link', async ({ page }) => {
    await loginAs(page, 'STUDENT');
    await page.goto('/feed');

    await page.locator('textarea').first().fill('Check out my portfolio at mypage dot com');
    await page.getByRole('button', { name: 'Post', exact: true }).click();

    await expect(page.getByText('External links and URLs are not allowed')).toBeVisible({ timeout: 5_000 });
  });

  test('submits an application from the internship detail modal', async ({ page }) => {
    await loginAs(page, 'STUDENT');
    await page.goto('/feed');

    await page.getByRole('button', { name: 'View & Apply' }).first().click();
    await expect(page.getByRole('heading', { name: 'Internship Details' })).toBeVisible();

    await page.getByRole('button', { name: 'Confirm Application' }).click();
    await expect(page.getByText(/Application submitted to/)).toBeVisible({ timeout: 5_000 });
  });
});