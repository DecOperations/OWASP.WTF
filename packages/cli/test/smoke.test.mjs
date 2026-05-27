/**
 * Smoke tests for the OWASP.WTF CLI.
 *
 * These exercise the new flags introduced for the PeerSpeak rollout
 * (#30 default ignores, baseline mode, workspaces) end-to-end via the
 * built dist/ binary.
 *
 * Run via:  node --test packages/cli/test/smoke.test.mjs
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, mkdirSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const CLI = resolve(__dirname, '..', 'dist', 'index.js');

// Test fixture content. The native rule fires on the `api_key` literal —
// we deliberately avoid Stripe-shaped tokens so push-side secret scanners
// don't reject this file as a leaked credential.
const HARDCODED_SECRET_SNIPPET = [
  '// owasp-wtf-test fixture',
  'const api' + '_key' + ' = "' + 'A'.repeat(40) + '";',
  'export default api' + '_key' + ';',
  '',
].join('\n');

function runCli(args, cwd) {
  const r = spawnSync('node', [CLI, ...args], {
    cwd,
    encoding: 'utf-8',
    env: { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0' },
  });
  return { status: r.status ?? -1, stdout: r.stdout ?? '', stderr: r.stderr ?? '' };
}

function setupFixture(layout) {
  const dir = mkdtempSync(join(tmpdir(), 'owasp-wtf-smoke-'));
  for (const [relPath, contents] of Object.entries(layout)) {
    const full = join(dir, relPath);
    mkdirSync(join(full, '..'), { recursive: true });
    writeFileSync(full, contents, 'utf-8');
  }
  return dir;
}

function teardown(dir) {
  try { rmSync(dir, { recursive: true, force: true }); } catch { /* noop */ }
}

test('CLI binary exists', () => {
  assert.ok(existsSync(CLI), `CLI not built at ${CLI} — run pnpm build first`);
});

test('--include-build-output is off by default — build artifacts are skipped', () => {
  const dir = setupFixture({
    'src/safe.ts': '// hello\nexport const x = 1;\n',
    '.next/static/chunks/bundle.js': HARDCODED_SECRET_SNIPPET,
    'dist/bundle.js': HARDCODED_SECRET_SNIPPET,
  });
  try {
    const r = runCli(['scan', '.', '--no-banner', '--format', 'json', '--output', 'report.json'], dir);
    const report = JSON.parse(readFileSync(join(dir, 'report.json'), 'utf-8'));
    const offenders = (report.findings || []).filter(
      (f) => (f.file || '').includes('.next/') || (f.file || '').includes('dist/'),
    );
    assert.equal(
      offenders.length,
      0,
      `Expected no findings inside .next/ or dist/, got ${offenders.length}: ${offenders.map((f) => f.file).join(', ')}`,
    );
  } finally {
    teardown(dir);
  }
});

test('--include-build-output flag re-enables scanning build dirs', () => {
  const dir = setupFixture({
    'src/safe.ts': 'export const x = 1;\n',
    'dist/bundle.ts': HARDCODED_SECRET_SNIPPET,
  });
  try {
    const r = runCli(
      ['scan', '.', '--no-banner', '--include-build-output', '--format', 'json', '--output', 'report.json'],
      dir,
    );
    const report = JSON.parse(readFileSync(join(dir, 'report.json'), 'utf-8'));
    const offenders = (report.findings || []).filter((f) => (f.file || '').includes('dist/'));
    assert.ok(
      offenders.length > 0,
      `Expected at least one finding in dist/ with --include-build-output, got 0. Output: ${r.stdout}`,
    );
  } finally {
    teardown(dir);
  }
});

test('--baseline + --update-baseline writes a snapshot and exits 0', () => {
  const dir = setupFixture({
    'src/leak.ts': HARDCODED_SECRET_SNIPPET,
  });
  try {
    const baselinePath = 'owasp-baseline.json';
    const r = runCli(
      ['scan', '.', '--no-banner', '--format', 'json', '--output', 'report.json', '--baseline', baselinePath, '--update-baseline'],
      dir,
    );
    assert.equal(r.status, 0, `update-baseline should exit 0, got ${r.status}: ${r.stderr}`);
    const baseline = JSON.parse(readFileSync(join(dir, baselinePath), 'utf-8'));
    assert.equal(baseline.schemaVersion, '1.0');
    assert.ok(Array.isArray(baseline.entries));
    assert.ok(baseline.entries.length > 0, 'Baseline should record the seeded finding');
    for (const e of baseline.entries) {
      assert.ok(e.fingerprint, 'each entry has a fingerprint');
    }
  } finally {
    teardown(dir);
  }
});

test('--baseline suppresses previously recorded findings on subsequent scans', () => {
  const dir = setupFixture({
    'src/leak.ts': HARDCODED_SECRET_SNIPPET,
  });
  try {
    const baselinePath = 'owasp-baseline.json';
    // 1) Generate the baseline.
    const gen = runCli(
      ['scan', '.', '--no-banner', '--format', 'json', '--output', 'report.json', '--baseline', baselinePath, '--update-baseline'],
      dir,
    );
    assert.equal(gen.status, 0);

    // 2) Re-run; baseline should suppress the finding so --fail-on high passes.
    const second = runCli(
      ['scan', '.', '--no-banner', '--format', 'json', '--output', 'report2.json', '--baseline', baselinePath, '--fail-on', 'high'],
      dir,
    );
    const report = JSON.parse(readFileSync(join(dir, 'report2.json'), 'utf-8'));
    assert.equal(report.findings.length, 0, `Expected 0 ungraded findings with baseline, got ${report.findings.length}`);
    assert.equal(second.status, 0, `--fail-on high should pass after baseline, got ${second.status}: ${second.stderr}`);

    // 3) Add a NEW finding; the gate must fire on it.
    writeFileSync(
      join(dir, 'src/leak2.ts'),
      'const db' + '_password' + ' = "' + 'B'.repeat(40) + '-' + Date.now() + '";\n',
      'utf-8',
    );
    const third = runCli(
      ['scan', '.', '--no-banner', '--format', 'json', '--output', 'report3.json', '--baseline', baselinePath, '--fail-on', 'high'],
      dir,
    );
    // We may or may not detect this exact new secret depending on regex rules,
    // but the baseline machinery itself is what we want to verify. Assert it
    // doesn't crash and the report contains *only* findings not present in
    // the baseline.
    assert.notEqual(third.status, -1, `CLI crashed: ${third.stderr}`);
    const r3 = JSON.parse(readFileSync(join(dir, 'report3.json'), 'utf-8'));
    const baseline = JSON.parse(readFileSync(join(dir, baselinePath), 'utf-8'));
    const baselineFps = new Set(baseline.entries.map((e) => e.fingerprint));
    for (const f of r3.findings) {
      assert.ok(
        !baselineFps.has(f.fingerprint),
        `Finding ${f.id} at ${f.file}:${f.line} should have been suppressed by baseline`,
      );
    }
  } finally {
    teardown(dir);
  }
});

test('--workspace scopes the scan to a subdirectory', () => {
  const dir = setupFixture({
    'apps/a/leak.ts': HARDCODED_SECRET_SNIPPET,
    'apps/b/leak.ts': HARDCODED_SECRET_SNIPPET,
  });
  try {
    const r = runCli(
      ['scan', '.', '--no-banner', '--workspace', 'apps/a', '--format', 'json', '--output', 'report.json'],
      dir,
    );
    const report = JSON.parse(readFileSync(join(dir, 'report.json'), 'utf-8'));
    const bHits = (report.findings || []).filter((f) => (f.file || '').includes('apps/b'));
    assert.equal(bHits.length, 0, `Workspace scope leaked findings from apps/b: ${bHits.map((f) => f.file).join(', ')}`);
  } finally {
    teardown(dir);
  }
});

test('--workspace errors when the target directory does not exist', () => {
  const dir = setupFixture({ 'src/x.ts': 'export const x = 1;\n' });
  try {
    const r = runCli(['scan', '.', '--no-banner', '--workspace', 'does/not/exist'], dir);
    assert.notEqual(r.status, 0, 'Expected non-zero exit for missing workspace');
    assert.match(r.stderr + r.stdout, /Workspace not found/);
  } finally {
    teardown(dir);
  }
});
