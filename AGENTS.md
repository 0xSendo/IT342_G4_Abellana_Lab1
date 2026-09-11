# AGENTS.md — InternMatch

## QA ownership: the repository's GitHub Actions pipeline is the ONLY verifier
- Never validate your own implementation by reading or auditing code structure (file layout, "required" files, endpoints, pages) — that is structural review, NOT verification.
- Never treat a local test-suite run as the gate. Local runs are troubleshooting only.
- After implementing anything the user asks, hand it to the pipeline: commit → push a branch → open a pull request. The GitHub Actions workflow (`.github/workflows/ci.yml`) is the authority. It runs the full automated suite (backend JUnit + MockMvc, frontend Vitest, Playwright E2E) against every PR and push to `main`/`develop`.
- Iterate ONLY on the failures the pipeline reports. The required check name is `Backend + Frontend tests`. Loop: implement → push PR → the pipeline reports reds → fix exactly what it reported → push again → repeat until green.
- `main` is protected: pull requests are required and must pass the `Backend + Frontend tests` check before merge; direct pushes are blocked. Render (backend) and Vercel (frontend) auto-deploy from `main`, so only green code reaches production. If the pipeline reds, you are notified by GitHub and nothing merges.

## Commands (human / troubleshooting ONLY — not the gate)
- Full local run + Allure report: `npm run test:report` (repo root) — runs clean → backend → unit → frontend → generate; exit 0 = green, exit 1 = some suite failed but the report is still rendered.
- Open dashboard in browser: `npm run report:open`
- Granular: `npm run test:backend` (JUnit/MockMvc), `npm run test:unit` (Vitest), `npm run test:frontend` (Playwright), `npm run report:generate`
- Dashboard file: `allure-report/index.html`
- Authoritative pipeline results: GitHub Actions `.github/workflows/ci.yml` — check `Backend + Frontend tests`. Poll with `gh pr checks` (or the GitHub REST API).