#!/usr/bin/env node

/**
 * Release script for @decoperations/owasp-wtf CLI.
 *
 * Usage:
 *   pnpm release:cli              # auto-detect bump from commits (default: patch)
 *   pnpm release:cli patch        # 0.1.0 -> 0.1.1
 *   pnpm release:cli minor        # 0.1.0 -> 0.2.0
 *   pnpm release:cli major        # 0.1.0 -> 1.0.0
 *   pnpm release:cli 1.2.3        # explicit version
 *
 * What it does:
 *   1. Bumps version in packages/cli/package.json
 *   2. Updates version references in src/index.ts
 *   3. Rebuilds the CLI
 *   4. Commits, pushes to main
 *   5. CI auto-detects the version change and publishes to GitHub Packages
 *
 * Designed for AI agents (Claude Code, Codex, etc.) to run unattended.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const CLI_PKG_PATH = resolve(ROOT, 'packages/cli/package.json');
const CLI_INDEX_PATH = resolve(ROOT, 'packages/cli/src/index.ts');

function run(cmd) {
  console.log(`  $ ${cmd}`);
  return execSync(cmd, { cwd: ROOT, encoding: 'utf-8', stdio: 'inherit' });
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf-8'));
}

function writeJson(path, data) {
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

function bumpVersion(current, bump) {
  const [major, minor, patch] = current.split('.').map(Number);
  switch (bump) {
    case 'major': return `${major + 1}.0.0`;
    case 'minor': return `${major}.${minor + 1}.0`;
    case 'patch': return `${major}.${minor}.${patch + 1}`;
    default: {
      // Check if it's an explicit semver
      if (/^\d+\.\d+\.\d+/.test(bump)) return bump;
      return `${major}.${minor}.${patch + 1}`;
    }
  }
}

function detectBumpFromCommits() {
  try {
    const log = execSync('git log --oneline HEAD~10..HEAD 2>/dev/null', { cwd: ROOT, encoding: 'utf-8' });
    if (/\bBREAKING\b/i.test(log)) return 'major';
    if (/\bfeat[:(]/i.test(log)) return 'minor';
    return 'patch';
  } catch {
    return 'patch';
  }
}

// ─────────────────────────────────────────────────────────────────────────────

const arg = process.argv[2];
const pkg = readJson(CLI_PKG_PATH);
const currentVersion = pkg.version;

const bump = arg || detectBumpFromCommits();
const newVersion = bumpVersion(currentVersion, bump);

console.log('');
console.log(`  @decoperations/owasp-wtf release`);
console.log(`  ${currentVersion} -> ${newVersion}`);
console.log('');

// 1. Update package.json version
pkg.version = newVersion;
writeJson(CLI_PKG_PATH, pkg);
console.log(`  Updated packages/cli/package.json`);

// 2. Update version in index.ts banner
let indexContent = readFileSync(CLI_INDEX_PATH, 'utf-8');
indexContent = indexContent.replace(
  /\.version\('[\d.]+'\)/,
  `.version('${newVersion}')`,
);
indexContent = indexContent.replace(
  /v[\d.]+(?='?\s*\n`)/,
  `v${newVersion}`,
);
writeFileSync(CLI_INDEX_PATH, indexContent, 'utf-8');
console.log(`  Updated packages/cli/src/index.ts`);

// 3. Build
console.log('');
run('pnpm build --filter @decoperations/owasp-wtf');

// 4. Commit and push
console.log('');
run(`git add packages/cli/package.json packages/cli/src/index.ts`);
run(`git commit -m "release: @decoperations/owasp-wtf v${newVersion}"`);
run(`git push origin main`);

console.log('');
console.log(`  Released v${newVersion}`);
console.log(`  CI will auto-publish to GitHub Packages and create a GitHub Release.`);
console.log('');
