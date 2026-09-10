import { test, expect } from '@playwright/test';

const MOCK_STUDENT = {
  token: 'playwright-mock-token',
  email: 'qa.student@internmatch.com',
  name: 'QA Test Student',
  role: 'STUDENT',
  program: 'BS Computer Science',
  yearLevel: '3rd Year',
  skills: 'Java, React, Testing',
};

const MOCK_USER = {
  email: MOCK_STUDENT.email,
  name: MOCK_STUDENT.name,
  role: MOCK_STUDENT.role,
  program: MOCK_STUDENT.program,
  yearLevel: MOCK_STUDENT.yearLevel,
  skills: MOCK_STUDENT.skills,
};

const MOCK_JOB_TRENDS = {
  data: [
    { sector: 'Services', employmentRate: 60.1 },
    { sector: 'Agriculture', employmentRate: 22.4 },
    { sector: 'Industry', employmentRate: 17.5 },
  ],
};

const MOCK_EMPLOYER_INTEREST = {
  data: [
    { category: 'Tech & Dev', postings: 12, applications: 45 },
    { category: 'Marketing', postings: 15, applications: 32 },
    { category: 'Design', postings: 5, applications: 28 },
  ],
};

test.describe('Login and Dashboard Visualization', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the backend auth endpoints so the E2E test runs without a live API.
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_STUDENT),
      });
    });

    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_USER),
      });
    });

    // Mock market-intelligence endpoints so the Recharts widget renders
    // real data (it also has a guaranteed fallback on failure).
    await page.route('**/api/v1/stats/job-trends', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_JOB_TRENDS),
      });
    });

    await page.route('**/api/v1/stats/employer-interest', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_EMPLOYER_INTEREST),
      });
    });
  });

  test('logs in via the form and shows the recharts visualization on the dashboard', async ({ page }) => {
    await page.goto('/login');

    // Fill the basic login UI input form.
    await page.fill('input[type="email"]', MOCK_STUDENT.email);
    await page.fill('input[type="password"]', 'QaPassword123!');
    await page.click('button[type="submit"]');

    // Successful STUDENT login redirects to the student dashboard.
    await expect(page).toHaveURL(/\/dashboard\/student/, { timeout: 15_000 });

    // The JobTrendsWidget wraps its charts in ResponsiveContainer, which
    // renders a .recharts-responsive-container element on the dashboard.
    const chart = page.locator('.recharts-responsive-container');
    await expect(chart.first()).toBeVisible({ timeout: 15_000 });
  });
});