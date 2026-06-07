/**
 * Native-rule fixture regression tests (issue #16).
 *
 * For each fixture under test/fixtures/, run the CLI scan and assert
 * that the expected rule(s) fire with the expected OWASP category,
 * severity, and a stable fingerprint. clean.ts is asserted to produce
 * zero findings. Determinism is checked by running the scan twice and
 * comparing fingerprint sets.
 *
 * Fixtures live under `test/fixtures/` but are copied into a tmpdir as
 * `src/<name>.ts` before scanning — several rules skip files whose path
 * contains "test" or "spec", which would otherwise mask all findings.
 *
 * Run via:  node --test packages/cli/test/native-rules.test.mjs
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, copyFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const CLI = resolve(__dirname, '..', 'dist', 'index.js');
const FIXTURES_DIR = resolve(__dirname, 'fixtures');

const FIXTURES = [
  {
    file: 'a01-broken-access-control.ts',
    category: 'A01:2021-Broken-Access-Control',
    expectedRules: ['A01-CORS-WILDCARD', 'A01-NO-AUTH-MIDDLEWARE', 'A01-IDOR'],
  },
  {
    file: 'a02-cryptographic-failures.ts',
    category: 'A02:2021-Cryptographic-Failures',
    expectedRules: ['A02-WEAK-HASH', 'A02-HTTP-URL', 'A02-SSL-DISABLED'],
  },
  {
    file: 'a03-injection.ts',
    category: 'A03:2021-Injection',
    expectedRules: ['A03-EVAL', 'A03-COMMAND-INJECTION', 'A03-SQL-INJECTION', 'A03-XSS', 'A03-PATH-TRAVERSAL'],
  },
  {
    file: 'a05-security-misconfiguration.ts',
    category: 'A05:2021-Security-Misconfiguration',
    expectedRules: ['A05-DEBUG-ENABLED', 'A05-DEFAULT-CREDS', 'A05-VERBOSE-ERRORS', 'A05-MISSING-HEADERS'],
  },
  {
    file: 'a07-auth-failures.ts',
    category: 'A07:2021-Auth-Failures',
    expectedRules: ['A07-WEAK-PASSWORD', 'A07-NO-RATE-LIMIT', 'A07-SESSION-IN-URL', 'A07-JWT-NO-EXPIRY'],
  },
  {
    file: 'a09-logging-failures.ts',
    category: 'A09:2021-Logging-Failures',
    expectedRules: ['A09-SENSITIVE-LOG', 'A09-CONSOLE-SENSITIVE', 'A09-EMPTY-CATCH'],
  },
  {
    file: 'a10-ssrf.ts',
    category: 'A10:2021-SSRF',
    expectedRules: ['A10-SSRF'],
  },
];

function stageFixtures() {
  const dir = mkdtempSync(join(tmpdir(), 'owasp-wtf-fixtures-'));
  const srcDir = join(dir, 'src');
  mkdirSync(srcDir, { recursive: true });
  for (const f of FIXTURES) {
    copyFileSync(join(FIXTURES_DIR, f.file), join(srcDir, f.file));
  }
  copyFileSync(join(FIXTURES_DIR, 'clean.ts'), join(srcDir, 'clean.ts'));
  // A10 additional fixtures
  copyFileSync(join(FIXTURES_DIR, 'a10-ssrf-vuln.py'), join(srcDir, 'a10-ssrf-vuln.py'));
  copyFileSync(join(FIXTURES_DIR, 'a10-ssrf-clean.ts'), join(srcDir, 'a10-ssrf-clean.ts'));
  return { dir, srcDir };
}

function runScan(cwd) {
  const r = spawnSync(
    'node',
    [CLI, 'scan', '.', '--no-banner', '--format', 'json', '--output', 'report.json'],
    {
      cwd,
      encoding: 'utf-8',
      env: { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0' },
    },
  );
  if (r.status !== 0 && r.status !== 1 && r.status !== 2) {
    throw new Error(`CLI crashed (exit ${r.status}): ${r.stderr || r.stdout}`);
  }
  const reportPath = join(cwd, 'report.json');
  if (!existsSync(reportPath)) {
    throw new Error(`No report.json produced. stderr: ${r.stderr}`);
  }
  return JSON.parse(readFileSync(reportPath, 'utf-8'));
}

function teardown(dir) {
  try { rmSync(dir, { recursive: true, force: true }); } catch { /* noop */ }
}

// ─── shared setup ──────────────────────────────────────────────────────────
let staged;
let report;

test('setup: CLI binary exists', () => {
  assert.ok(existsSync(CLI), `CLI not built at ${CLI} — run pnpm build first`);
});

test('setup: stage fixtures and run a single scan', () => {
  staged = stageFixtures();
  report = runScan(staged.dir);
  assert.ok(Array.isArray(report.findings), 'report.findings is an array');
});

// ─── per-fixture assertions ────────────────────────────────────────────────
for (const fix of FIXTURES) {
  test(`${fix.file} → produces findings in ${fix.category}`, () => {
    const findings = report.findings.filter((f) => (f.file || '').endsWith(fix.file));
    assert.ok(
      findings.length > 0,
      `Expected at least one finding in ${fix.file}; got 0. Other findings: ${report.findings.map((f) => f.file).join(', ')}`,
    );

    const rulesHit = new Set(findings.map((f) => f.id));
    const missing = fix.expectedRules.filter((r) => !rulesHit.has(r));
    assert.equal(
      missing.length,
      0,
      `Expected rules ${JSON.stringify(fix.expectedRules)} to fire in ${fix.file}; missing: ${JSON.stringify(missing)}. Got: ${JSON.stringify([...rulesHit])}`,
    );

    for (const f of findings) {
      assert.ok(f.severity, `${f.id}: severity must be non-null`);
      assert.ok(['critical', 'high', 'medium', 'low', 'info'].includes(f.severity), `${f.id}: severity '${f.severity}' is valid`);
      assert.ok(f.fingerprint, `${f.id}: fingerprint must be non-null (deduplication key)`);
      assert.ok(typeof f.fingerprint === 'string' && f.fingerprint.length >= 8, `${f.id}: fingerprint looks like a hash`);
      assert.ok(Array.isArray(f.owaspTop10), `${f.id}: owaspTop10 array present`);
      if (fix.expectedRules.includes(f.id)) {
        assert.ok(
          f.owaspTop10.includes(fix.category),
          `${f.id}: expected owaspTop10 to include ${fix.category}, got ${JSON.stringify(f.owaspTop10)}`,
        );
      }
    }
  });
}

// ─── clean fixture ─────────────────────────────────────────────────────────
test('clean.ts produces zero findings', () => {
  const findings = report.findings.filter((f) => (f.file || '').endsWith('clean.ts'));
  assert.equal(
    findings.length,
    0,
    `clean.ts must produce 0 findings; got ${findings.length}: ${findings.map((f) => `${f.id} (${f.severity})`).join(', ')}`,
  );
});

// ─── A10 additional fixtures ───────────────────────────────────────────────
test('a10-ssrf-vuln.py produces SSRF findings', () => {
  const findings = report.findings.filter((f) => (f.file || '').endsWith('a10-ssrf-vuln.py'));
  assert.ok(findings.length > 0, 'Expected at least one finding in a10-ssrf-vuln.py');
  assert.ok(findings.some((f) => f.id === 'A10-SSRF'), 'Expected A10-SSRF to fire in py fixture');
});

test('a10-ssrf-clean.ts produces zero findings', () => {
  const findings = report.findings.filter((f) => (f.file || '').endsWith('a10-ssrf-clean.ts'));
  assert.equal(
    findings.length,
    0,
    `a10-ssrf-clean.ts must produce 0 findings; got ${findings.length}: ${findings.map((f) => `${f.id} (${f.severity})`).join(', ')}`,
  );
});

// ─── determinism ───────────────────────────────────────────────────────────
test('two sequential scans produce identical fingerprint sets', () => {
  const second = runScan(staged.dir);
  const firstFps = new Set(report.findings.map((f) => f.fingerprint));
  const secondFps = new Set(second.findings.map((f) => f.fingerprint));
  assert.equal(firstFps.size, secondFps.size, 'finding count is stable across runs');
  for (const fp of firstFps) {
    assert.ok(secondFps.has(fp), `fingerprint ${fp} was present in run 1 but missing in run 2`);
  }
});

// ─── teardown ──────────────────────────────────────────────────────────────
test('teardown: clean up tmpdir', () => {
  if (staged?.dir) teardown(staged.dir);
});
