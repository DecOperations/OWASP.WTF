/**
 * SARIF 2.1.0 schema validation tests (issue #17).
 *
 * Verifies:
 *  1. The golden SARIF fixture produced by the native scanner validates.
 *  2. Minimal valid SARIF validates.
 *  3. Deliberately-broken SARIF (missing required fields) does NOT validate.
 *  4. Newly-emitted SARIF from a real scan over our test fixtures validates.
 *
 * Also exercises the CLI validate-sarif.mjs script end-to-end so CI
 * usage of it is regression-protected.
 *
 * Run via:  node --test packages/cli/test/sarif-schema.test.mjs
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, copyFileSync, readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import Ajv from 'ajv-draft-04';
import addFormats from 'ajv-formats';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const SCHEMA_PATH = resolve(__dirname, 'schemas', 'sarif-2.1.0.json');
const GOLDEN_PATH = resolve(__dirname, 'fixtures', 'golden.sarif');
const FIXTURES_DIR = resolve(__dirname, 'fixtures');
const CLI = resolve(__dirname, '..', 'dist', 'index.js');
const VALIDATOR = resolve(__dirname, '..', 'scripts', 'validate-sarif.mjs');

function loadSchemaValidator() {
  const schema = JSON.parse(readFileSync(SCHEMA_PATH, 'utf-8'));
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  return ajv.compile(schema);
}

const validate = loadSchemaValidator();

test('schema file exists and is parseable', () => {
  assert.ok(existsSync(SCHEMA_PATH), `Schema not committed at ${SCHEMA_PATH}`);
  const schema = JSON.parse(readFileSync(SCHEMA_PATH, 'utf-8'));
  assert.match(schema.title || '', /SARIF.*2\.1\.0/i, 'Schema title looks right');
});

test('golden fixture validates against SARIF 2.1.0 schema', () => {
  assert.ok(existsSync(GOLDEN_PATH), `Golden fixture missing at ${GOLDEN_PATH}`);
  const golden = JSON.parse(readFileSync(GOLDEN_PATH, 'utf-8'));
  const ok = validate(golden);
  if (!ok) {
    const summary = (validate.errors || []).slice(0, 5).map((e) => `${e.instancePath}: ${e.message}`).join('\n  ');
    assert.fail(`Golden fixture failed schema validation:\n  ${summary}`);
  }
  assert.ok(Array.isArray(golden.runs) && golden.runs.length > 0, 'Golden has at least one run');
  assert.ok((golden.runs[0].results || []).length > 0, 'Golden has at least one result');
});

test('minimal valid SARIF passes', () => {
  const minimal = {
    $schema: 'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json',
    version: '2.1.0',
    runs: [{ tool: { driver: { name: 'minimal-tool' } }, results: [] }],
  };
  assert.ok(validate(minimal), `Minimal SARIF should validate: ${JSON.stringify(validate.errors)}`);
});

test('SARIF without `runs` array fails validation', () => {
  const broken = {
    $schema: 'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json',
    version: '2.1.0',
  };
  assert.ok(!validate(broken), 'SARIF missing required `runs` field must fail');
});

test('SARIF with wrong version fails validation', () => {
  const broken = {
    $schema: 'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json',
    version: 'wrong-version',
    runs: [{ tool: { driver: { name: 'x' } } }],
  };
  assert.ok(!validate(broken), 'SARIF with non-2.1.0 version must fail');
});

test('SARIF run missing tool.driver fails validation', () => {
  const broken = {
    $schema: 'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json',
    version: '2.1.0',
    runs: [{ results: [] }],
  };
  assert.ok(!validate(broken), 'SARIF run missing tool.driver must fail');
});

test('freshly-emitted SARIF from a scan validates', () => {
  assert.ok(existsSync(CLI), `CLI not built at ${CLI} — run pnpm build first`);
  const dir = mkdtempSync(join(tmpdir(), 'owasp-wtf-sarif-'));
  try {
    mkdirSync(join(dir, 'src'), { recursive: true });
    copyFileSync(join(FIXTURES_DIR, 'a03-injection.ts'), join(dir, 'src', 'a03-injection.ts'));
    const r = spawnSync(
      'node',
      [CLI, 'scan', '.', '--no-banner', '--format', 'sarif', '--output', 'out.sarif'],
      { cwd: dir, encoding: 'utf-8', env: { ...process.env, NO_COLOR: '1' } },
    );
    // exit 0 = clean, 1 = high+, 2 = critical+. All three are fine —
    // the scanner ran and emitted SARIF. Anything else is a crash.
    if (![0, 1, 2].includes(r.status)) {
      assert.fail(`CLI crashed (exit ${r.status}): ${r.stderr}`);
    }
    const sarif = JSON.parse(readFileSync(join(dir, 'out.sarif'), 'utf-8'));
    if (!validate(sarif)) {
      const summary = (validate.errors || []).slice(0, 5).map((e) => `${e.instancePath}: ${e.message}`).join('\n  ');
      assert.fail(`Freshly-emitted SARIF failed schema validation:\n  ${summary}`);
    }
  } finally {
    try { rmSync(dir, { recursive: true, force: true }); } catch { /* noop */ }
  }
});

test('validate-sarif.mjs CLI exits 0 on golden + prints summary', () => {
  const r = spawnSync('node', [VALIDATOR, GOLDEN_PATH], { encoding: 'utf-8' });
  assert.equal(r.status, 0, `validator should exit 0; got ${r.status}. stderr: ${r.stderr}`);
  assert.match(r.stdout, /SARIF valid:\s+\d+ results,\s+\d+ rules/, 'prints summary');
});

test('validate-sarif.mjs CLI exits 1 on invalid SARIF', () => {
  const dir = mkdtempSync(join(tmpdir(), 'owasp-wtf-sarif-bad-'));
  try {
    const badPath = join(dir, 'bad.sarif');
    writeFileSync(badPath, JSON.stringify({ version: '2.1.0' }), 'utf-8');
    const r = spawnSync('node', [VALIDATOR, badPath], { encoding: 'utf-8' });
    assert.equal(r.status, 1, `validator should exit 1 on invalid SARIF; got ${r.status}`);
    assert.match(r.stderr, /SARIF invalid/, 'reports invalidity to stderr');
  } finally {
    try { rmSync(dir, { recursive: true, force: true }); } catch { /* noop */ }
  }
});

test('validate-sarif.mjs CLI exits 2 on missing file', () => {
  const r = spawnSync('node', [VALIDATOR, '/no/such/path.sarif'], { encoding: 'utf-8' });
  assert.equal(r.status, 2, `validator should exit 2 on missing file; got ${r.status}`);
  assert.match(r.stderr, /not found/i);
});
