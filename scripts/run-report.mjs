// Test orchestrator for the unified Allure report.
//
// Runs BOTH test suites even if one fails (so the report is complete),
// always regenerates the Allure report, and exits non-zero if any suite
// failed so CI still fails.
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function run(script) {
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const result = spawnSync(npm, ['run', script], {
    cwd: root,
    stdio: 'inherit',
    shell: true,
  });
  return result.status ?? 1;
}

const steps = ['clean:results', 'test:backend', 'test:unit', 'test:frontend', 'report:generate'];

const results = {};
let failed = false;

for (const script of steps) {
  const code = run(script);
  results[script] = code;
  if (code !== 0 && script.startsWith('test:')) {
    failed = true;
  }
}

console.log('\n[run-report] results:');
for (const script of steps) {
  console.log(`  ${script}: ${results[script] === 0 ? 'OK' : `FAILED (exit ${results[script]})`}`);
}
if (failed) {
  console.log('[run-report] One or more test suites failed. Report still generated for inspection.');
}

process.exit(failed ? 1 : 0);