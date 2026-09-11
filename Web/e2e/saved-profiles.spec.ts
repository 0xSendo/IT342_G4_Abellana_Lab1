import { expect, Page } from '@playwright/test';
import { test } from './fixtures';
import { mockAuth, mockNotifications, mockSavedProfiles, loginAs } from './mocks';

async function setup(page: Page) {
  await mockAuth(page, 'EMPLOYER');
  await mockNotifications(page);
  await loginAs(page, 'EMPLOYER');
  await mockSavedProfiles(page);
  await page.goto('/saved-profiles');
}

test('saved profiles page renders bookmarked students from the API', async ({ page }) => {
  await setup(page);

  await expect(page.getByText('Bookmarked Students (2)')).toBeVisible();
  await expect(page.locator('.posting-card-pro')).toHaveCount(2);
  await expect(page.getByText('Maria Santos')).toBeVisible();
  await expect(page.getByText('Carlos Reyes')).toBeVisible();
  await expect(page.getByText('BS Information Technology').first()).toBeVisible();
});

test('opening a profile shows the student details and portfolio', async ({ page }) => {
  await setup(page);

  const card = page.locator('.posting-card-pro').filter({ hasText: 'Maria Santos' });
  await card.getByRole('button', { name: 'View Profile' }).click();

  const modal = page.locator('.modal-content');
  await expect(modal).toBeVisible();
  await expect(modal).toContainText('Maria Santos');
  await expect(modal).toContainText('BS Information Technology');
  await expect(modal).toContainText('3rd Year');
  await expect(modal).toContainText('Java');

  await modal.getByRole('button', { name: /Portfolio/ }).click();
  await expect(modal).toContainText('Passionate about test automation and clean code.');
  await expect(modal).toContainText('Built the company Playwright E2E suite from scratch.');
});

test('unsaving a profile removes it from the list', async ({ page }) => {
  await setup(page);

  const card = page.locator('.posting-card-pro').filter({ hasText: 'Maria Santos' });
  await card.locator('button.close-btn-glass').click();

  await expect(page.locator('.toast').last()).toContainText('Profile removed from saved list.');
  await expect(page.locator('.posting-card-pro')).toHaveCount(1);
  await expect(page.getByText('Carlos Reyes')).toBeVisible();
});

test('saved profiles page shows an empty state when there are no bookmarks', async ({ page }) => {
  await mockAuth(page, 'EMPLOYER');
  await mockNotifications(page);
  await loginAs(page, 'EMPLOYER');
  await mockSavedProfiles(page, { profiles: [] });
  await page.goto('/saved-profiles');

  await expect(page.getByText('Bookmarked Students (0)')).toBeVisible();
  await expect(page.getByText("You haven't saved any profiles yet.")).toBeVisible();
});