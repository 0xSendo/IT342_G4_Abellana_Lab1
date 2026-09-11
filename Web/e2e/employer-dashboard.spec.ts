import { expect, Page } from '@playwright/test';
import { test } from './fixtures';
import { mockEmployerDashboard, mockStats, loginAs } from './mocks';

async function setup(page: Page) {
  await mockEmployerDashboard(page);
  await mockStats(page);
  await loginAs(page, 'EMPLOYER');
}

test('employer dashboard computes pipeline insights from real API data', async ({ page }) => {
  await setup(page);

  // Hero greeting uses the logged-in employer's first name.
  await expect(page.getByRole('heading', { name: /Manage your Talent Pipeline, QA/i })).toBeVisible();

  // Hero stats: 1 ACTIVE posting, 1 PENDING applicant (from mocked applications API).
  const activeJobs = page.locator('.summary-stat-glass').nth(0);
  await expect(activeJobs).toContainText('1');
  await expect(activeJobs).toContainText('Active Jobs');
  const newApplicants = page.locator('.summary-stat-glass').nth(1);
  await expect(newApplicants).toContainText('1');
  await expect(newApplicants).toContainText('New Applicants');

  // Company profile bento shows the company name from the authenticated user.
  await expect(page.getByRole('heading', { name: 'ACME Corp' })).toBeVisible();

  // Performance Pulse: 2 postings, 1 application, 0 shortlisted.
  await expect(page.getByRole('heading', { name: 'Performance Pulse' })).toBeVisible();
  await expect(page.locator('.bento-card.employer-stats-bento')).toContainText('Total Postings');
  await expect(page.locator('.bento-card.employer-stats-bento')).toContainText('Shortlisted');

  // Insight callout derives reach from applicant count (1 * 12).
  await expect(page.getByText('reached', { exact: false }).first()).toBeVisible();
  await expect(page.locator('.bento-card.employer-stats-bento .insight-callout-pro')).toContainText('12');

  // Posting cards show the mocked ACTIVE/CLOSED postings with applicant counts.
  const activeCard = page.locator('.posting-card-pro').filter({ hasText: 'Software Engineering Intern' });
  await expect(activeCard).toBeVisible();
  await expect(activeCard).toContainText('Applicants: 1');
  await expect(page.locator('.posting-card-pro').filter({ hasText: 'QA Automation Intern' })).toBeVisible();

  // Recent Applicants tab reflects the PENDING applicant entry.
  const applicantCard = page.locator('.applicant-card-pro').filter({ hasText: 'Maria Santos' });
  await expect(applicantCard).toBeVisible();
  await expect(applicantCard).toContainText('Applying for: Software Engineering Intern');
  await expect(applicantCard).toContainText('PENDING');
});

test('employer can create a new posting and see it append to the list', async ({ page }) => {
  await setup(page);

  await page.getByRole('button', { name: '+ New Posting' }).click();
  await expect(page.getByRole('heading', { name: 'Broadcast Internship' })).toBeVisible();

  // Whitespace-only required fields bypass browser validation but hit the custom
  // validation path in submitNewPosting.
  await page.locator('input[name="title"]').fill('   ');
  await page.locator('input[name="location"]').fill('   ');
  await page.locator('textarea[name="description"]').fill('   ');
  await page.getByRole('button', { name: 'Publish Opportunity' }).click();
  await expect(page.getByText('⚠️ Please fill out all required fields.')).toBeVisible();

  // Fill the required fields and publish.
  await page.locator('input[name="title"]').fill('Data Engineering Intern');
  await page.locator('input[name="location"]').fill('Pasig');
  await page.locator('textarea[name="description"]').fill('Build data pipelines with Spark and Airflow.');
  await page.getByRole('button', { name: 'Publish Opportunity' }).click();

  await expect(page.getByText('Internship posted successfully')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Broadcast Internship' })).toBeHidden();

  const newCard = page.locator('.posting-card-pro').filter({ hasText: 'Data Engineering Intern' });
  await expect(newCard).toBeVisible();
  await expect(newCard).toContainText('Applicants: 0');
});

test('employer sees moderation rejection inline when creating profanity posting', async ({ page }) => {
  await setup(page);
  await page.route('**/api/internships', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'MODERATION_ERROR: Prohibited language or topic detected.' }),
    });
  });

  await page.getByRole('button', { name: '+ New Posting' }).click();
  await page.locator('input[name="title"]').fill('energy drinks intern');
  await page.locator('input[name="location"]').fill('Manila');
  await page.locator('textarea[name="description"]').fill('Just a normal internship posting.');
  await page.getByRole('button', { name: 'Publish Opportunity' }).click();

  await expect(page.getByText('⚠️ Prohibited language or topic detected.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Broadcast Internship' })).toBeVisible();
});

test('employer can toggle posting status', async ({ page }) => {
  await setup(page);

  const activeCard = page.locator('.posting-card-pro').filter({ hasText: 'Software Engineering Intern' });
  await expect(activeCard).toContainText('ACTIVE');

  await activeCard.getByRole('button', { name: 'Toggle' }).click();

  await expect(page.locator('.toast').last()).toContainText('Posting status updated');
  await expect(activeCard.locator('.card-tag')).toHaveText('CLOSED');
});

test('employer can shortlist a pending applicant', async ({ page }) => {
  await setup(page);
  let requestUrl: string | null = null;
  await page.route('**/api/applications/*/status*', async (route) => {
    requestUrl = route.request().url();
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });

  const applicantCard = page.locator('.applicant-card-pro').filter({ hasText: 'Maria Santos' });
  await applicantCard.getByRole('button', { name: 'Shortlist' }).click();

  await expect(page.locator('.toast').last()).toContainText('Applicant status updated to SHORTLISTED');
  expect(requestUrl).toContain('?status=SHORTLISTED');
});