#!/usr/bin/env node
// Idempotently configure the local repo to install @decoperations/* packages
// from GitHub Packages. Safe to run multiple times — re-running is a no-op
// once the scope line and registry auth line are present.
//
// Usage (from a consuming repo):
//   curl -fsSL https://raw.githubusercontent.com/DecOperations/OWASP.WTF/main/scripts/setup-github-packages.mjs | node -
//   # or after vendoring the file:
//   node scripts/setup-github-packages.mjs
//
// See docs/github-packages.md for the full setup, including the
// NODE_AUTH_TOKEN env var and cross-org PAT (DECOPERATIONS_NPM_TOKEN).

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const NPMRC = resolve(process.cwd(), '.npmrc');
const SCOPE_LINE = '@decoperations:registry=https://npm.pkg.github.com';
const AUTH_LINE = '//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}';

const existing = existsSync(NPMRC) ? readFileSync(NPMRC, 'utf8') : '';
const lines = existing.split(/\r?\n/);

const hasScope = lines.some((l) => l.trim() === SCOPE_LINE);
const hasAuth = lines.some((l) => l.trim() === AUTH_LINE);

if (hasScope && hasAuth) {
  console.log('.npmrc already configured for @decoperations — no changes.');
  process.exit(0);
}

const additions = [];
if (!hasScope) additions.push(SCOPE_LINE);
if (!hasAuth) additions.push(AUTH_LINE);

const needsLeadingNewline = existing.length > 0 && !existing.endsWith('\n');
const next = existing + (needsLeadingNewline ? '\n' : '') + additions.join('\n') + '\n';

writeFileSync(NPMRC, next);
console.log(`Updated .npmrc with ${additions.length} line(s):`);
for (const a of additions) console.log(`  + ${a}`);
console.log('\nNext: set NODE_AUTH_TOKEN in your shell or CI env.');
console.log('See https://github.com/DecOperations/OWASP.WTF/blob/main/docs/github-packages.md');
