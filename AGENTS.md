# AGENTS.md — InternMatch

## QA ownership: the code-tester is the ONLY verifier
- Never validate your own implementation by reading or auditing the code structure (e.g. checking that "required files / endpoints / pages exist"). That is structural review and is NOT verification.
- After implementing anything the user asks, delegate verification to the code-tester agent (`.opencode/agent/code-tester.md`, invoked as `@code-tester` / subagent_type `code-tester`). It runs the full automated suite (backend JUnit + frontend Playwright), reads the Allure report, and opens the dashboard in the user's browser.
- Iterate ONLY on the failures the code-tester reports. The Allure dashboard (`allure-report/widgets/summary.json`) is the source of truth. Loop: implement → `@code-tester` → fix the reported reds → repeat until PASS.

## Commands (human / troubleshooting)
- Full verify + report: `npm run test:report` (repo root) — runs clean → backend → frontend → generate; exit 0 = green, exit 1 = some suite failed but the report is still rendered.
- Open dashboard in browser: `npm run report:open`
- Granular: `npm run test:backend`, `npm run test:frontend`, `npm run report:generate`
- Dashboard file: `allure-report/index.html`