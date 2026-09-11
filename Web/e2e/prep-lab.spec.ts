import { expect, Page } from '@playwright/test';
import { test } from './fixtures';
import { mockAuth, mockNotifications, loginAs } from './mocks';

async function setup(page: Page) {
  await mockAuth(page, 'STUDENT');
  await mockNotifications(page);
  await loginAs(page, 'STUDENT');
  await page.goto('/prep-lab');
}

test('prep lab renders the simulator with the first practice question', async ({ page }) => {
  await setup(page);

  await expect(page.getByRole('heading', { name: 'Active Interview Simulator' })).toBeVisible();
  await expect(
    page.getByText(/Tell me about a time you faced a significant challenge in a project/)
  ).toBeVisible();
  await expect(page.locator('.simulator-card')).toContainText('Behavioral');

  const modulesStat = page.locator('.summary-stat-glass').filter({ hasText: 'Modules' });
  await expect(modulesStat).toContainText('5');

  await expect(page.locator('.resource-card')).toHaveCount(4);
  await expect(page.getByText('PH Resume Guide')).toBeVisible();
});

test('a short answer is rejected with a prompt to elaborate', async ({ page }) => {
  await setup(page);

  await page.locator('.answer-input-container textarea').fill('Too short');
  await page.getByRole('button', { name: /Evaluate Answer/ }).click();

  await expect(page.locator('.toast').last()).toContainText(
    'Please provide a more detailed answer for evaluation.'
  );
});

test('a detailed STAR answer produces an AI evaluation score', async ({ page }) => {
  await setup(page);

  const answer =
    'In that situation I organized the team and identified the main task. I managed the schedule ' +
    'and the result was delivered on time. The outcome taught me to prioritize clearly and the team worked well together.';
  await page.locator('.answer-input-container textarea').fill(answer);
  await page.getByRole('button', { name: /Evaluate Answer/ }).click();

  await expect(page.getByText('AI Evaluation Result')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(/Score: \d+%/)).toBeVisible();
  await expect(page.locator('.feedback-panel')).toContainText('Strengths:');
});

test('skip question advances to the next module', async ({ page }) => {
  await setup(page);

  await page.getByRole('button', { name: 'Skip Question' }).click();
  await expect(
    page.getByText(/Why do you want to intern with our company specifically/)
  ).toBeVisible();
});

test('checklist task completion updates readiness and persists across reload', async ({ page }) => {
  await setup(page);

  const starItem = page.locator('.check-item').filter({ hasText: 'STAR Method Practice' });
  await starItem.click();
  await expect(page.locator('.toast').last()).toContainText('Task completed!');
  await expect(page.locator('.check-item').filter({ hasText: 'STAR Method Practice' })).toHaveClass(/active/);
  await expect(page.locator('.readiness-score')).toContainText('25%');

  await page.reload();
  await expect(page.locator('.check-item').filter({ hasText: 'STAR Method Practice' })).toHaveClass(/active/);
  await expect(page.locator('.readiness-score')).toContainText('25%');
});