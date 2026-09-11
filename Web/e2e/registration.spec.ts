import { expect } from '@playwright/test';
import { test } from './fixtures';

test('registration blocks empty submission before hitting the backend', async ({ page }) => {
  let registerHits = 0;
  await page.route('**/api/auth/register', async (route) => {
    registerHits++;
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });

  await page.goto('/register');
  await page.getByRole('button', { name: 'Create Account' }).click();

  expect(registerHits).toBe(0);
  await expect(page).toHaveURL(/\/register/);
});

test('registration succeeds and redirects to login', async ({ page }) => {
  let registerBody: unknown = null;
  await page.route('**/api/auth/register', async (route) => {
    registerBody = route.request().postDataJSON();
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });

  await page.goto('/register');
  await page.getByPlaceholder('Enter your full name').fill('New QA Student');
  await page.getByPlaceholder('name@company.com').fill('new.qa@internmatch.com');
  await page.getByPlaceholder('••••••••').fill('St0ngPass!2026');
  await page.locator('select').selectOption('EMPLOYER');
  await page.getByRole('button', { name: 'Create Account' }).click();

  await expect(page.locator('.auth-feedback--success')).toContainText('Account created! Redirecting to login...');
  await expect(page.locator('.toast').last()).toContainText('Registration successful. Please log in.');
  await page.waitForURL('**/login');

  expect(registerBody).toEqual({
    name: 'New QA Student',
    email: 'new.qa@internmatch.com',
    password: 'St0ngPass!2026',
    role: 'EMPLOYER',
  });
});

test('registration surfaces backend rejection inline and via toast', async ({ page }) => {
  let registerHits = 0;
  await page.route('**/api/auth/register', async (route) => {
    registerHits++;
    await route.fulfill({ status: 400, contentType: 'text/plain', body: 'Email already registered' });
  });

  await page.goto('/register');
  await page.getByPlaceholder('Enter your full name').fill('Duplicate User');
  await page.getByPlaceholder('name@company.com').fill('existing@example.com');
  await page.getByPlaceholder('••••••••').fill('St0ngPass!2026');
  await page.getByRole('button', { name: 'Create Account' }).click();

  await expect(page.locator('.auth-feedback--error')).toContainText('Email already registered');
  await expect(page.locator('.toast').last()).toContainText('Email already registered');
  expect(registerHits).toBe(1);
  await expect(page).toHaveURL(/\/register/);
});