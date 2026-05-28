#!/usr/bin/env node
/**
 * Validate a SARIF file against the official SARIF 2.1.0 JSON Schema.
 *
 * Usage:
 *   node packages/cli/scripts/validate-sarif.mjs <path-to-sarif>
 *
 * Exit codes:
 *   0 — valid SARIF; prints `SARIF valid: N results, M rules`
 *   1 — schema validation failed; prints first ~20 errors
 *   2 — file not found, unreadable, or not parseable as JSON
 *
 * Why this exists:
 * Malformed SARIF fails silently in GitHub code scanning — the UI shows
 * zero findings without any error. For a security tool that's the most
 * dangerous failure mode (silent green CI). This script catches it
 * before the upload step runs.
 *
 * Tracked by: https://github.com/DecOperations/OWASP.WTF/issues/17
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv-draft-04';
import addFormats from 'ajv-formats';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = resolve(__dirname, '..', 'test', 'schemas', 'sarif-2.1.0.json');

function fail(code, msg) {
  process.stderr.write(`${msg}\n`);
  process.exit(code);
}

const target = process.argv[2];
if (!target) {
  fail(2, 'Usage: validate-sarif.mjs <path-to-sarif>');
}
if (!existsSync(target)) {
  fail(2, `SARIF file not found: ${target}`);
}

let doc;
try {
  doc = JSON.parse(readFileSync(target, 'utf-8'));
} catch (err) {
  fail(2, `SARIF file is not valid JSON: ${err.message}`);
}

let schema;
try {
  schema = JSON.parse(readFileSync(SCHEMA_PATH, 'utf-8'));
} catch (err) {
  fail(2, `Schema not readable at ${SCHEMA_PATH}: ${err.message}`);
}

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const validate = ajv.compile(schema);

if (validate(doc)) {
  const results = (doc.runs ?? []).reduce((a, r) => a + (r.results?.length ?? 0), 0);
  const rules = (doc.runs ?? []).reduce(
    (a, r) => a + (r.tool?.driver?.rules?.length ?? 0),
    0,
  );
  process.stdout.write(`SARIF valid: ${results} results, ${rules} rules\n`);
  process.exit(0);
}

const errors = validate.errors ?? [];
process.stderr.write(`SARIF invalid: ${errors.length} error(s) against SARIF 2.1.0 schema\n`);
for (const err of errors.slice(0, 20)) {
  const path = err.instancePath || '<root>';
  process.stderr.write(`  ${path}: ${err.message}\n`);
}
if (errors.length > 20) {
  process.stderr.write(`  … ${errors.length - 20} more error(s) suppressed\n`);
}
process.exit(1);
