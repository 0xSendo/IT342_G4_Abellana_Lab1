import { expect, Page } from '@playwright/test';
import { test } from './fixtures';
import { mockAuth, mockNotifications, mockProfileBuilder, loginAs } from './mocks';

async function setup(page: Page) {
  await mockAuth(page, 'STUDENT');
  await mockNotifications(page);
  await loginAs(page, 'STUDENT');
  await mockProfileBuilder(page);
  await page.goto('/profile/build');
}

test('profile builder loads the student essentials from the logged-in user', async ({ page }) => {
  await setup(page);

  await expect(page.locator('input[name="name"]')).toHaveValue('QA Test Student');
  await expect(page.locator('input[name="program"]')).toHaveValue('BS Computer Science');
  await expect(page.locator('select[name="yearLevel"]')).toHaveValue('3rd Year');

  await page.getByRole('button', { name: /Skills/ }).click();
  await expect(page.locator('textarea[name="skills"]')).toHaveValue('Java, React, Testing');
});

test('saving changes posts the edited profile to the API', async ({ page }) => {
  await setup(page);

  let submitted: Record<string, unknown> | null = null;
  await page.route('**/api/auth/profile', async (route) => {
    submitted = route.request().postDataJSON();
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(submitted) });
  });

  await page.fill('input[name="name"]', 'QA Improved Name');
  await page.click('button[type="submit"]');

  await expect(page.locator('.toast').last()).toContainText('Profile updated successfully!');
  expect(submitted).not.toBeNull();
  expect(submitted?.name).toBe('QA Improved Name');
});

test('moderation rejection surfaces the server message as a warning', async ({ page }) => {
  await mockAuth(page, 'STUDENT');
  await mockNotifications(page);
  await loginAs(page, 'STUDENT');
  await mockProfileBuilder(page, { putMessage: 'MODERATION_ERROR: Profanity detected' });
  await page.goto('/profile/build');

  await page.getByRole('button', { name: /Portfolio/ }).click();
  await page.fill('textarea[name="bio"]', 'A bio that would be flagged by moderation rules.');
  await page.click('button[type="submit"]');

  await expect(page.locator('.toast').last()).toContainText('Profanity detected');
});

test('student can upload a resume from the Resume tab', async ({ page }) => {
  await setup(page);

  await page.locator('.modal-tabs-pro').getByRole('button', { name: /Resume/ }).click();
  await expect(page.getByText('No resume uploaded yet.')).toBeVisible();

  await page.setInputFiles('input[type="file"]', {
    name: 'resume.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4 fake resume'),
  });

  await expect(page.locator('.toast').last()).toContainText('Resume uploaded successfully!');
  await expect(page.getByText('Resume is uploaded!')).toBeVisible();
  await expect(page.getByText('View Current Resume')).toBeVisible();
});