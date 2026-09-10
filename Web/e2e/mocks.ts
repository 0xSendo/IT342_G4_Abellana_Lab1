import { type Page, expect } from '@playwright/test';

export interface MockUser {
  id: number;
  token: string;
  email: string;
  name: string;
  role: 'STUDENT' | 'EMPLOYER' | 'ADMIN';
  program?: string;
  yearLevel?: string;
  skills?: string;
  companyName?: string;
}

export const MOCK_USERS: Record<MockUser['role'], MockUser> = {
  STUDENT: {
    id: 11,
    token: 'playwright-mock-token',
    email: 'qa.student@internmatch.com',
    name: 'QA Test Student',
    role: 'STUDENT',
    program: 'BS Computer Science',
    yearLevel: '3rd Year',
    skills: 'Java, React, Testing',
  },
  EMPLOYER: {
    id: 22,
    token: 'playwright-mock-token',
    email: 'qa.hr@acme.com',
    name: 'QA HR Manager',
    role: 'EMPLOYER',
    companyName: 'ACME Corp',
  },
  ADMIN: {
    id: 33,
    token: 'playwright-mock-token',
    email: 'qa.admin@internmatch.com',
    name: 'QA Admin',
    role: 'ADMIN',
  },
};

export const ROLE_DASHBOARD: Record<MockUser['role'], string> = {
  STUDENT: '/dashboard/student',
  EMPLOYER: '/dashboard/employer',
  ADMIN: '/dashboard/admin',
};

export const MOCK_JOB_TRENDS = {
  data: [
    { sector: 'Services', employmentRate: 60.1 },
    { sector: 'Agriculture', employmentRate: 22.4 },
    { sector: 'Industry', employmentRate: 17.5 },
  ],
};

export const MOCK_EMPLOYER_INTEREST = {
  data: [
    { category: 'Tech & Dev', postings: 12, applications: 45 },
    { category: 'Marketing', postings: 15, applications: 32 },
    { category: 'Design', postings: 5, applications: 28 },
  ],
};

export const MOCK_INTERNSHIPS = [
  {
    id: 1,
    title: 'Software Engineering Intern',
    company: 'ACME Corp',
    location: 'Manila',
    setup: 'Hybrid',
    description: 'Build real product features end to end with our platform team.',
    createdAt: '2026-09-01T00:00:00',
    endDate: '2026-12-31',
  },
  {
    id: 2,
    title: 'QA Automation Intern',
    company: 'Globex',
    location: 'Quezon City',
    setup: 'Remote',
    description: 'Write automated tests and maintain the CI pipeline.',
    createdAt: '2026-09-05T00:00:00',
    endDate: '2026-12-31',
  },
];

export const MOCK_COMMUNITY_POSTS = [
  {
    id: 100,
    studentId: 999, // not the logged-in student, so "Share an Update" stays in create mode
    studentName: 'Maria Santos',
    studentProgram: 'BS Information Technology',
    content: 'Just landed my first internship interview!',
    type: 'GENERAL_UPDATE',
    createdAt: '2026-09-08T09:00:00',
  },
];

/**
 * Register route handlers for the authentication endpoints so the app runs
 * with a mocked session and no live backend.
 */
export async function mockAuth(page: Page, role: MockUser['role']) {
  const user = MOCK_USERS[role];
  await page.route('**/api/auth/login', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(user),
    });
  });
  await page.route('**/api/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(user),
    });
  });
}

/** Mock the market-intelligence endpoints used by the Recharts widgets. */
export async function mockStats(page: Page) {
  await page.route('**/api/v1/stats/job-trends', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_JOB_TRENDS) });
  });
  await page.route('**/api/v1/stats/employer-interest', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_EMPLOYER_INTEREST) });
  });
}

/** Mock the student feed data endpoints. */
export async function mockFeed(page: Page) {
  await page.route('**/api/internships/active', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_INTERNSHIPS) });
  });
  await page.route('**/api/community/all', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_COMMUNITY_POSTS) });
  });
  await page.route('**/api/notifications', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });
  await page.route('**/api/notifications/read-all', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
  await page.route('**/api/applications/apply/*', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 1 }) });
  });
}

export const MOCK_PENDING_REQUESTS = [
  { id: 5, requesterName: 'ACME HR', requesterRole: 'EMPLOYER' },
];

export const MOCK_MY_APPLICATIONS = [
  {
    id: 1,
    internshipTitle: 'Software Engineering Intern',
    company: 'ACME Corp',
    appliedAt: '2026-09-01T00:00:00',
    status: 'PENDING',
  },
];

export const MOCK_POSTINGS = [
  {
    id: 1,
    title: 'Software Engineering Intern',
    company: 'ACME Corp',
    location: 'Manila',
    setup: 'Hybrid',
    status: 'ACTIVE',
    createdAt: '2026-09-01T00:00:00',
  },
  {
    id: 2,
    title: 'QA Automation Intern',
    company: 'Globex',
    location: 'Quezon City',
    setup: 'Remote',
    status: 'CLOSED',
    createdAt: '2026-09-05T00:00:00',
  },
];

export const MOCK_POSTING_APPLICANTS = [
  {
    id: 7,
    studentId: 88,
    studentName: 'Maria Santos',
    studentEmail: 'maria@internmatch.com',
    studentProgram: 'BS Information Technology',
    studentYearLevel: '3rd Year',
    studentSkills: 'Java, Selenium',
    studentBio: 'Passionate about test automation.',
    studentProjects: 'Playwright E2E suite',
    internshipId: 1,
    internshipTitle: 'Software Engineering Intern',
    company: 'ACME Corp',
    resumePath: 'https://storage.example.com/maria.pdf',
    status: 'PENDING',
    appliedAt: '2026-09-06T10:00:00',
  },
];

export const MOCK_ADMIN_USERS = [
  { id: 1, name: 'Maria Santos', email: 'maria@internmatch.com', role: 'STUDENT' },
  { id: 2, name: 'QA Admin', email: 'qa.admin@internmatch.com', role: 'ADMIN' },
];

export const MOCK_ADMIN_INTERNSHIPS = [
  {
    id: 10,
    title: 'Backend Intern',
    company: 'ACME Corp',
    description: 'Build APIs.',
    postedByName: 'QA HR Manager',
    postedByEmail: 'qa.hr@acme.com',
    status: 'ACTIVE',
  },
];

export const MOCK_ADMIN_POSTS = [
  {
    id: 20,
    studentName: 'Maria Santos',
    studentEmail: 'maria@internmatch.com',
    content: 'Working hard on my capstone project.',
    type: 'GENERAL_UPDATE',
  },
];

export const MOCK_ADMIN_APPS = [
  {
    id: 30,
    studentName: 'Maria Santos',
    studentEmail: 'maria@internmatch.com',
    internshipId: 10,
    internshipTitle: 'Backend Intern',
    company: 'ACME Corp',
    status: 'PENDING',
  },
];

/** Mock the student dashboard data endpoints. */
export async function mockStudentDashboard(page: Page, opts: {
  applications?: unknown[];
  friends?: unknown[];
  pending?: unknown[];
} = {}) {
  const applications = opts.applications ?? MOCK_MY_APPLICATIONS;
  const friends = opts.friends ?? [];
  const pending = opts.pending ?? MOCK_PENDING_REQUESTS;
  await page.route('**/api/connections/pending', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(pending) });
  });
  await page.route('**/api/connections/friends', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(friends) });
  });
  await page.route('**/api/connections/respond/*', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
  await page.route('**/api/applications/my-applications', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(applications) });
  });
}

/** Mock the employer dashboard data endpoints. */
export async function mockEmployerDashboard(page: Page) {
  await page.route('**/api/connections/pending', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });
  await page.route('**/api/connections/friends', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });
  await page.route('**/api/internships/my-postings', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_POSTINGS) });
  });
  await page.route('**/api/applications/internship/1', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_POSTING_APPLICANTS) });
  });
  await page.route('**/api/applications/internship/2', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });
  await page.route('**/api/applications/*/status*', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
  await page.route('**/api/internships/1', async (route) => {
    if (route.request().method() === 'PUT') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...MOCK_POSTINGS[0], status: 'CLOSED' }),
      });
    } else {
      await route.continue();
    }
  });
  await page.route('**/api/internships', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 99,
          title: route.request().postDataJSON().title,
          description: route.request().postDataJSON().description,
          company: route.request().postDataJSON().company,
          location: route.request().postDataJSON().location,
          setup: route.request().postDataJSON().setup,
          status: route.request().postDataJSON().status,
          applicants: 0,
        }),
      });
    } else {
      await route.continue();
    }
  });
}

/** Mock the admin dashboard data endpoints. */
export async function mockAdminDashboard(page: Page) {
  await page.route('**/api/auth/users', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_ADMIN_USERS) });
    } else {
      await route.continue();
    }
  });
  await page.route('**/api/admin/internships', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_ADMIN_INTERNSHIPS) });
  });
  await page.route('**/api/admin/community', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_ADMIN_POSTS) });
  });
  await page.route('**/api/admin/applications', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_ADMIN_APPS) });
  });
  await page.route('**/api/auth/users/*', async (route) => {
    if (route.request().method() === 'DELETE') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    } else {
      await route.continue();
    }
  });
  await page.route('**/api/admin/internships/*', async (route) => {
    if (route.request().method() === 'DELETE') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    } else {
      await route.continue();
    }
  });
}

/** Login through the real UI form with mock routes already installed. */
export async function loginAs(page: Page, role: MockUser['role']) {
  const user = MOCK_USERS[role];
  await mockAuth(page, role);
  await page.goto('/login');
  await page.fill('input[type="email"]', user.email);
  await page.fill('input[type="password"]', 'QaPassword123!');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(new RegExp(ROLE_DASHBOARD[role]), { timeout: 15_000 });
}